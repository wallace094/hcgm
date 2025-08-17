/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { EmailTemplate } from "~/app/_components/email-template";
import { Resend } from "resend";
import { type FieldInfo, Parser } from "json2csv";

const resend = new Resend(process.env.RESEND_API_KEY);

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input, ctx }) => {
      const admin = await ctx.db.admin.findUnique({
        where: { ID: input.userId },
      });

      const isSalesperson = admin?.ROLE.toLowerCase() === "salesperson";

      const sales = await ctx.db.transaction.findMany({
        where: isSalesperson ? { ADMIN_ID: input.userId } : undefined,
        include: {
          ADMIN: true,
          CUSTOMER: true,
          TransactionDetail: true,
          remarks: {
            take: 1,
            orderBy: {
              createdAt: "desc",
            },
          },
        },
        orderBy: {
          TRANSACTION_DATE: "desc",
        },
      });

      return sales;
    }),

  getOne: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const transaction = await ctx.db.transaction.findUnique({
        where: { ID: input.id },
      });

      if (!transaction) {
        throw new Error("Transaction not found");
      }

      const admin = await ctx.db.admin.findUnique({
        where: { ID: transaction.ADMIN_ID },
      });

      const customer = await ctx.db.customer.findUnique({
        where: { ID: transaction.CUSTOMER_ID },
      });

      const details = await ctx.db.transactionDetail.findMany({
        where: { TRANSACTION_ID: transaction.ID },
      });

      const products = await Promise.all(
        details.map(async (detail) => {
          const product = await ctx.db.product.findUnique({
            where: { CODE: detail.PRODUCT_CODE },
          });

          return { ...detail, NAME: product?.NAME };
        }),
      );

      const remarks = await ctx.db.remark.findMany({
        where: { transactionId: transaction.ID },
        orderBy: { createdAt: "desc" },
      });

      return {
        ...transaction,
        ADMIN: admin,
        CUSTOMER: customer,
        PRODUCTS: products,
        remarks,
      };
    }),

  create: publicProcedure
    .input(
      z.object({
        doc_num: z.string().min(1, "Document number is required"),
        transaction_date: z.string().min(1, "Transaction date is required"),
        customer_id: z.string().min(1, "Customer ID is required"),
        admin_id: z.string().min(1, "Admin ID is required"),
        total_price: z
          .number()
          .min(0, "Total price must be a non-negative number"),
        ref_doc_no: z.string().min(1, "Reference document number is required"),
        delivery_date: z.string().min(1, "Delivery date is required"),
        shipping_method: z.string().min(1, "Shipping method is required"),
        comission: z
          .number()
          .min(0, "Commission must be a non-negative number"),
        remark: z.string().optional(),
        deliveryLocation: z.string(),
        products: z.array(
          z.object({
            code: z.string(),
            quantity: z.number(),
            price: z.number(),
          }),
        ),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Step 1: Check stock availability
      const insufficientStock: {
        code: string;
        requested: number;
        available: number;
      }[] = [];

      for (const product of input.products) {
        const existingProduct = await ctx.db.product.findUnique({
          where: { CODE: product.code },
          select: { STOCK: true },
        });

        const available = existingProduct?.STOCK ?? 0;

        if (product.quantity > available) {
          insufficientStock.push({
            code: product.code,
            requested: product.quantity,
            available,
          });
        }
      }

      // Step 2: Reject if insufficient stock
      if (insufficientStock.length > 0) {
        throw new Error(
          `Insufficient stock for product(s): ${insufficientStock
            .map(
              (p) =>
                `Product ID ${p.code} (requested: ${p.requested}, available: ${p.available})`,
            )
            .join(", ")}`,
        );
      }

      // Step 3: Create the transaction
      const transaction = await ctx.db.transaction.create({
        data: {
          DOC_NUM: input.doc_num,
          TRANSACTION_DATE: new Date(input.transaction_date),
          CUSTOMER_ID: +input.customer_id,
          ADMIN_ID: +input.admin_id,
          TOTAL_PRICE: input.total_price,
          REF_DOC_NO: input.ref_doc_no,
          DELIVERY_DATE: new Date(input.delivery_date),
          SHIPPING_METHOD: input.shipping_method,
          COMISSION: input.comission,
          LOCATION: input.deliveryLocation,
          STATUS: "PENDING",
        },
      });

      // Step 4: Create transaction details
      const transactionDetail =
        await ctx.db.transactionDetail.createManyAndReturn({
          data: input.products.map((product) => ({
            TRANSACTION_ID: transaction.ID,
            PRODUCT_CODE: product.code,
            QTY: product.quantity,
            UNIT_PRICE: product.price,
          })),
        });

      // Step 5: Update product stock
      for (const product of input.products) {
        await ctx.db.product.update({
          where: { CODE: product.code },
          data: {
            STOCK: {
              decrement: product.quantity,
            },
          },
        });
      }

      // Step 6: Save remark (if any) as separate log
      if (input.remark && input.remark.trim().length > 0) {
        await ctx.db.remark.create({
          data: {
            message: input.remark,
            transactionId: transaction.ID,
          },
        });
      }

      // Step 7: Send email
      await resend.emails.send({
        from: "Acme <onboarding@resend.dev>",
        to: "huachangtesting@gmail.com",
        subject: `New Sales ${transaction.ID}`,
        react: EmailTemplate({ sales: transaction }),
      });

      return {
        success: true,
        message: `Transaction with ID ${transaction.ID} created successfully.`,
        transaction,
        transactionDetail,
      };
    }),

  edit: publicProcedure
    .input(
      z.object({
        transaction_id: z.number().min(1, "Transaction ID is required"),
        doc_num: z.string().min(1, "Document number is required"),
        transaction_date: z.string().min(1, "Transaction date is required"),
        customer_id: z.string().min(1, "Customer ID is required"),
        admin_id: z.string().min(1, "Admin ID is required"),
        total_price: z
          .number()
          .min(0, "Total price must be a non-negative number"),
        ref_doc_no: z.string().min(1, "Reference document number is required"),
        delivery_date: z.string().min(1, "Delivery date is required"),
        shipping_method: z.string().min(1, "Shipping method is required"),
        comission: z
          .number()
          .min(0, "Commission must be a non-negative number"),
        remark: z.string().optional(),
        products: z.array(
          z.object({
            code: z.string(),
            quantity: z.number(),
            price: z.number(),
          }),
        ),
        deliveryLocation: z.string(),
        status: z.string().min(1, "Status is required"),
      }),
    )

    .mutation(async ({ input, ctx }) => {
      const existingTransaction = await ctx.db.transaction.findUnique({
        where: { ID: input.transaction_id },
      });

      if (!existingTransaction) {
        throw new Error(
          `Transaction with ID ${input.transaction_id} not found.`,
        );
      }

      // Update the transaction in the database
      const updatedTransaction = await ctx.db.transaction.update({
        where: { ID: input.transaction_id }, // Ensure the ID matches
        data: {
          DOC_NUM: input.doc_num,
          TOTAL_PRICE: input.total_price,
          REF_DOC_NO: input.ref_doc_no,
          DELIVERY_DATE: input.delivery_date,
          SHIPPING_METHOD: input.shipping_method,
          COMISSION: input.comission,
          LOCATION: input.deliveryLocation,
          STATUS: input.status, // You can modify this status if needed
          TRANSACTION_DATE: new Date(),
        },
      });

      // First, delete existing transaction details before adding the new ones
      await ctx.db.transactionDetail.deleteMany({
        where: { TRANSACTION_ID: input.transaction_id },
      });

      // Add the new products to the transaction
      const updatedTransactionDetails =
        await ctx.db.transactionDetail.createMany({
          data: input.products.map((product) => ({
            TRANSACTION_ID: updatedTransaction.ID,
            PRODUCT_CODE: product.code,
            QTY: product.quantity,
            UNIT_PRICE: product.price,
          })),
        });

      // Step 6: Save remark (if any) as separate log
      if (input.remark && input.remark.trim().length > 0) {
        await ctx.db.remark.create({
          data: {
            message: input.remark,
            transactionId: updatedTransaction.ID,
          },
        });
      }

      // ✅ Send email if status changed
      if (existingTransaction.STATUS !== input.status) {
        await resend.emails.send({
          from: "Acme <onboarding@resend.dev>",
          to: "huachangtesting@gmail.com",
          subject: `Updated Sales Status : ${updatedTransaction.ID}`,
          react: EmailTemplate({ sales: updatedTransaction }),
        });
      }

      return new Promise((resolve) => {
        resolve({
          success: true,
          message: `Transaction with ID ${updatedTransaction.ID} updated successfully.`,
          transaction: updatedTransaction,
          transactionDetail: updatedTransactionDetails,
        });
      });
    }),

  delete: publicProcedure
    .input(
      z.object({
        transaction_id: z.number().min(1, "Transaction ID is required"),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const transactionId = input.transaction_id;

      // First, delete the related transaction details
      await ctx.db.transactionDetail.deleteMany({
        where: { TRANSACTION_ID: transactionId },
      });

      // Step 2: Delete all related remarks/logs
      await ctx.db.remark.deleteMany({
        where: { transactionId: transactionId },
      });

      // Then, delete the main transaction
      const deletedTransaction = await ctx.db.transaction.delete({
        where: { ID: transactionId },
      });

      return {
        success: true,
        message: `Transaction with ID ${transactionId} deleted successfully.`,
        deletedTransaction,
      };
    }),

  search: publicProcedure
    .input(z.object({ query: z.string(), id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const searchResults = await ctx.db.transaction.findMany({
        where: {
          OR: [
            { DOC_NUM: { contains: input.query, mode: "insensitive" } },
            {
              CUSTOMER: {
                NAME: { contains: input.query, mode: "insensitive" },
              },
            },
          ],
          ADMIN_ID: input.id,
        },
        include: {
          ADMIN: true,
          CUSTOMER: true,
          TransactionDetail: true,
        },
      });

      return searchResults;
    }),

  getCsv: publicProcedure.input(z.void()).query(async ({ ctx }) => {
    const data: ExportedTransaction[] = await ctx.db.transaction.findMany({
      include: {
        ADMIN: true,
        CUSTOMER: true,
      },
      orderBy: { TRANSACTION_DATE: "desc" },
    });

    // 1. Define a type that matches the shape of each transaction row
    type ExportedTransaction = {
      ID: number;
      DOC_NUM: string;
      TRANSACTION_DATE: Date;
      CUSTOMER: { NAME: string };
      ADMIN: { NAME: string };
      TOTAL_PRICE: number;
      REF_DOC_NO: string | null;
      DELIVERY_DATE: Date | null;
      SHIPPING_METHOD: string | null;
      COMISSION: number | null;
      STATUS: string;
      LOCATION: string;
    };

    const fields: FieldInfo<ExportedTransaction>[] = [
      { label: "Transaction ID", value: "ID" },
      { label: "Document Number", value: "DOC_NUM" },
      {
        label: "Transaction Date",
        value: (row: ExportedTransaction) => row.TRANSACTION_DATE.toISOString(),
      },
      {
        label: "Customer Name",
        value: (row: ExportedTransaction) => row.CUSTOMER?.NAME ?? "",
      },
      {
        label: "Admin Name",
        value: (row: ExportedTransaction) => row.ADMIN?.NAME ?? "",
      },
      { label: "Total Price", value: "TOTAL_PRICE" },
      { label: "Reference Document No", value: "REF_DOC_NO" },
      {
        label: "Delivery Date",
        value: (row: ExportedTransaction) =>
          row.DELIVERY_DATE?.toISOString() ?? "",
      },
      { label: "Shipping Method", value: "SHIPPING_METHOD" },
      { label: "Commission", value: "COMISSION" },
      { label: "Status", value: "STATUS" },
      { label: "Location", value: "LOCATION" },
    ];

    const parser = new Parser<ExportedTransaction>({ fields });
    const csv = parser.parse(data);

    return csv;
  }),
});
