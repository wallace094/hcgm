"use client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { CalendarIcon, Check, ChevronsUpDown, Trash2 } from "lucide-react";
import React from "react";
import BackButton from "~/app/_components/back-button";
import { Button } from "~/components/ui/button";
import { Calendar } from "~/components/ui/calendar";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useIsMobile } from "~/hooks/useMobile";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import type { Product } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import ConfirmSalesModal from "./confirmationModal";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import toast from "react-hot-toast";
import { useUserStore } from "~/lib/store/useUserStore";

const CreateSalesPage = () => {
  const isMobile = useIsMobile();

  const { user } = useUserStore();
  const [openConfirmModal, setOpenConfirmModal] = React.useState(false);
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
  const [shippingMethod, setShippingMethod] = React.useState("");
  const [commission, setCommission] = React.useState("");
  const [remarks, setRemarks] = React.useState("");
  const [deliveryLocation, setDeliveryLocation] = React.useState("");
  const [deliveryDate, setDeliveryDate] = React.useState<Date | undefined>(
    undefined,
  );

  const [stockErrors, setStockErrors] = React.useState<Record<string, string>>(
    {},
  );

  const { data: customerData } = api.user.getAllCustomers.useQuery(
    { userId: user?.ID ?? -1 },
    { enabled: !!user },
  );
  const { data: productData } = api.product.getAll.useQuery<Product[]>();

  const handleCreate = async () => {
    const hasStockErrors = Object.keys(stockErrors).length > 0;

    if (hasStockErrors) {
      toast.error("Please fix product quantity issues before proceeding.");
      return;
    }

    if (!documentNo.trim()) {
      toast.error("Document number is required.");
      return;
    }

    if (!customerId) {
      toast.error("Customer selection is required.");
      return;
    }

    if (productDetails.length === 0) {
      toast.error("At least one product must be selected.");
      return;
    }

    const hasInvalidProductDetails = productDetails.some(
      (p) => !p.quantity || !p.price || +p.quantity <= 0 || +p.price < 0,
    );

    if (hasInvalidProductDetails) {
      toast.error("All product quantities and prices must be valid.");
      return;
    }

    if (!deliveryDate) {
      toast.error("Delivery date is required.");
      return;
    }

    if (!deliveryLocation) {
      toast.error("Delivery location is required.");
      return;
    }

    if (!shippingMethod) {
      toast.error("Please select a shipping method.");
      return;
    }

    setOpenConfirmModal(true);
  };

  const removeProduct = (code: string) => {
    setProductArr((prev) => prev.filter((p) => p.CODE !== code));
    setProductDetails((prev) => prev.filter((p) => p.code !== code));
  };

  return (
    <div className="w-full px-0 pt-4 lg:px-14">
      {!isMobile && <BackButton />}
      <h1 className="my-0 mb-10 text-3xl lg:my-4">Create Sales</h1>

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
                            !productDetails.some((pd) => pd.code === p.CODE + ""),
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
                                  code: product.CODE + "",
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
                              className={cn(
                                "h-9",
                                stockErrors[product.CODE] && "border-red-500",
                              )}
                              value={productDetails[index]?.quantity}
                              onBlur={(e) => {
                                const requestedQuantity = +e.target.value;
                                const quantityAvailable = product.STOCK;

                                const errorMessage =
                                  requestedQuantity > quantityAvailable
                                    ? `Only ${quantityAvailable} available`
                                    : null;

                                if (errorMessage) {
                                  toast.error(
                                    `Only ${quantityAvailable} in stock for ${product.NAME}`,
                                  );
                                }

                                setStockErrors((prev) => {
                                  const newErrors = { ...prev };
                                  if (errorMessage) {
                                    newErrors[product.CODE] = errorMessage;
                                  } else {
                                    delete newErrors[product.CODE];
                                  }
                                  return newErrors;
                                });
                              }}
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
                            {stockErrors[product.CODE] && (
                              <p className="mt-1 text-xs text-red-600">
                                {stockErrors[product.CODE]}
                              </p>
                            )}
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

          <div>
            <Label>Commission</Label>
            <Input
              placeholder="Enter commission (RM)"
              value={commission}
              onChange={(e) => setCommission(e.target.value)}
            />
          </div>

          <div>
            <Label>Remarks</Label>
            <Input
              placeholder="Enter remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
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

        <Button className="w-fit" onClick={handleCreate}>
          Create
        </Button>
      </div>

      {openConfirmModal && (
        <ConfirmSalesModal
          open={openConfirmModal}
          onOpenChange={setOpenConfirmModal}
          customer={customerData!.find((c) => c.ID === +customerId)!}
          productDetails={productDetails}
          docNumber={documentNo}
          totalPrice={
            "RM" +
            productDetails.reduce((acc, curr) => {
              return acc + +curr.price * +curr.quantity;
            }, 0)
          }
          referenceDoc={referenceDocNo}
          deliveryDate={deliveryDate}
          shippingMethod={shippingMethod}
          commission={commission}
          remarks={remarks}
          deliveryLocation={deliveryLocation}
        />
      )}
    </div>
  );
};

export default CreateSalesPage;
