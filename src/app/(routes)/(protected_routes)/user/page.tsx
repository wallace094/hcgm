"use client";

import type { ColumnDef } from "@tanstack/react-table";
import React, { useState } from "react";
import { DataTable } from "~/app/_components/data-table";
import { api } from "~/trpc/react";

import { Button } from "~/components/ui/button";
import { Pencil, Trash } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type { UserType, CustomerType } from "~/lib/types";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { type REGION, REGION_LABELS } from "~/app/const";
import toast from "react-hot-toast";
import SearchBar from "~/app/_components/search-bar";
import { isAdmin, isMasterAdmin } from "~/lib/utils";
import { useUserStore } from "~/lib/store/useUserStore";
import { Dialog } from "@radix-ui/react-dialog";
import DeleteModal from "~/app/_components/DeleteModal";
import type { TRPCError } from "@trpc/server";

const UserPage = () => {
  const current_path = usePathname();
  const router = useRouter();
  const utils = api.useUtils();

  const { user } = useUserStore();
  const [currentTab, setCurrentTab] = useState<string>("admin");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedRow, setSelectedRow] = useState<number>(0);
  const [showModal, setShowModal] = useState(false);

  const { data: userData, isLoading } = api.user.getAll.useQuery(
    { userId: user?.ID ?? -1, role: user?.ROLE ?? "" },
    { enabled: !!user },
  );
  const {
    mutate: searchMutate,
    data: searchData,
    isPending,
  } = api.user.search.useMutation();
  const getCsv = api.user.getCsv.useQuery();

  const deleteUserMutation = api.user.deleteUser.useMutation({
    onSuccess: () => {
      void utils.user.getAll.invalidate();
    },
  });

  const handleDelete = async (id: number, type: string) => {
    setShowModal(false);
    const promise = deleteUserMutation.mutateAsync({ id: id, type });

    await toast.promise(promise, {
      loading: "Deleting...",
      success: "User deleted successfully",
      error: () => {
        return "User has active transactions. Please delete the transactions first.";
      },
    });
  };

  const adminColumns: ColumnDef<UserType>[] = [
    {
      // accessorKey: "id",
      header: "#",
      cell: ({ row }) => row.index + 1,
      size: 50,
    },
    {
      accessorKey: "CODE",
      header: "Code",
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const name = row.original.NAME;

        const outputText = name ?? "-";

        return <div>{outputText}</div>;
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      size: 240,
      cell: ({ row }) => {
        const email = row.original.EMAIL;

        const outputText = email ?? "-";

        return <div>{outputText}</div>;
      },
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.original.PHONE;

        const outputText = phone ?? "-";

        return <div>{outputText}</div>;
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.ROLE;

        const outputText = role
          ? role.charAt(0).toUpperCase() + role.slice(1)
          : "-";

        return <div>{outputText}</div>;
      },
    },
    {
      accessorKey: "REGION",
      header: "Region",
      cell: ({ row }) => {
        const outputText = REGION_LABELS[row.original.REGION as REGION] ?? "-";


        
        return <div>{outputText}</div>;
      },
    },

    {
      id: "actions",
      size: 40,
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-center">
            {isAdmin(user?.ROLE) && (
              <>
                <Button
                  variant="ghost"
                  className="text-blue-500 focus:bg-blue-500/10 focus:text-blue-500"
                  onClick={() =>
                    router.push(current_path + `/admin/edit/${row.original.ID}`)
                  }
                >
                  <Pencil className="h-2 w-2" />
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                  onClick={() => {
                    setSelectedRow(row.original.ID);
                    setShowModal(true);
                  }}
                >
                  <Trash className="h-2 w-2" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const customerColumns: ColumnDef<CustomerType>[] = [
    {
      header: "#",
      cell: ({ row }) => row.index + 1,
      size: 50,
    },
    {
      accessorKey: "CODE",
      header: "Code",
      size: 110,
    },
    {
      accessorKey: "NAME",
      header: "Name",
      size: 300,
    },
    {
      accessorKey: "EMAIL",
      header: "Email",
      cell: ({ row }) => <div>{row.original.EMAIL ?? "-"}</div>,
    },
    {
      accessorKey: "PHONE_NO",
      header: "Phone",
      cell: ({ row }) => <div>{row.original.PHONE_NO ?? "-"}</div>,
      size: 150,
    },
    {
      accessorKey: "ADDRESS",
      header: "Address",
      cell: ({ row }) => {
        const address = row.original.ADDRESS;
        return <div>{address === "" || !address ? "-" : address}</div>;
      },
      size: 300,
    },
    // {
    //   accessorKey: "SSM_REGISTRATION_NO",
    //   header: "SSM No",
    //   cell: ({ row }) => <div>{row.original.SSM_REGISTRATION_NO ?? "-"}</div>,
    //   size: 150,
    // },
    // {
    //   accessorKey: "TAX_IDENTIFICATION_NO",
    //   header: "Tax ID",
    //   cell: ({ row }) => <div>{row.original.TAX_IDENTIFICATION_NO ?? "-"}</div>,
    //   size: 150,
    // },
    // {
    //   accessorKey: "SST_NO",
    //   header: "SST No",
    //   cell: ({ row }) => <div>{row.original.SST_NO ?? "-"}</div>,
    //   size: 150,
    // },
    // {
    //   accessorKey: "MSIC_CODE",
    //   header: "MSIC Code",
    //   cell: ({ row }) => <div>{row.original.MSIC_CODE ?? "-"}</div>,
    //   size: 150,
    // },
    // {
    //   accessorKey: "BUSINESS_NATURE",
    //   header: "Business Nature",
    //   cell: ({ row }) => <div>{row.original.BUSINESS_NATURE ?? "-"}</div>,
    //   size: 200,
    // },
    // {
    //   accessorKey: "PIC_NAME",
    //   header: "PIC Name",
    //   cell: ({ row }) => <div>{row.original.PIC_NAME ?? "-"}</div>,
    //   size: 200,
    // },
    {
      accessorKey: "CREDIT_TERM",
      header: "Credit Term",
      cell: ({ row }) => {
        return row.original.CREDIT_TERM?.replace("Net", "").trim() ?? "-";
      },
      size: 110,
    },
    {
      accessorKey: "CREDIT_LIMIT",
      header: "Credit Limit",
      cell: ({ row }) => `${row.original.CREDIT_LIMIT! / 1000}k`,
      size: 110,
    },
    {
      accessorKey: "CREATED_AT",
      header: "Created At",
      cell: ({ row }) => {
        return new Date(row.original.CREATED_AT).toLocaleDateString();
      },
      size: 150,
    },
    {
      id: "actions",
      size: 60,
      cell: ({ row }) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="ghost"
            className="text-blue-500 focus:bg-blue-500/10 focus:text-blue-500"
            onClick={() =>
              router.push(`${current_path}/customer/edit/${row.original.ID}`)
            }
          >
            <Pencil className="h-2 w-2" />
          </Button>
          {isAdmin(user?.ROLE) && (
            <Button
              variant="ghost"
              className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
              onClick={() => {
                setSelectedRow(row.original.ID);
                setShowModal(true);
              }}
            >
              <Trash className="h-2 w-2" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    if (value === "") {
      setIsSearching(false);
    } else {
      setIsSearching(true);
    }

    searchMutate({ query: value });
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
      link.setAttribute("download", "users.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error("Failed to fetch CSV data");
    }
  };

  const displayedAdminData = isSearching
    ? (searchData?.admins ?? [])
    : (userData?.admins ?? []);
  const displayedCustomerData = isSearching
    ? (searchData?.customers ?? [])
    : (userData?.customers ?? []);

  return (
    <>
      <div className="w-full px-0 py-4 lg:px-4">
        <div className="flex items-center justify-between">
          <h1 className="mb-6 text-3xl">Users</h1>

          <div className="flex gap-2">
            <Button className="mb-4" onClick={() => handleExport()}>
              Export
            </Button>

            {isMasterAdmin(user?.ROLE) ? (
              <Button
                className="mb-4"
                onClick={() =>
                  router.push(current_path + `/${currentTab}/create`)
                }
              >
                Create {currentTab === "admin" ? "Admin" : "Customer"}
              </Button>
            ) : (
              <Button
                className="mb-4"
                onClick={() => router.push(current_path + `/customer/create`)}
              >
                Create Customer
              </Button>
            )}
          </div>
        </div>

        <SearchBar onSearch={handleSearch} isLoading={isPending} />

        <Tabs
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="admin">Admins</TabsTrigger>
            <TabsTrigger value="customer">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="admin">
            <DataTable
              columns={adminColumns}
              data={displayedAdminData}
              isLoading={isLoading || isPending}
            />
          </TabsContent>

          <TabsContent value="customer">
            <div className="w-full overflow-auto">
              <DataTable
                columns={customerColumns}
                data={displayedCustomerData}
                isLoading={isLoading || isPending}
              />
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={showModal} onOpenChange={() => setShowModal(false)}>
          <DeleteModal
            handleDelete={() => handleDelete(selectedRow, currentTab)}
            closeModal={() => {
              setShowModal(false);
            }}
          />
        </Dialog>
      </div>
    </>
  );
};

export default UserPage;
