// constants/enums.ts
import type { DropDownType } from "~/lib/types";

// ✅ Manually define enums (mirroring @prisma/client enums)
export enum ROLE {
  MASTER_ADMIN = "MASTER_ADMIN",
  MANAGER = "MANAGER",
  SALESPERSON = "SALESPERSON",
}

export enum REGION {
  CENTRAL = "CENTRAL",
  EAST_COAST = "EAST_COAST",
  SOUTH = "SOUTH",
  NORTH = "NORTH",
}

export const Roles: DropDownType[] = [
  { id: 1, name: "Master Admin" },
  { id: 2, name: "Manager" },
  { id: 3, name: "Salesperson" },
];

export const Regions: DropDownType[] = [
  { id: 1, name: "Central" },
  { id: 2, name: "East Coast" },
  { id: 3, name: "South" },
  { id: 4, name: "North" },
  { id: 5, name: "All" },
];

export const Category: DropDownType[] = [
  { id: 1, name: "Gold" },
  { id: 2, name: "Product" },
  { id: 3, name: "Straight" },
  { id: 4, name: "Organic" },
];

export const REGION_LABELS: Record<REGION, string> = {
  [REGION.SOUTH]: "South",
  [REGION.EAST_COAST]: "East Coast",
  [REGION.NORTH]: "North",
  [REGION.CENTRAL]: "Central",
};

export const ROLE_LABELS: Record<ROLE, string> = {
  [ROLE.MASTER_ADMIN]: "Master Admin",
  [ROLE.MANAGER]: "Manager",
  [ROLE.SALESPERSON]: "Salesperson",
};
