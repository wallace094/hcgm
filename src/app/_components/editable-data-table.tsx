/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

import React, { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  getPaginationRowModel,
} from "@tanstack/react-table";

import { LoadingSpinner } from "~/components/ui/loader";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import type { ForecastRow } from "../(routes)/(protected_routes)/dashboard/page";
import { useUserStore } from "~/lib/store/useUserStore";
import { isAdmin } from "~/lib/utils";
import { Input } from "~/components/ui/input";
// Add a new prop to identify which key (mt or costing) this table modifies
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading: boolean;
  onDataChange: (newData: TData, value: number, key: string) => void;
  setLocalData: React.Dispatch<
    React.SetStateAction<{
      mt: Omit<ForecastRow, "type">[];
      costing: Omit<ForecastRow, "type">[];
    }>
  >;
}

export function EditableDataTable<TData extends object, TValue>({
  columns,
  data,
  isLoading,
  onDataChange,
}: DataTableProps<TData, TValue>) {
  const { user } = useUserStore();
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    columnId: string;
  } | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    defaultColumn: { size: 80 },
  });

  function commitEdit(rowIndex: number, columnId: string, value: number) {
    onDataChange(data[rowIndex], value, columnId.toLowerCase());
    setEditingCell(null);
  }

  return (
    <div>
      <div className="mb-2 w-full rounded-md border">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <LoadingSpinner className="mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row, rowIndex) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => {
                    const isEditing =
                      editingCell?.rowIndex === rowIndex &&
                      editingCell?.columnId === cell.column.id;
                    const cellValue = cell.getValue();

                    return (
                      <TableCell
                        key={cell.id}
                        onDoubleClick={() => {
                          if (isAdmin(user?.ROLE)) {
                            setEditingCell({
                              rowIndex,
                              columnId: cell.column.id,
                            });
                          }
                        }}
                      >
                        {isEditing ? (
                          <Input
                            type="text"
                            className="w-full rounded border bg-white p-1"
                            autoFocus
                            defaultValue={cellValue as string | number}
                            onBlur={(e) =>
                              commitEdit(
                                rowIndex,
                                cell.column.id,
                                e.target.value,
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                commitEdit(
                                  rowIndex,
                                  cell.column.id,
                                  e.currentTarget.value,
                                );
                              }
                              if (e.key === "Escape") {
                                setEditingCell(null);
                              }
                            }}
                          />
                        ) : (
                          flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* <DataTablePagination table={table} /> */}
    </div>
  );
}
