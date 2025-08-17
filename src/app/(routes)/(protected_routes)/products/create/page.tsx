"use client";
import { useRouter } from "next/navigation";
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

const CreateProductPage = () => {
  const router = useRouter();
  const util = api.useUtils();
  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [baseUom, setBaseUom] = React.useState("");
  const [stock, setStock] = React.useState("");
  const [unitPrice, setUnitPrice] = React.useState("");

  const { mutateAsync, data, isPending, error, isError } =
    api.product.create.useMutation({
      onSuccess: async () => {
        await util.product.getAll.invalidate();
        router.push("/products");
      },
    });

  const isMobile = useIsMobile();

  const handleCreate = async () => {
    if (!name || !category || !baseUom || !stock || !unitPrice || !code) {
      return toast.error("Please fill in all the fields.");
    }

    if (isNaN(+stock) || isNaN(+unitPrice)) {
      return toast.error("Stock and Unit Price must be numbers");
    }

    const promise = mutateAsync({
      name,
      category,
      base_uom: baseUom,
      stock: +stock,
      unit_price: +unitPrice,
      code,
    });

    await toast.promise(promise, {
      loading: "Creating product...",
      success: "Product created successfully!",
      error: "Failed to create product",
    });
  };

  useEffect(() => {
    if (!isPending && data) {
      if (isError) {
        console.log(error);
        return;
      }

      router.push("/products");
    }
  }, [data, isPending, error, isError, router]);

  return (
    <div className="w-full px-0 pt-4 lg:px-14">
      {!isMobile && <BackButton />}

      <h1 className="my-0 mb-10 text-3xl lg:my-10">Create Product</h1>

      <div className="flex w-full flex-col gap-6 lg:w-fit">
        <InputWithLabel label="Code" value={code} setValue={setCode} />
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
          label="Units of Measurement"
          value={baseUom}
          setValue={setBaseUom}
        />

        <InputWithLabel
          label="Unit Price"
          value={unitPrice}
          setValue={setUnitPrice}
        />
        <InputWithLabel label="Stocks" value={stock} setValue={setStock} />

        <Button className="w-fit" onClick={handleCreate}>
          Create
        </Button>
      </div>
    </div>
  );
};

export default CreateProductPage;
