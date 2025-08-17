"use client";
import React, { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { api } from "~/trpc/react";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { EditableDataTable } from "~/app/_components/editable-data-table";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { calculateTotal } from "~/lib/utils";

export type ForecastRow = {
  id: number;
  item_group: string;
  central: number;
  e_coast: number;
  south: number;
  north: number;
  type: "MT" | "COSTING";
};

function formatNumberWithCommas(value: number | string) {
  if (value === null || value === undefined || value === "") return "-";
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "-";
  return num.toLocaleString();
}

const DashboardPage = () => {
  const updateMutation = api.dashboard.updateForecast.useMutation();

  const { data: forecast, isLoading } = api.dashboard.getForecast.useQuery<{
    mt: Omit<ForecastRow, "type">[];
    costing: Omit<ForecastRow, "type">[];
  }>();

  const { data: sales, isLoading: isSalesLoading } =
    api.dashboard.getCurrentSales.useQuery();

  console.log(sales, forecast);

  const [localData, setLocalData] = useState<{
    mt: Omit<ForecastRow, "type">[];
    costing: Omit<ForecastRow, "type">[];
  }>({ mt: [], costing: [] });
  const [localSalesData, setLocalSalesData] = useState<{
    mt: Omit<ForecastRow, "type" | "id">[];
    costing: Omit<ForecastRow, "type" | "id">[];
  }>({ mt: [], costing: [] });

  const [currentTab, setCurrenTab] = useState<string>("MT");

  useEffect(() => {
    if (forecast) {
      setLocalData({
        mt: forecast.mt.map((row) => ({ ...row, type: "MT" })),
        costing: forecast.costing.map((row) => ({ ...row, type: "COSTING" })),
      });
    }
  }, [forecast]);
  useEffect(() => {
    if (sales) {
      setLocalSalesData({
        mt: sales.mt.map((row) => ({ ...row, type: "MT" })),
        costing: sales.costing.map((row) => ({ ...row, type: "COSTING" })),
      });
    }
  }, [sales]);

  const handleUpdateData = (data: ForecastRow, value: number, key: string) => {
    if (Number.isNaN(+value)) {
      toast.error("Please enter a valid number.");
      return;
    }

    const updatedRow = { ...data, [key]: +value };
    const target = data.type === "MT" ? "mt" : "costing";
    const newData = localData[target].map((item) =>
      item.id === data.id ? updatedRow : item,
    );

    setLocalData({ ...localData, [target]: newData });
    updateMutation.mutate(updatedRow);
  };

  const forecastColumns: ColumnDef<ForecastRow>[] = [
    {
      header: "#",
      cell: ({ row }) => row.index + 1,
      size: 50,
    },
    {
      accessorKey: "ITEM_GROUP",
      header: "Item Group",
      cell: ({ row }) => <div>{row.original.item_group || "-"}</div>,
      size: 150,
    },
    ...(["central", "e_coast", "south", "north"] as const).map((key) => ({
      accessorKey: key.toUpperCase(),
      header: key.replace("_", " ").toUpperCase(),
      cell: ({ row }: { row: Row<ForecastRow> }) => {
        const val = row.original[key];
        return (
          <div className="cursor-pointer">
            {val == null
              ? "-"
              : row.original.type === "COSTING"
                ? `RM ${formatNumberWithCommas(val / 1000)}k`
                : formatNumberWithCommas(val)}
          </div>
        );
      },
      size: 80,
    })),
    {
      accessorKey: "Total",
      header: "Total",
      cell: ({ row }) => {
        const { central, e_coast, south, north, type } = row.original;
        const total =
          (central ?? 0) + (e_coast ?? 0) + (south ?? 0) + (north ?? 0);
        return (
          <div>
            {type === "COSTING"
              ? `RM ${formatNumberWithCommas(total / 1000)}k`
              : formatNumberWithCommas(total)}
          </div>
        );
      },
    },
  ];

  const renderChart = (
    data: {
      item_group: string;
      central_forecast: number;
      e_coast_forecast: number;
      south_forecast: number;
      north_forecast: number;
      central_sales: number;
      e_coast_sales: number;
      south_sales: number;
      north_sales: number;
      type: string;
    }[],
  ) => {
    return (
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="item_group" />
            <YAxis
              tickFormatter={(value: number) =>
                value > 1000000 ? `${value / 1000000}M` : value.toLocaleString()
              }
            />
            <Tooltip formatter={(value: number) => value.toLocaleString()} />
            <Legend />

            {/* Central */}
            <Bar
              dataKey="central_sales"
              name="Central (Current)"
              fill="#8884d8"
              stackId={"sales"}
            />
            <Bar
              dataKey="central_forecast"
              name="Central (Forecast)"
              stackId={"forecast"}
              fill="#4e79a7"
            />

            {/* East Coast */}
            <Bar
              dataKey="e_coast_sales"
              stackId={"sales"}
              name="E Coast (Current)"
              fill="#82ca9d"
            />
            <Bar
              dataKey="e_coast_forecast"
              name="E Coast (Forecast)"
              stackId={"forecast"}
              fill="#59c18f"
            />

            {/* South */}
            <Bar
              dataKey="south_sales"
              stackId={"sales"}
              name="South (Current)"
              fill="#ffc658"
            />
            <Bar
              dataKey="south_forecast"
              name="South (Forecast)"
              stackId={"forecast"}
              fill="#fcbf49"
            />

            {/* North */}
            <Bar
              dataKey="north_sales"
              stackId={"sales"}
              name="North (Current)"
              fill="#ff8042"
            />
            <Bar
              dataKey="north_forecast"
              name="North (Forecast)"
              stackId={"forecast"}
              fill="#fd7e14"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="w-full px-0 py-4 lg:px-4">
      <h1 className="mb-6 text-3xl">Forecast</h1>

      <Tabs value={currentTab} onValueChange={setCurrenTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="MT">Weights</TabsTrigger>
          <TabsTrigger value="COSTING">Currency</TabsTrigger>
        </TabsList>

        <TabsContent value="MT">
          <section className="space-y-4 rounded-md p-4">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: "#254336" }}
            >
              Forecast (MT)
            </h2>
            <EditableDataTable
              columns={forecastColumns}
              data={calculateTotal(
                localData.mt.map((item) => ({ ...item, type: "MT" })),
              )}
              isLoading={isLoading}
              onDataChange={handleUpdateData}
              setLocalData={setLocalData}
            />
            {localSalesData?.mt
              ? renderChart(
                  localData.mt.map((item) => {
                    const salesMT = localSalesData.mt.find(
                      (mt) => mt.item_group === item.item_group,
                    );

                    const newItems = {
                      item_group: item.item_group,
                      central_forecast: item.central,
                      e_coast_forecast: item.e_coast,
                      south_forecast: item.south,
                      north_forecast: item.north,
                      central_sales: salesMT?.central ?? 0,
                      e_coast_sales: salesMT?.e_coast ?? 0,
                      south_sales: salesMT?.south ?? 0,
                      north_sales: salesMT?.north ?? 0,
                      type: "MT",
                    };

                    return newItems;
                  }),
                )
              : null}
          </section>
        </TabsContent>

        <TabsContent value="COSTING">
          <section className="space-y-4 rounded-md p-4">
            <h2
              className="mb-4 text-xl font-semibold"
              style={{ color: "#254336" }}
            >
              Costing (RM)
            </h2>
            <EditableDataTable
              columns={forecastColumns}
              data={calculateTotal(
                localData.costing.map((item) => ({ ...item, type: "COSTING" })),
              )}
              isLoading={isLoading}
              onDataChange={handleUpdateData}
              setLocalData={setLocalData}
            />
            {localSalesData?.costing
              ? renderChart(
                  localData.costing.map((item) => {
                    const salesCosting = localSalesData.costing.find(
                      (costing) => costing.item_group === item.item_group,
                    );

                    const newItems = {
                      item_group: item.item_group,
                      central_forecast: item.central,
                      e_coast_forecast: item.e_coast,
                      south_forecast: item.south,
                      north_forecast: item.north,
                      central_sales: salesCosting?.central ?? 0,
                      e_coast_sales: salesCosting?.e_coast ?? 0,
                      south_sales: salesCosting?.south ?? 0,
                      north_sales: salesCosting?.north ?? 0,
                      type: "COSTING",
                    };

                    return newItems;
                  }),
                )
              : null}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
