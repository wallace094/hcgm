"use client";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { useUserStore } from "~/lib/store/useUserStore";
import { type UserType } from "~/lib/types";

export default function Home() {
  const { setUser } = useUserStore();

  useEffect(() => {
    const storedUser = localStorage.getItem("USER-HCGM");

    if (storedUser) {
      const userData = JSON.parse(storedUser) as UserType;
      setUser(userData);
      redirect("/dashboard");
    } else {
      redirect("/auth/login");
    }
  }, [setUser]);

  return null; // ✅ required so Next.js treats this as a valid client component
}
