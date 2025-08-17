/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
"use client";
import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { api } from "~/trpc/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import type { Product, Remark } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { format } from "date-fns";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { CalendarIcon, Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import { cn, isAdmin, isMasterAdmin } from "~/lib/utils";
import { Calendar } from "~/components/ui/calendar";
import { useIsMobile } from "~/hooks/useMobile";
import BackButton from "~/app/_components/back-button";
import toast from "react-hot-toast";
import { Textarea } from "~/components/ui/textarea";
import { useUserStore } from "~/lib/store/useUserStore";

const EditSalesPage = () => {
  const { id } = useParams<{ id: string }>();

  const utils = api.useUtils();
  const router = useRouter();
  const isMobile = useIsMobile();

  const { user } = useUserStore();
  const { data: salesData, isLoading } = api.transactions.getOne.useQuery({
    id: +id,
  });

  const [customerId, setCustomerId] = React.useState<string>("");
  const [openCustomerComboBox, setOpenCustomerComboBox] = React.useState(false);

  const [productCode, setProductCode] = React.useState<string | null>(null);
  const [productArr, setProductArr] = React.useState<Product[]>([]);
  const [productDetails, setProductDetails] = React.useState<
    { quantity: string; price: string; name: string; code: string }[]
  >([]);

  const [openProductComboBox, setOpenProductComboBox] = React.useState(false);

  const [documentNo, setDocumentNo] = React.useState("");
  const [referenceDocNo, setReferenceDocNo] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState<Date | undefined>(
    undefined,
  );
  const [shippingMethod, setShippingMethod] = React.useState("");
  const [commission, setCommission] = React.useState("");
  const [remarks, setRemarks] = React.useState<Remark[]>([]);
  const [newRemark, setNewRemark] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [deliveryLocation, setDeliveryLocation] = React.useState("");

  const { data: customerData } = api.user.getAllCustomers.useQuery(
    { userId: +user!.ID },
    { enabled: !!user },
  );
  const { data: productData } = api.product.getAll.useQuery<Product[]>();

  const { mutate: editSales, isPending } = api.transactions.edit.useMutation({
    onSuccess: () => {
      void utils.transactions.getAll.invalidate();
      toast.success("Sales updated successfully");
      router.push("/sales");
    },
  });

  useEffect(() => {
    if (
      user?.ID !== salesData?.ADMIN_ID &&
      !isAdmin(user?.ROLE) &&
      !isLoading
    ) {
      toast.error("You are not authorized to edit this.");
      router.push("/sales");
    }
  }, [salesData, router, user, isLoading]);

  // Prefill data when salesData arrives
  useEffect(() => {
    if (salesData && productData) {
      setDocumentNo(salesData.DOC_NUM);
      setReferenceDocNo(salesData.REF_DOC_NO ?? "");
      setCustomerId(salesData.CUSTOMER_ID.toString());
      setDeliveryDate(new Date(salesData.DELIVERY_DATE!));
      setShippingMethod(salesData.SHIPPING_METHOD ?? "");
      setCommission(salesData.COMISSION ? salesData.COMISSION.toString() : "");
      setRemarks(salesData.remarks ?? []);
      setStatus(salesData.STATUS);
      setProductDetails(
        salesData.PRODUCTS.map((product) => ({
          quantity: product.QTY.toString(),
          price: product.UNIT_PRICE.toString(),
          name:
            productData.find((p) => p.CODE === product.PRODUCT_CODE)?.NAME ??
            "",
          code: product.PRODUCT_CODE.toString(),
        })),
      );
      setProductArr(
        salesData.PRODUCTS.map(
          (product) =>
            productData.find((p) => p.CODE === product.PRODUCT_CODE)!,
        ),
      );
      setDeliveryLocation(salesData.LOCATION ?? "");
    }
  }, [salesData, productData]);

  const handleUpdate = () => {
    const salesData = {
      transaction_id: +id,
      doc_num: documentNo,
      transaction_date: new Date().toISOString(),
      customer_id: customerId,
      admin_id: user!.ID + "",
      total_price: productDetails.reduce(
        (total, product) => total + +product.price * +product.quantity,
        0,
      ),
      ref_doc_no: referenceDocNo,
      delivery_date: deliveryDate
        ? deliveryDate.toISOString()
        : new Date().toISOString(),
      shipping_method: shippingMethod,
      comission: +commission,
      remark: newRemark,

      products: productDetails.map((p) => ({
        code: p.code,
        quantity: Number(p.quantity),
        price: Number(p.price),
      })),
      status: status,
      deliveryLocation,
    };

    editSales(salesData);
  };

  const removeProduct = (code: string) => {
    setProductArr((prev) => prev.filter((p) => p.CODE !== code));
    setProductDetails((prev) => prev.filter((p) => p.code !== code));
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="w-full px-0 pt-4 lg:px-14">
      {!isMobile && <BackButton />}
      <h1 className="my-0 mb-10 text-3xl lg:my-4">Edit Sales</h1>

      <div className="flex w-full flex-col gap-6 pb-8 pt-2 lg:w-2/3">
        <div className="grid w-full items-center gap-1.5">
          <div>
            <Label>Document No.</Label>
            <Input
              placeholder="Document No."
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
            />
          </div>
          <div>
            <Label>Reference Document No.</Label>
            <Input
              placeholder="REF-00123"
              value={referenceDocNo}
              onChange={(e) => setReferenceDocNo(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Customer</Label>
            <Popover
              open={openCustomerComboBox}
              onOpenChange={setOpenCustomerComboBox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  disabled
                >
                  {customerId
                    ? customerData?.find((c) => c.ID === +customerId)?.NAME
                    : "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 shadow-md">
                <Command>
                  <CommandInput placeholder="Search Customer..." />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {customerData?.map((customer) => (
                        <CommandItem
                          key={customer.ID}
                          value={customer.ID + ""}
                          onSelect={(currentValue) => {
                            setCustomerId(currentValue);
                            setOpenCustomerComboBox(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              customerId === customer.ID + ""
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {customer.NAME}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Products</Label>
            <Popover
              open={openProductComboBox}
              onOpenChange={setOpenProductComboBox}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                >
                  {productCode
                    ? productData?.find((c) => c.CODE === productCode)?.NAME
                    : "Select product..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 shadow-md">
                <Command>
                  <CommandInput placeholder="Search product..." />
                  <CommandList>
                    <CommandEmpty>No product found.</CommandEmpty>
                    <CommandGroup>
                      {productData
                        ?.filter(
                          (p) =>
                            !productDetails.some(
                              (pd) => pd.code === p.CODE + "",
                            ),
                        )
                        .map((product) => (
                          <CommandItem
                            key={product.CODE}
                            value={product.CODE + ""}
                            onSelect={(currentValue) => {
                              const product = productData?.find(
                                (c) => c.CODE === currentValue,
                              );
                              if (!product) return;

                              setProductArr([...productArr, product]);
                              setProductDetails([
                                ...productDetails,
                                {
                                  quantity: "",
                                  price: "",
                                  name: product.NAME,
                                  code: product.CODE,
                                },
                              ]);
                              setProductCode(currentValue);
                              setOpenProductComboBox(false);
                            }}
                          >
                            {product.NAME}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Card className="mx-auto my-6 w-full max-w-5xl">
            <CardHeader>
              <CardTitle className="text-xl">Product Entry Table</CardTitle>
            </CardHeader>
            <CardContent>
              {productArr.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#254336] text-white">
                      <tr>
                        <th className="p-3 text-left font-medium">
                          Product Name
                        </th>
                        <th className="p-3 text-left font-medium">Quantity</th>
                        <th className="p-3 text-left font-medium">Price</th>
                        <th className="p-3 text-left font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productArr.map((product, index) => (
                        <tr
                          key={product.CODE}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-3">{product.NAME}</td>
                          <td className="p-3">
                            <Input
                              min="0"
                              placeholder="Quantity"
                              className="h-9"
                              value={productDetails[index]?.quantity}
                              onChange={(e) => {
                                setProductDetails((prev) => {
                                  const newDetails = [...prev];
                                  newDetails[index] = {
                                    ...newDetails[index]!,
                                    quantity: e.target.value,
                                  };
                                  return newDetails;
                                });
                              }}
                            />
                          </td>

                          <td className="p-3">
                            <Input
                              min="0"
                              step="0.01"
                              placeholder="Price"
                              className="h-9"
                              value={productDetails[index]?.price}
                              onChange={(e) => {
                                setProductDetails((prev) => {
                                  const newDetails = [...prev];
                                  newDetails[index] = {
                                    ...newDetails[index]!,
                                    price: e.target.value,
                                  };
                                  return newDetails;
                                });
                              }}
                            />
                          </td>
                          <td className="p-3">
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeProduct(product.CODE)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div>No products added</div>
              )}
            </CardContent>
          </Card>

          <div className="flex flex-col items-start justify-center gap-2">
            <Label>Delivery Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deliveryDate && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deliveryDate ? (
                    format(deliveryDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={deliveryDate}
                  onSelect={setDeliveryDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Shipping Method</Label>
            <Select value={shippingMethod} onValueChange={setShippingMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="ex">Ex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isMasterAdmin(user?.ROLE) && (
            <div>
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="DELIVERED">Delivered</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label>Commission</Label>
            <Input
              placeholder="Enter commission (RM)"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2 py-2">
            <Label>Previous Remarks</Label>
            {remarks.map((r) => (
              <Label key={r.id}>{r.message}</Label>
            ))}
          </div>

          <div>
            <Label>Remarks</Label>

            <Input
              placeholder="Enter remarks"
              value={newRemark}
              onChange={(e) => setNewRemark(e.target.value)}
            />
          </div>
          <div>
            <Label>Delivery Location</Label>
            <Textarea
              placeholder="Enter Location"
              value={deliveryLocation}
              onChange={(e) => setDeliveryLocation(e.target.value)}
            />
          </div>
        </div>

        <Button className="w-fit" onClick={handleUpdate} disabled={isPending}>
          {isPending ? "Updating..." : "Update"}
        </Button>
      </div>
    </div>
  );
};

export default EditSalesPage;
