/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { type REGION, type Admin } from "@prisma/client";

import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import type { CustomerType, UserType } from "~/lib/types";
import { Parser } from "json2csv";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const customerBaseSchema = z.object({
  CODE: z.string(),
  NAME: z.string(),
  SSM_REGISTRATION_NO: z.string().optional(),
  TAX_IDENTIFICATION_NO: z.string().optional(),
  SST_NO: z.string().optional(),
  MSIC_CODE: z.string().optional(),
  BUSINESS_NATURE: z.string().optional(),
  PIC_NAME: z.string().optional(),
  EMAIL: z.string().optional(),
  PHONE_NO: z.string(),
  ADDRESS: z.string(),
  CREDIT_TERM: z.string(),
  CREDIT_LIMIT: z.number(),
  ADMIN_ID: z.number(),
});
export const TransactionSchema = z.object({
  ID: z.number().int(), // Optional for creation; Prisma will auto-generate
  DOC_NUM: z.string().default(""),
  TRANSACTION_DATE: z.coerce.date().default(new Date()), // coerce handles string/Date
  CUSTOMER_ID: z.number().int(),
  ADMIN_ID: z.number().int(),
  TOTAL_PRICE: z.number().default(0),
  REF_DOC_NO: z.string().optional().default(""),
  DELIVERY_DATE: z.coerce.date().optional().nullable(),
  SHIPPING_METHOD: z.string().optional().default(""),
  COMISSION: z.number().optional().default(0),
  REMARK: z.string().optional().default(""),
  STATUS: z.string().default(""),
  LOCATION: z.string(),
  // Admin and Customer are relations — usually excluded or validated separately
  // TransactionDetail would be handled via nested validation if needed
});

export const createCustomerSchema = customerBaseSchema;

export const updateCustomerSchema = customerBaseSchema.extend({
  ID: z.number(), // or z.number() depending on your db
});

export const deleteCustomerSchema = z.object({
  ID: z.number(), // or z.number()
});

