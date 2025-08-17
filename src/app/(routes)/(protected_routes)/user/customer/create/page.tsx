"use client";

import { useState } from "react";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Button } from "~/components/ui/button";
import { toast } from "react-hot-toast";
import { Textarea } from "~/components/ui/textarea";
import { useIsMobile } from "~/hooks/useMobile";
import BackButton from "~/app/_components/back-button";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useUserStore } from "~/lib/store/useUserStore";

const initialData = {
  CODE: "",
  NAME: "",
  SSM_REGISTRATION_NO: "",
  TAX_IDENTIFICATION_NO: "",
  SST_NO: "",
  MSIC_CODE: "",
  BUSINESS_NATURE: "",
  PIC_NAME: "",
  EMAIL: "",
  PHONE_NO: "",
  ADDRESS: "",
  CREDIT_TERM: "",
  CREDIT_LIMIT: 0,
};

export default function CreateCustomerPage() {
  const isMobile = useIsMobile();
  const router = useRouter();
  const util = api.useUtils();
  const { user } = useUserStore();
  const [formData, setFormData] = useState(initialData);

  const createCustomerMutation = api.user.createCustomer.useMutation({
    onSuccess: async () => {
      await util.user.getAll.invalidate();
      router.push("/user");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "CREDIT_LIMIT" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const promsie = createCustomerMutation.mutateAsync({
        ...formData,
        ADMIN_ID: user!.ID,
      });

      await toast.promise(promsie, {
        loading: "Creating customer...",
        success: "Customer created successfully!",
        error: "Failed to create customer",
      });
    } catch (error) {
      console.log(error);
      toast("Failed to create customer");
    }
  };

  return (
    <div className="w-full px-0 pt-4 lg:px-14">
      {!isMobile && <BackButton />}

      <h1 className="my-0 mb-10 text-3xl lg:my-10">Create Customer</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Company Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="CODE">Code</Label>
              <Input
                id="CODE"
                name="CODE"
                value={formData.CODE}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="NAME">Name</Label>
              <Input
                id="NAME"
                name="NAME"
                value={formData.NAME}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Registration & Tax Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Registration & Tax Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="SSM_REGISTRATION_NO">
                SSM Registration No (Optional)
              </Label>
              <Input
                id="SSM_REGISTRATION_NO"
                name="SSM_REGISTRATION_NO"
                value={formData.SSM_REGISTRATION_NO}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="TAX_IDENTIFICATION_NO">
                Tax ID No (Optional)
              </Label>
              <Input
                id="TAX_IDENTIFICATION_NO"
                name="TAX_IDENTIFICATION_NO"
                value={formData.TAX_IDENTIFICATION_NO}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="SST_NO">SST No (Optional)</Label>
              <Input
                id="SST_NO"
                name="SST_NO"
                value={formData.SST_NO}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="MSIC_CODE">MSIC Code (Optional)</Label>
              <Input
                id="MSIC_CODE"
                name="MSIC_CODE"
                value={formData.MSIC_CODE}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Business Details</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="BUSINESS_NATURE">
                Business Nature (Optional)
              </Label>
              <Input
                id="BUSINESS_NATURE"
                name="BUSINESS_NATURE"
                value={formData.BUSINESS_NATURE}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="PIC_NAME">Person in Charge (Optional)</Label>
              <Input
                id="PIC_NAME"
                name="PIC_NAME"
                value={formData.PIC_NAME}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Contact Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="EMAIL">Email</Label>
              <Input
                id="EMAIL"
                name="EMAIL"
                value={formData.EMAIL}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="PHONE_NO">Phone Number</Label>
              <Input
                id="PHONE_NO"
                name="PHONE_NO"
                value={formData.PHONE_NO}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Credit Info */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Credit Info</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="CREDIT_TERM">Credit Term</Label>
              <Input
                id="CREDIT_TERM"
                name="CREDIT_TERM"
                value={formData.CREDIT_TERM}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="CREDIT_LIMIT">Credit Limit</Label>
              <Input
                id="CREDIT_LIMIT"
                name="CREDIT_LIMIT"
                value={formData.CREDIT_LIMIT}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Address</h2>
          <div>
            <Label htmlFor="ADDRESS">Address</Label>
            <Textarea
              id="ADDRESS"
              name="ADDRESS"
              value={formData.ADDRESS}
              onChange={handleChange}
            />
          </div>
        </div>

        <Button type="submit" className="w-full">
          Create Customer
        </Button>
      </form>
    </div>
  );
}
