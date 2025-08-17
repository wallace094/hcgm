import { type REGION } from "@prisma/client";

export type UserType = {
  ID: number;
  CREATED_AT: Date;
  NAME: string;
  EMAIL: string;
  PHONE: string;
  ROLE: string;
  CODE: string;
  REGION: REGION;
};

export type CustomerType = {
  ID: number;
  CREATED_AT: Date;
  CODE: string;
  NAME: string;
  SSM_REGISTRATION_NO?: string | null;
  TAX_IDENTIFICATION_NO?: string | null;
  SST_NO?: string | null;
  MSIC_CODE?: string | null;
  BUSINESS_NATURE?: string | null;
  PIC_NAME?: string | null;
  EMAIL?: string | null;
  PHONE_NO?: string | null;
  ADDRESS?: string | null;
  CREDIT_TERM?: string | null;
  ADMIN_ID?: number | null;
  CREDIT_LIMIT?: number | null;
};

export type ProductType = {
  CODE: string;
  NAME: string;
  CATEGORY: string;
  BASE_UOM: string;
  STOCK: number;
  UNIT_PRICE: number;
};

export type TransactionType = {
  ID: number;
  DOC_NUM: string;
  TRANSACTION_DATE: Date;
  CUSTOMER_ID: number;
  ADMIN_ID: number;
  TOTAL_PRICE: number;
  REF_DOC_NO?: string | null;
  DELIVERY_DATE?: Date | null;
  SHIPPING_METHOD?: string | null;
  COMISSION?: number | null;
  REMARK?: string | null;
  STATUS: string;
  LOCATION?: string | null;
};

export interface SalesType extends TransactionType {
  CUSTOMER: CustomerType | undefined;
  ADMIN: UserType | undefined;
  TransactionDetail: TransactionDetailType[] | undefined;
}

export type TransactionDetailType = {
  ID: number;
  TRANSACTION_ID: number;
  PRODUCT_CODE: string;
  QTY: number;
  UNIT_PRICE: number;
};

export interface DropDownType {
  id: number;
  name: string;
}
