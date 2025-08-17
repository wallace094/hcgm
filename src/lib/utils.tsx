import { Badge } from "~/components/ui/badge";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { NextRequest } from "next/server";
import { NextResponse, userAgent } from "next/server";
import type { ForecastRow } from "~/app/(routes)/(protected_routes)/dashboard/page";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const { device } = userAgent(request);
  const viewport = device.type === "mobile" ? "mobile" : "desktop";
  url.searchParams.set("viewport", viewport);
  return NextResponse.rewrite(url);
}

export function isAdmin(role: string | undefined) {
  if (!role) {
    return false;
  }

  return role.toLowerCase() !== "salesperson";
}

export function isMasterAdmin(role: string | undefined) {
  if (!role) {
    return false;
  }

  return role.replace("_", "").toLowerCase() === "masteradmin";
}

export const calculateTotal = (arr: ForecastRow[] | undefined) => {
  if (arr === undefined || arr.length === 0) {
    return [];
  }
  const type = arr[0]!.type;

  const totalRow = arr.reduce(
    (acc, cur) => {
      acc.central += Number(cur.central) ?? 0;
      acc.e_coast += Number(cur.e_coast) ?? 0;
      acc.south += Number(cur.south) ?? 0;
      acc.north += Number(cur.north) ?? 0;
      return acc;
    },
    {
      id: 0,
      central: 0,
      e_coast: 0,
      south: 0,
      north: 0,
      item_group: "Total",
      type: type,
    } as ForecastRow,
  );

  return [...arr.sort((a, b) => a.id - b.id), totalRow];
};

export const renderStatus = (status: string) => {
  switch (status.toLowerCase()) {
    case "pending":
      return <Badge variant={"pending"}>Pending</Badge>;
    case "approved":
      return <Badge variant={"done"}>Approved</Badge>;
    case "delivered":
      return <Badge variant={"success"}>Delivered</Badge>;
    case "cancelled":
      return <Badge variant={"destructive"}>Cancelled</Badge>;
  }
};
