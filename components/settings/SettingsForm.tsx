'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const AVATAR_ACCEPT = ['image/jpeg', 'image/png', 'image/webp'] as const;

type Props = {
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  subscription: {
    plan: string;
    status: string;
    checksUsed: number;
    monthlyLimit: number;
    expiresAt: string | null;
    isPro: boolean;
  };
};

export function SettingsForm({ email, fullName, avatarUrl, subscription }: Props) {
  const router = useRouter();
  const { theme, setTheme, systemTheme } = useTheme();
  const [name, setName] = React.useState(fullName ?? '');
  const [saving, setSaving] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [displayAvatarUrl, setDisplayAvatarUrl] = React.useState<string | null>(avatarUrl);
  const [previewDataUrl, setPreviewDataUrl] = React.useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = React.useState(false);
  const [avatarRemoving, setAvatarRemoving] = React.useState(false);

  React.useEffect(() => {
    setDisplayAvatarUrl(avatarUrl);
  }, [avatarUrl]);

  const getInitials = React.useCallback(() => {
    if (fullName && fullName.trim()) {
      const names = fullName.trim().split(/\s+/);
      if (names.length >= 2) return (names[0][0] + names[1][0]).toUpperCase();
      return names[0].slice(0, 2).toUpperCase();
    }
    return email.slice(0, 2).toUpperCase();
  }, [fullName, email]);

  async function handleAvatarFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!AVATAR_ACCEPT.includes(file.type as (typeof AVATAR_ACCEPT)[number])) {
      toast.error('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      toast.error('Image must be 2 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/user/avatar', {
        method: 'POST',
        body: fd,
      });
      const json = (await res.json().catch(() => null)) as { avatarUrl?: string; error?: string } | null;
      if (!res.ok || !json?.avatarUrl) {
        setPreviewDataUrl(null);
        toast.error(json?.error ?? 'Failed to upload avatar.');
        return;
      }
      setDisplayAvatarUrl(json.avatarUrl);
      setPreviewDataUrl(null);
      toast.success('Profile picture updated.');
      router.refresh();
    } catch {
      setPreviewDataUrl(null);
      toast.error('Network error. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  }

  async function removeAvatar() {
    setAvatarRemoving(true);
    try {
      const res = await fetch('/api/user/avatar', { method: 'DELETE' });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        toast.error(json?.error ?? 'Failed to remove avatar.');
        return;
      }
      setDisplayAvatarUrl(null);
      setPreviewDataUrl(null);
      toast.success('Profile picture removed.');
      router.refresh();
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setAvatarRemoving(false);
    }
  }

  const effectiveTheme = theme === 'system' ? systemTheme : theme;
  const used = Math.max(0, subscription.checksUsed);
  const limit = Math.max(1, subscription.monthlyLimit);
  const progress = Math.min(100, Math.round((used / limit) * 100));
  const isActive = subscription.status === 'active';
  const planLabel =
    isActive && subscription.plan === 'pro_monthly'
      ? 'Pro Monthly'
      : isActive && subscription.plan === 'pro_yearly'
        ? 'Pro Yearly'
        : 'Free';

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ fullName: name }),
      });
      const json = (await res.json().catch(() => null)) as unknown;
      if (!res.ok) {
        const errorMsg = typeof json === 'object' && json !== null && 'error' in json && typeof json.error === 'string'
          ? json.error
          : 'Failed to update profile.';
        toast.error(errorMsg);
        return;
      }
      toast.success('Profile updated successfully!');
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }


  const avatarImageSrc = previewDataUrl ?? displayAvatarUrl ?? undefined;
  const showRemove = Boolean(displayAvatarUrl || previewDataUrl);

  return (
    <div className="space-y-10">
      <form onSubmit={saveProfile} className="space-y-5 bg-background dark:bg-[#1c1c1c] rounded-2xl p-4 border border-border dark:border-border/30">
        <div className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Profile picture</Label>
            <p className="text-sm text-muted-foreground">JPEG, PNG or WebP, up to 2 MB.</p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-16 w-16 rounded-xl">
              {avatarImageSrc ? (
                <AvatarImage src={avatarImageSrc} alt="" className="rounded-xl object-cover" />
              ) : null}
              <AvatarFallback className="rounded-xl text-base">{getInitials()}</AvatarFallback>
            </Avatar>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={AVATAR_ACCEPT.join(',')}
                className="sr-only"
                aria-hidden
                tabIndex={-1}
                onChange={handleAvatarFileChange}
              />
              <Button
                type="button"
                variant="outline"
                className="cursor-pointer"
                disabled={avatarUploading || avatarRemoving}
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarUploading ? 'Uploading…' : 'Upload'}
              </Button>
              {showRemove ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground"
                  disabled={avatarUploading || avatarRemoving}
                  onClick={removeAvatar}
                >
                  {avatarRemoving ? 'Removing…' : 'Remove'}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="settings-email" className="text-sm font-medium text-foreground">
              Email
            </Label>
            <Input
              id="settings-email"
              value={email}
              readOnly
              className="border-border bg-background"
              disabled
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="settings-name" className="text-sm font-medium text-foreground">
              Full name
            </Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Johnson"
              className=" border-border bg-background"
              maxLength={120}
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button type="submit" variant={"outline"} className=" cursor-pointer" disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </form>

      <section className="space-y-3 ">
        <div className="tracking-tight px-2 text-muted-foreground">Appearance</div>
        <div className='bg-background dark:bg-[#1c1c1c] rounded-2xl p-4 border border-border dark:border-border/30'>
          <div className='flex md:flex-row flex-col gap-2 items-start md:items-center w-full  md:justify-between'>
            <div>
              <p className="text-sm font-medium text-foreground">Theme</p>
              <p className="text-sm text-muted-foreground">Choose how PreTrade looks on this device.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size={"sm"}
                variant={theme === 'system' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTheme('system')}
              >
                System{effectiveTheme ? ` (${effectiveTheme})` : ''}
              </Button>
              <Button
                type="button"
                size={"sm"}
                variant={theme === 'light' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTheme('light')}
              >
                Light
              </Button>
              <Button
                type="button"
                size={"sm"}
                variant={theme === 'dark' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setTheme('dark')}
              >
                Dark
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 ">
        <div className="tracking-tight px-2 text-muted-foreground">Billing</div>
        <div className='bg-background dark:bg-[#1c1c1c] rounded-2xl p-4 border border-border dark:border-border/30 space-y-4'>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">

              <p className="text-sm font-medium text-foreground">Subscription</p>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-zinc-100 text-zinc-700'
                }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-zinc-500'}`} />
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>

          <p className="text-sm text-muted-foreground">Plan: <span className="font-medium text-foreground">{planLabel}</span></p>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {used} / {limit} checks used
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          {subscription.expiresAt && subscription.isPro ? (
            <p className="text-sm text-muted-foreground">Expires on {new Date(subscription.expiresAt).toLocaleDateString()}</p>
          ) : null}
          <div className='flex items-center w-full justify-end'>
            <Link href="/pricing" className="inline-flex">
              <Button type="button" variant={"outline"} className="cursor-pointer">
                {subscription.isPro ? 'Manage subscription' : 'Upgrade'}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

