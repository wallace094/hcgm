/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { Parser } from "json2csv";

export const productRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const products = await ctx.db.product.findMany();
    return products;
  }),

  getOne: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input, ctx }) => {
      const product = await ctx.db.product.findUnique({
        where: { CODE: input.code },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      return product;
    }),

  create: publicProcedure
    .input(
      z.object({
        code: z.string().min(1, "Code is required"),
        name: z.string().min(1, "Name is required"),
        category: z.string().min(1, "Category is required"),
        base_uom: z.string().min(1, "Base UOM is required"),
        stock: z.number().min(0, "Stock must be a non-negative number"),
        unit_price: z
          .number()
          .min(0, "Unit Price must be a non-negative number")
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const existingProduct = await ctx.db.product.findUnique({
        where: { CODE: input.code },
      });

      if (existingProduct) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Product Code is already registered",
        });
      }

      const newProduct = await ctx.db.product.create({
        data: {
          CODE: input.code,
          NAME: input.name,
          CATEGORY: input.category,
          BASE_UOM: input.base_uom,
          STOCK: input.stock,
          UNIT_PRICE: input.unit_price ?? 0,
        },
      });

      return {
        success: true,
        message: "Product created successfully",
        product: newProduct,
      };
    }),

  edit: publicProcedure
    .input(
      z.object({
        code: z.string(),

        name: z.string().optional(),
        category: z.string().optional(),
        base_uom: z.string().optional(),
        stock: z.number().min(0, "Stock must be non-negative").optional(),
        unit_price: z
          .number()
          .min(0, "Unit Price must be non-negative")
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const product = await ctx.db.product.findUnique({
        where: { CODE: input.code },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      const updatedProduct = await ctx.db.product.update({
        where: { CODE: input.code },
        data: {
          NAME: input.name ?? product.NAME,
          CATEGORY: input.category ?? product.CATEGORY,
          BASE_UOM: input.base_uom ?? product.BASE_UOM,
          STOCK: input.stock ?? product.STOCK,
          UNIT_PRICE: input.unit_price ?? product.UNIT_PRICE,
        },
      });

      return {
        success: true,
        message: `Product with code ${input.code} updated successfully.`,
        product: updatedProduct,
      };
    }),

  delete: publicProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const product = await ctx.db.product.findUnique({
        where: { CODE: input.code },
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      await ctx.db.product.delete({
        where: { CODE: input.code },
      });

      return {
        success: true,
        message: `Product ${input.code} deleted successfully.`,
      };
    }),

  search: publicProcedure
    .input(z.object({ query: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const products = await ctx.db.product.findMany({
        where: {
          OR: [
            { NAME: { contains: input.query, mode: "insensitive" } },
            { CODE: { contains: input.query, mode: "insensitive" } },
          ],
        },
      });
      return products;
    }),

  getCsv: publicProcedure.input(z.void()).query(async ({ ctx }) => {
    const data = await ctx.db.product.findMany();

    if (data.length === 0) {
      // Return CSV with only headers
      const parser = new Parser({
        fields: [
          "Item Code",
          "Description",
          "Item Category",
          "Base UOM",
          "Balance Qty",
        ], // adjust to match your schema
      });
      return parser.parse([]); // this will return headers only
    }

    const parser = new Parser();
    const csv = parser.parse(data);

    return csv;
  }),

  import: publicProcedure
    .input(
      z.array(
        z.object({
          CODE: z.string(),
          NAME: z.string(),
          CATEGORY: z.string(),
          BASE_UOM: z.string(),
          STOCK: z.number(),
        }),
      ),
    )
    .mutation(async ({ input, ctx }) => {
      const upserted = await Promise.all(
        input.map((product) =>
          ctx.db.product.upsert({
            where: { CODE: product.CODE },
            update: {
              NAME: product.NAME,
              CATEGORY: product.CATEGORY,
              BASE_UOM: product.BASE_UOM,
              STOCK: product.STOCK,
            },
            create: {
              CODE: product.CODE,
              NAME: product.NAME,
              CATEGORY: product.CATEGORY,
              BASE_UOM: product.BASE_UOM,
              STOCK: product.STOCK,
            },
          }),
        ),
      );

      return { count: upserted.length };
    }),
});
