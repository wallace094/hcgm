"use client";

import type { ColumnDef } from "@tanstack/react-table";
import React, { useState } from "react";
import { DataTable } from "~/app/_components/data-table";
import { api } from "~/trpc/react";

import { Button } from "~/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { SalesType } from "~/lib/types";
import SalesDetailsDialog from "./viewModal";
import toast from "react-hot-toast";
import { isAdmin, renderStatus } from "~/lib/utils";
import { useUserStore } from "~/lib/store/useUserStore";
import SearchBar from "~/app/_components/search-bar";
import DeleteModal from "~/app/_components/DeleteModal";
import { Dialog } from "~/components/ui/dialog";

const ProductsPage = () => {
  const current_path = usePathname();
  const router = useRouter();

  const utils = api.useUtils();
  const { user } = useUserStore();
  const [selectedRow, setSelectedRow] = useState<SalesType | null>(null);
  const [openViewModal, setOpenViewModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  const [isSearching, setIsSearching] = useState(false);

  const { data: apiData, isLoading } = api.transactions.getAll.useQuery(
    {
      userId: user?.ID ?? 0,
    },
    { enabled: !!user },
  );
  const { mutateAsync: deleteTransaction } =
    api.transactions.delete.useMutation({
      onSuccess: () => {
        void utils.transactions.getAll.invalidate();
      },
    });
  const {
    mutate: searchMutate,
    isPending,
    data: searchData,
  } = api.transactions.search.useMutation();

  const getCsv = api.transactions.getCsv.useQuery(undefined, {
    enabled: false,
  });

  const handleDelete = async (id: number) => {
    setSelectedRow(null);
    setOpenDeleteModal(false);

    await toast.promise(deleteTransaction({ transaction_id: id }), {
      loading: "Deleting...",
      success: "Transaction deleted successfully",
      error: "Error deleting transaction",
    });
  };

  const handleSearch = (value: string) => {
    if (value === "") {
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }

    searchMutate({ query: value, id: user!.ID });
  };

  const handleExport = async () => {
    const csvData = await getCsv.refetch();
    if (csvData.data) {
      const blob = new Blob([csvData.data], {
        type: "text/csv;charset=utf-8;",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "sales.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Failed to fetch CSV data");
    }
  };

  const transactionsColumns: ColumnDef<SalesType>[] = [
    {
      accessorKey: "DOC_NUM",
      header: "Doc #",
      size: 80,
    },
    {
      accessorKey: "TRANSACTION_DATE",
      header: "Date",
      size: 100,
      cell: ({ row }) =>
        row.original.TRANSACTION_DATE
          ? new Date(row.original.TRANSACTION_DATE).toLocaleDateString()
          : "-",
    },
    {
      accessorKey: "CUSTOMER",
      header: "Customer",
      size: 220,
      cell: ({ row }) => (
        <div className="max-w-[240px] overflow-hidden truncate">
          {row.original.CUSTOMER?.NAME ?? "-"}
        </div>
      ),
    },
    {
      accessorKey: "LOCATION",
      header: "Location",
      size: 210,
      cell: ({ row }) => (
        <div className="max-w-[240px] overflow-hidden truncate">
          {row.original.LOCATION ?? "-"}
        </div>
      ),
    },
    {
      accessorKey: "ADMIN",
      header: "Admin",
      size: 160,
      cell: ({ row }) => <div>{row.original.ADMIN?.NAME ?? "-"}</div>,
    },
    {
      accessorKey: "STATUS",
      header: "Status",
      size: 100,
      cell: ({ row }) => renderStatus(row.original.STATUS),
    },
    {
      accessorKey: "TOTAL_PRICE",
      header: "Total Price",
      size: 130,
      cell: ({ row }) => `RM ${row.original.TOTAL_PRICE}`,
    },
    {
      accessorKey: "DELIVERY_DATE",
      header: "Delivery Date",
      size: 130,
      cell: ({ row }) =>
        row.original.DELIVERY_DATE
          ? new Date(row.original.DELIVERY_DATE).toLocaleDateString()
          : "-",
    },
    {
      accessorKey: "SHIPPING_METHOD",
      header: "Shipping",
      size: 80,
      cell: ({ row }) => row.original.SHIPPING_METHOD ?? "-",
    },
    {
      id: "actions",
      size: 60,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            className="text-blue-500 focus:bg-blue-500/10 focus:text-blue-500"
            onClick={() =>
              router.push(current_path + `/edit/${row.original.ID}`)
            }
          >
            <Pencil className="h-4 w-4" />
          </Button>

          {isAdmin(user?.ROLE) && (
            <Button
              variant="ghost"
              className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
              onClick={() => {
                setOpenDeleteModal(true);
                setSelectedRow(row.original);
              }}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const displayColumn = isAdmin(user?.ROLE)
    ? transactionsColumns
    : transactionsColumns.filter((item) => item.header !== "Admin");

  const displayData = isSearching ? (searchData ?? []) : (apiData ?? []);

  return (
    <>
      <div className="w-full px-0 py-4 lg:px-4">
        <div className="flex items-center justify-between">
          <h1 className="mb-6 text-3xl">Sales</h1>

          <div className="flex gap-2">
            <Button className="mb-4" onClick={() => handleExport()}>
              Export
            </Button>
            <Button
              className="mb-4"
              onClick={() => router.push(current_path + "/create")}
            >
              Create Sales
            </Button>
          </div>
        </div>

        <SearchBar onSearch={handleSearch} isLoading={isPending} />

        <section className="pb-8">
          <DataTable
            columns={displayColumn}
            data={displayData}
            isLoading={isLoading || isPending}
            onRowDoubleClick={(row) => {
              console.log(row);
              setOpenViewModal(true);
              setSelectedRow(row);
            }}
          />
        </section>

        {selectedRow && openViewModal && (
          <SalesDetailsDialog
            sales={selectedRow}
            open={openViewModal}
            onOpenChange={setOpenViewModal}
          />
        )}

        <Dialog
          open={openDeleteModal}
          onOpenChange={() => setOpenDeleteModal(false)}
        >
          <DeleteModal
            handleDelete={() => handleDelete(selectedRow!.ID)}
            closeModal={() => {
              setOpenDeleteModal(false);
            }}
          />
        </Dialog>
      </div>
    </>
  );
};

export default ProductsPage;
