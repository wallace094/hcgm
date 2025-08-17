import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import type { ForecastRow } from "~/app/(routes)/(protected_routes)/dashboard/page";

export const dashboardRouter = createTRPCRouter({
  getForecast: publicProcedure.query(async ({ ctx }) => {
    const mt = await ctx.db.regional_forecast_mt.findMany();
    const costing = await ctx.db.regional_forecast_costing.findMany();

    return { mt, costing };
  }),

  getCurrentSales: publicProcedure.query(async ({ ctx }) => {
    // Fetch all approved transactions with details and product info
    const approvedTransactions = await ctx.db.transaction.findMany({
      where: {
        STATUS: "APPROVED",
      },
      include: {
        TransactionDetail: {
          include: {
            PRODUCT: true,
          },
        },
        ADMIN: true,
      },
    });

    type Region = "CENTRAL" | "EAST_COAST" | "SOUTH" | "NORTH";
    type RegionMap = Record<Region, number>;

    type SalesSummary = {
      COSTING: Record<string, RegionMap>; // category -> region -> cost
      MT: Record<string, RegionMap>; // category -> region -> weight
    };

    const summary: SalesSummary = {
      COSTING: {
        Product: {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        },
        Gold: {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        },
        Organic: {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        },
        Straight: {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        },
      },
      MT: {
        Product: {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        },
        Gold: {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        },
        Organic: {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        },
        Straight: {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        },
      },
    };

    for (const tx of approvedTransactions) {
      const region = tx.ADMIN.REGION as Region;

      for (const detail of tx.TransactionDetail) {
        const category = detail.PRODUCT.CATEGORY;
        const qty = detail.QTY;
        const unitPrice = detail.UNIT_PRICE;

        const cost = qty * unitPrice;
        const mt = detail.PRODUCT.BASE_UOM === "MT" ? qty : 0;

        // Init
        summary.COSTING[category] ??= {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        };
        summary.MT[category] ??= {
          CENTRAL: 0,
          EAST_COAST: 0,
          SOUTH: 0,
          NORTH: 0,
        };

        // Accumulate
        summary.COSTING[category][region] += cost;
        summary.MT[category][region] += mt;
      }
    }

    function transformSummary(
      summary: Record<string, Record<string, number>>,
    ): Omit<ForecastRow, "type" | "id">[] {
      return Object.entries(summary).map(([item_group, regions]) => ({
        item_group: item_group.toUpperCase(),
        central: regions.CENTRAL ?? 0,
        e_coast: regions.EAST_COAST ?? 0,
        south: regions.SOUTH ?? 0,
        north: regions.NORTH ?? 0,
      }));
    }

    return {
      costing: transformSummary(summary.COSTING),
      mt: transformSummary(summary.MT),
    };
  }),

  updateForecast: publicProcedure
    .input(
      z.object({
        id: z.number(),
        item_group: z.string(),
        central: z.number(),
        e_coast: z.number(),
        south: z.number(),
        north: z.number(),
        type: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      if (input.type === "MT") {
        await ctx.db.regional_forecast_mt.update({
          where: { id: input.id },
          data: {
            central: input.central,
            e_coast: input.e_coast,
            north: input.north,
            south: input.south,
          },
        });
      } else {
        await ctx.db.regional_forecast_costing.update({
          where: { id: input.id },
          data: {
            central: input.central,
            e_coast: input.e_coast,
            north: input.north,
            south: input.south,
          },
        });
      }
    }),
});
