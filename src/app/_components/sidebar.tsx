"use client";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import { Home, LogOut, Package, ShoppingCartIcon, User } from "lucide-react";
import { usePathname } from "next/navigation";

import Logo from "~/assets/icon.svg";
import Image from "next/image";
import clsx from "clsx";
import Link from "next/link";

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "dashboard",
    icon: Home,
  },
  {
    title: "Users",
    url: "user",
    icon: User,
  },
  {
    title: "Products",
    url: "products",
    icon: Package,
  },
  {
    title: "sales",
    url: "sales",
    icon: ShoppingCartIcon,
  },
];

export function AppSidebar() {
  const path = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("USER-HCGM");
  };

  return (
    <Sidebar collapsible="icon" variant="floating">
      <SidebarHeader>
        {/* <SidebarMenuItem key={"home"}> */}
        {/* <SidebarMenuButton asChild> */}
        {/* <a onClick={() => router.push("dashboard")}> */}
        {/* <Home size={64}/> */}
        <div className="flex items-center justify-start gap-2 px-2 py-4">
          <Image src={Logo as string} alt="404" className="h-10 w-10" />
          <span>HuaChang GrowMax</span>
        </div>
        {/* </a> */}
        {/* </SidebarMenuButton> */}
        {/* </SidebarMenuItem> */}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <div className="flex-1">
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={clsx(
                        path.replace("/", "") === item.url &&
                          "bg-white/30 hover:bg-white/30",
                      )}
                    >
                      <Link href={`/${item.url}`} prefetch={false}>
                        <item.icon size={64} />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </div>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenuItem key={"logout"}>
          <SidebarMenuButton asChild>
            <Link href={`/auth/login`} onClick={handleLogout} prefetch={false}>
              <LogOut size={64} />
              <span>Log Out</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarFooter>
    </Sidebar>
  );
}