export const userRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ userId: z.number(), role: z.string() }))
    .query(async ({ input, ctx }) => {
      console.log(input);
      const admin = await ctx.db.admin.findMany();
      const customers = await ctx.db.customer.findMany({
        where:
          input.role.toLowerCase() === "salesperson"
            ? { ADMIN_ID: input.userId }
            : undefined,
      });

      const safeAdmin = admin.map((a: Admin) => {
        const { PASSWORD, ...safeAdmin } = a;
        return safeAdmin;
      });

      return { admins: safeAdmin, customers } as {
        admins: UserType[];
        customers: CustomerType[];
      };
    }),

  getAllCustomers: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      const customers = await ctx.db.customer.findMany({
        where: { ADMIN_ID: input.userId },
      });
      return customers;
    }),

  getOne: publicProcedure
    .input(z.object({ id: z.number(), type: z.string() }))
    .query(async ({ input, ctx }) => {
      switch (input.type) {
        case "customer":
          const customer = await ctx.db.customer.findFirst({
            where: { ID: input.id },
          });
          return customer;
        case "admin":
          const admin = await ctx.db.admin.findFirst({
            where: { ID: input.id },
          });
          return admin;
      }
    }),

  createAdmin: publicProcedure
    .input(
      z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        phone: z.number(),
        role: z.string().min(1, "Invalid role"),
        code: z.string().min(1, "Invalid Code"),
        region: z.string().min(1, "Invalid region"),
      }),
    )

    .mutation(async ({ input, ctx }) => {
      // Check if a user with the same email already exists

      const existingUser = await ctx.db.admin.findFirst({
        where: { EMAIL: input.email },
      });

      console.log(existingUser);

      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Email is already registered",
        });
      }

      const newUser = await ctx.db.admin.create({
        data: {
          NAME: input.name,
          EMAIL: input.email,
          PASSWORD: input.password, // For security: consider hashing passwords
          PHONE: input.phone + "",
          ROLE: input.role,
          CODE: input.code,
          REGION: input.region as REGION,
        },
      });

      return {
        success: true,
        message: "User created successfully",
        user: newUser,
      };
    }),

  editAdmin: publicProcedure
    .input(
      z.object({
        id: z.number(),

        // optional so that the admin can choose which data to change
        name: z.string().min(1, "Name is required").optional(),
        email: z.string().email("Invalid email").optional(),
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .optional(),
        phone: z.number().min(10, "Phone number is invalid").optional(),
        role: z.string().min(1, "Invalid role").optional(),
        code: z.string().min(1, "Invalid Code").optional(),
        region: z.string().min(1, "Invalid region").optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // finding the user using ID
      const user = await ctx.db.admin.findUnique({
        where: { ID: input.id },
      });

      // if user does not exist, return error message
      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // an empty object to fill the updated data
      const updateData: Admin = {} as Admin;

      // checking each field to see if any of the data has been updated
      if (input.name) updateData.NAME = input.name;
      if (input.email) updateData.EMAIL = input.email;
      if (input.password) updateData.PASSWORD = input.password;
      if (input.phone) updateData.PHONE = input.phone + "";
      if (input.role) updateData.ROLE = input.role;
      if (input.code) updateData.CODE = input.code;
      if (input.region) updateData.REGION = input.region as REGION;

      // update the database using the user id
      const updatedUser = await ctx.db.admin.update({
        where: { ID: input.id },
        data: updateData,
      });

      // returns true if succesfully updated
      return {
        success: true,
        message: `User with ID ${input.id} updated successfully.`,
        user: updatedUser,
      };
    }),

  deleteUser: publicProcedure
    .input(z.object({ id: z.number(), type: z.string() }))
    .mutation(async ({ input, ctx }) => {
      switch (input.type) {
        case "admin":
          // Delete the admin

          if (input.id === 10) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: "You cannot delete this admin",
            });
          }

          await ctx.db.admin.delete({
            where: { ID: input.id },
          });
          return {
            success: true,
            message: `Admin with the ID ${input.id} deleted successfully.`,
          };
        case "customer":
          // Delete the customer

          await ctx.db.customer.delete({
            where: { ID: input.id },
          });
          return {
            success: true,
            message: `Customer with the ID ${input.id} deleted successfully.`,
          };
      }

      return {
        success: true,
        message: `User ${input.id} deleted successfully.`,
      };
    }),

  createCustomer: publicProcedure
    .input(createCustomerSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.customer.findFirst({
        where:
          input.EMAIL !== ""
            ? {
                EMAIL: input.EMAIL,
              }
            : undefined,
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Customer with this email already exists",
        });
      }

      const newCustomer = await ctx.db.customer.create({
        data: input,
      });

      return {
        success: true,
        message: "Customer created successfully",
        customer: newCustomer,
      };
    }),

  editCustomer: publicProcedure
    .input(updateCustomerSchema)
    .mutation(async ({ input, ctx }) => {
      const customer = await ctx.db.customer.findUnique({
        where: { ID: +input.ID },
      });

      if (!customer) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      const updateData = { ...input };

      const updated = await ctx.db.customer.update({
        where: { ID: +input.ID },
        data: updateData,
      });

      return {
        success: true,
        message: `Customer with ID ${input.ID} updated successfully`,
        customer: updated,
      };
    }),

  deleteCustomer: publicProcedure
    .input(deleteCustomerSchema)
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.customer.findUnique({
        where: { ID: +input.ID },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }

      await ctx.db.customer.delete({
        where: { ID: +input.ID },
      });

      return {
        success: true,
        message: `Customer with ID ${input.ID} deleted successfully`,
      };
    }),

  login: publicProcedure.input(LoginSchema).mutation(async ({ input, ctx }) => {
    console.log("input", input);

    const user = await ctx.db.admin.findFirst({
      where: {
        EMAIL: input.email,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found",
      });
    }

    if (user.PASSWORD !== input.password) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid password",
      });
    }

    return user;
  }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const searchAdminResults = await ctx.db.admin.findMany({
        where: {
          OR: [
            { NAME: { contains: input.query, mode: "insensitive" } },
            { EMAIL: { contains: input.query, mode: "insensitive" } },
            { CODE: { contains: input.query, mode: "insensitive" } },
          ],
        },
      });

      const searchCustomerResults = await ctx.db.customer.findMany({
        where: {
          OR: [
            { NAME: { contains: input.query, mode: "insensitive" } },
            { EMAIL: { contains: input.query, mode: "insensitive" } },
            { PIC_NAME: { contains: input.query, mode: "insensitive" } },
            { CODE: { contains: input.query, mode: "insensitive" } },
          ],
        },
      });

      return {
        admins: searchAdminResults,
        customers: searchCustomerResults,
      };
    }),

  getCsv: publicProcedure.input(z.void()).query(async ({ ctx }) => {
    const adminData = await ctx.db.admin.findMany();
    const customerData = await ctx.db.customer.findMany();

    const adminFields = [
      { label: "Admin ID", value: "id" },
      { label: "Name", value: "name" },
      { label: "Email", value: "email" },
      { label: "Created At", value: "createdAt" },
    ];

    const customerFields = [
      { label: "Customer ID", value: "id" },
      { label: "Name", value: "name" },
      { label: "Email", value: "email" },
      { label: "Phone", value: "phone" },
      { label: "Registered Date", value: "createdAt" },
    ];

    const adminParser = new Parser({ fields: adminFields });
    const customerParser = new Parser({ fields: customerFields });

    // Format dates to YYYY-MM-DD for cleaner output
    const formatDate = (d: Date) => d.toISOString().split("T")[0];

    const cleanedAdmin = adminData.map((a) => ({
      ...a,
    }));

    const cleanedCustomer = customerData.map((c) => ({
      ...c,
    }));

    const adminCsv = adminParser.parse(
      cleanedAdmin.length > 0 ? cleanedAdmin : [],
    );
    const customerCsv = customerParser.parse(
      cleanedCustomer.length > 0 ? cleanedCustomer : [],
    );

    const combinedCsv = [
      "--- Admin Data ---",
      adminCsv,
      "",
      "--- Customer Data ---",
      customerCsv,
    ].join("\n");

    return combinedCsv;
  }),
});
