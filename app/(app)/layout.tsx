import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getMonthlyLimit } from "@/lib/subscription/limits";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from "next/link";
import Image from "next/image";
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Получаем пользователя из Prisma с avatarUrl
  const dbUser = await prisma.user.findUnique({
    where: { supabaseUserId: user.id },
    select: {
      email: true,
      fullName: true,
      avatarUrl: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      checksUsedThisMonth: true,
    },
  });

  const plan = dbUser?.subscriptionPlan ?? "free";
  const status = dbUser?.subscriptionStatus ?? "inactive";
  const checksUsed = dbUser?.checksUsedThisMonth ?? 0;

  const userData = {
    email: dbUser?.email ?? user.email ?? "trader@pretrade.ai",
    fullName: dbUser?.fullName ?? null,
    avatarUrl: dbUser?.avatarUrl ?? null,
    subscriptionPlan: plan,
    subscriptionStatus: status,
    checksUsed,
    monthlyLimit: getMonthlyLimit({ subscriptionPlan: plan }),
  };

  return (
    <>
      <SidebarProvider>
        <AppSidebar
          user={userData}
        />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2 px-4 relative">
                <SidebarTrigger className="-ml-1 fixed cursor-pointer" />
                {/* <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            /> */}
                {/* <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                  Pre-Trade Risk Checker
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb> */}
              </div>
              <div className="flex  md:hidden">
                <Link href={'/'}>
                  <div className="flex items-center gap-2">
                    <Image
                      src={"/logo-d.png"}
                      alt="Tradefend"
                      width={500}
                      height={600}
                      className="w-6 h-auto hidden dark:block"
                    />
                    <Image
                      src={"/logo.png"}
                      alt="Tradefend"
                      width={500}
                      height={600}
                      className="w-6 h-auto block dark:hidden"
                    />
                    <span className="font-semibold tracking-tight text-foreground">Tradefend</span>
                  </div>
                </Link>
              </div>
              <div className="flex items-center gap-2 px-4">
                <NotificationBell />
              </div>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0 mx-auto w-full pb-10">
            <main className="max-w-6xl w-full mx-auto">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}