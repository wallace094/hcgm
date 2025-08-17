"use client";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import BackButton from "~/app/_components/back-button";
import { Category } from "~/app/const";
import { Button } from "~/components/ui/button";
import InputWithLabel from "~/components/ui/input-with-label";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { useIsMobile } from "~/hooks/useMobile";
import { api } from "~/trpc/react";

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [baseUom, setBaseUom] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [unitPrice, setUnitPrice] = React.useState("");

  const utils = api.useUtils();
  const {
    mutateAsync,
    data: editData,
    isPending,
  } = api.product.edit.useMutation({
    onSuccess: () => {
      void utils.product.getAll.invalidate();
    },
  });

  const { data, isLoading } = api.product.getOne.useQuery({
    code: params.slug![0] ?? "",
  });

  const isMobile = useIsMobile();

  const handleEdit = async () => {
    if (!name || !category || !baseUom || !stock || !unitPrice || !code) {
      return toast.error("Please fill in all the fields.");
    }

    if (isNaN(+stock) || isNaN(+unitPrice)) {
      return toast.error("Stock and Unit Price must be numbers");
    }

    await toast.promise(
      mutateAsync({
        name,
        category,
        base_uom: baseUom,
        stock: +stock,
        unit_price: +unitPrice,
        code
      }),
      {
        loading: "Editing product...",
        success: "Product edited successfully!",
        error: "Failed to edit product",
      },
    );
  };

  useEffect(() => {
    if (data && !isLoading) {
      setCode(data.CODE);
      setName(data.NAME);
      setStock(data.STOCK + "");
      setBaseUom(data.BASE_UOM + "");
      setUnitPrice(data.UNIT_PRICE + "");
      // setRole(data.ROLE!.replace("_", " ").);

      const category = Category.find((r) => r.name === data.CATEGORY);

      if (category) {
        setCategory(category.name);
      }
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!isPending && editData) {
      router.push("/products");
    }
  }, [isPending, editData, router]);

  return (
    <div className="w-full px-0 pt-4 lg:px-14">
      {!isMobile && <BackButton />}

      <h1 className="my-0 mb-10 text-3xl lg:my-10">Edit Product</h1>

      <div className="flex w-full flex-col gap-6 lg:w-fit">
        <InputWithLabel label="Code" value={code} setValue={setCode} isDisabled/>
        <InputWithLabel label="Name" value={name} setValue={setName} />

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label>Category</Label>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Category Type" />
            </SelectTrigger>
            <SelectContent>
              {Category.map((item) => (
                <SelectItem key={item.id} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <InputWithLabel
          label="Base UOM"
          value={baseUom}
          setValue={setBaseUom}
        />

        <InputWithLabel
          label="Unit Price"
          value={unitPrice}
          setValue={setUnitPrice}
        />
        <InputWithLabel label="Stocks" value={stock} setValue={setStock} />

        <Button className="w-fit" onClick={handleEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
};

export default EditProductPage;
