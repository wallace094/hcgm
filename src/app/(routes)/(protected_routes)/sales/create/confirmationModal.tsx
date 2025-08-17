"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
import type { Customer } from "@prisma/client";
import { api } from "~/trpc/react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useUserStore } from "~/lib/store/useUserStore";

interface ConfirmSalesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
  productDetails: {
    quantity: string;
    price: string;
    name: string;
    code: string;
  }[];
  totalPrice: string;
  docNumber: string;
  referenceDoc: string;
  deliveryDate: Date | undefined;
  shippingMethod: string;
  commission: string;
  remarks: string;
  deliveryLocation: string;
}

const ConfirmSalesModal: React.FC<ConfirmSalesModalProps> = ({
  open,
  onOpenChange,
  customer,
  productDetails,
  totalPrice,
  docNumber,
  referenceDoc,
  deliveryDate,
  shippingMethod,
  commission,
  remarks,
  deliveryLocation,
}) => {
  const utils = api.useUtils();
  const { user } = useUserStore();
  const router = useRouter();

  const { mutateAsync: createSales, isPending } =
    api.transactions.create.useMutation({
      onSuccess: () => {
        void utils.transactions.getAll.invalidate();
        onOpenChange(false);
        router.push("/sales");
      },
      onError: (error) => {
        console.log(error);
        toast.error("Failed to create sales.");
      },
    });

  const handleCreate = async () => {
    const salesData = {
      doc_num: docNumber,
      transaction_date: new Date().toISOString(),
      customer_id: customer.ID + "",
      admin_id: user!.ID + "",
      total_price: parseInt(totalPrice.replace("RM", "")),
      ref_doc_no: referenceDoc,
      delivery_date: deliveryDate
        ? deliveryDate.toISOString()
        : new Date().toISOString(),
      shipping_method: shippingMethod,
      comission: +commission,
      remark: remarks,
      deliveryLocation: deliveryLocation,
      products: productDetails.map((p) => ({
        code: p.code,
        quantity: Number(p.quantity),
        price: Number(p.price),
      })),
    };

    const promise = createSales(salesData);

    await toast.promise(promise, {
      loading: "Creating sales...",
      success: "Sales created successfully!",
      error: "Failed to create sales",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Confirm Sales Creation</DialogTitle>
          <DialogDescription>
            Please review the details below before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 text-sm">
          <div>
            <strong>Document No.:</strong> {docNumber || "-"}
          </div>
          <div>
            <strong>Reference Document No.:</strong> {referenceDoc || "-"}
          </div>

          <div>
            <strong>Customer:</strong> {customer.NAME ?? "-"}
          </div>

          <Card className="mx-auto my-6 w-full max-w-5xl">
            <CardHeader>
              <CardTitle className="text-xl">Product Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {productDetails.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-[#254336] text-white">
                      <tr>
                        <th className="p-3 text-left font-medium">
                          Product Name
                        </th>
                        <th className="p-3 text-left font-medium">Quantity</th>
                        <th className="p-3 text-left font-medium">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productDetails.map((product) => (
                        <tr
                          key={product.code}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-3">{product.name}</td>
                          <td className="p-3">{product.quantity || "-"}</td>
                          <td className="p-3">RM{product.price || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-muted-foreground">No products added</div>
              )}
            </CardContent>
          </Card>

          <div>
            <strong>Total Price:</strong> {totalPrice || "-"}
          </div>

          <div>
            <strong>Delivery Date:</strong>{" "}
            {deliveryDate ? format(deliveryDate, "PPP") : "-"}
          </div>
          <div>
            <strong>Shipping Method:</strong> {shippingMethod || "-"}
          </div>
          <div>
            <strong>Commission:</strong> {`RM${commission}` || "-"}
          </div>
          <div>
            <strong>Remarks:</strong> {remarks || "-"}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isPending}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmSalesModal;
