"use client";
import { Suspense, useEffect, type ReactNode } from "react";
import { AppSidebar } from "~/app/_components/sidebar";
import { SidebarProvider, SidebarTrigger } from "~/components/ui/sidebar";
import { useIsMobile } from "~/hooks/useMobile";
import { Toaster } from "react-hot-toast";
import { useUserStore } from "~/lib/store/useUserStore";
import { type UserType } from "~/lib/types";
import { redirect } from "next/navigation";

const Layout: React.FC<Readonly<{ children: ReactNode }>> = ({ children }) => {
  const isMobile = useIsMobile();

  const { setUser } = useUserStore();

  useEffect(() => {
    const storedUser = localStorage.getItem("USER-HCGM");
    if (storedUser) {
      const userData = JSON.parse(storedUser) as UserType;
      setUser(userData);
    } else {
      redirect("/auth/login");
    }
  }, [setUser]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <Toaster position="top-center" reverseOrder={false} />

      <div className="flex w-full flex-col">
        {isMobile && <SidebarTrigger className="ml-4 mt-4" />}
        <div className="flex w-full flex-col items-start p-4 lg:w-full">
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Layout;
