import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const BUCKET = "avatars";
const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function sanitizeFileName(name: string): string {
  const trimmed = name.trim().replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  return trimmed || "avatar";
}

/** Extract object path inside bucket from public URL */
function publicUrlToStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  try {
    return decodeURIComponent(publicUrl.slice(idx + marker.length));
  } catch {
    return null;
  }
}

async function removeAvatarFromStorage(admin: ReturnType<typeof createServiceRoleClient>, publicUrl: string | null) {
  if (!publicUrl) return;
  const path = publicUrlToStoragePath(publicUrl);
  if (!path) return;
  const { error } = await admin.storage.from(BUCKET).remove([path]);
  if (error) {
    console.error("Storage remove failed:", error.message);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let admin: ReturnType<typeof createServiceRoleClient>;
    try {
      admin = createServiceRoleClient();
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { error: "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 },
      );
    }

    const dbUser =
      (await prisma.user.findUnique({ where: { supabaseUserId: user.id } })) ??
      (await prisma.user.create({
        data: {
          supabaseUserId: user.id,
          email: user.email ?? `${user.id}@supabase.local`,
          fullName: null,
          avatarUrl: null,
        },
      }));

    const formData = await request.formData();
    const entry = formData.get("file");
    if (!(entry instanceof File)) {
      return NextResponse.json({ error: "Missing file field \"file\"." }, { status: 400 });
    }

    const file = entry;
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Use JPEG, PNG, or WebP." },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 2 MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const timestamp = Date.now();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${user.id}/${timestamp}-${safeName}`;

    await removeAvatarFromStorage(admin, dbUser.avatarUrl);

    const { error: uploadError } = await admin.storage.from(BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    });

    if (uploadError) {
      console.error(uploadError);
      return NextResponse.json(
        { error: uploadError.message || "Upload failed." },
        { status: 500 },
      );
    }

    const {
      data: { publicUrl },
    } = admin.storage.from(BUCKET).getPublicUrl(storagePath);

    const updated = await prisma.user.update({
      where: { id: dbUser.id },
      data: { avatarUrl: publicUrl },
      select: { avatarUrl: true },
    });

    return NextResponse.json({ avatarUrl: updated.avatarUrl }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to upload avatar." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let admin: ReturnType<typeof createServiceRoleClient>;
    try {
      admin = createServiceRoleClient();
    } catch (e) {
      console.error(e);
      return NextResponse.json(
        { error: "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY." },
        { status: 503 },
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { supabaseUserId: user.id },
      select: { id: true, avatarUrl: true },
    });

    if (!dbUser) {
      return NextResponse.json({ avatarUrl: null }, { status: 200 });
    }

    await removeAvatarFromStorage(admin, dbUser.avatarUrl);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: { avatarUrl: null },
    });

    return NextResponse.json({ avatarUrl: null }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to remove avatar." }, { status: 500 });
  }
}
