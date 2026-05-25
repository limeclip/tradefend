"use client";

import { useRouter, usePathname } from "next/navigation";
import {  ChevronRight, type LucideIcon } from "lucide-react";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function NavAccount({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: { title: string; url: string }[];
  }[];
}) {
  const router = useRouter();
  const pathname = usePathname();

  const handleItemClick = (item: (typeof items)[0]) => {
    if (!item.items?.length) {
      router.push(item.url);
    }
  };

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>
        <Link href={"/"}>
          <div className="flex items-center gap-2 mb-2  ">
            <ArrowLeft  className="text-muted-foreground size-4" />
            <span className="font-medium text-muted-foreground hover:text-foreground">Back to Agent</span>
          </div>
        </Link>
      </SidebarGroupLabel> */}
      <SidebarMenu>
        {items.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;
          const isActuallyActive = pathname === item.url;
          return (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActuallyActive}
                onClick={() => handleItemClick(item)}
                className="[&_svg]:text-muted-foreground gap-2.5  group-data-[collapsible=icon]:[&_svg]:text-foreground! cursor-pointer"
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
                {hasSubItems && (
                  <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}