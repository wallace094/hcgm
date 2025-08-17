"use client";
import type { Admin } from "@prisma/client";
import { useRouter, useParams } from "next/navigation";
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import BackButton from "~/app/_components/back-button";
import { Regions, Roles } from "~/app/const";
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
import { useUserStore } from "~/lib/store/useUserStore";
import { isAdmin } from "~/lib/utils";
import { api } from "~/trpc/react";

const EditUserPage = () => {
  const router = useRouter();
  const params = useParams();
  const { user } = useUserStore();
  const isMobile = useIsMobile();

  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<string>("");
  const [region, setRegion] = React.useState<string>("");

  const utils = api.useUtils();
  const type = window.location.pathname.includes("admin")
    ? "admin"
    : "customer";
  const adminId = params.slug ? Number(params.slug) : null;
  const { data, isLoading } = api.user.getOne.useQuery(
    { id: adminId ?? -1, type: type },
    { enabled: !!adminId },
  );

  const {
    mutate,
    isPending,
    data: editData,
  } = api.user.editAdmin.useMutation({
    onSuccess: () => {
      void utils.user.invalidate();

      router.push("/user");
      toast.success("Admin updated successfully!");
    },
  });

  useEffect(() => {
    if (!isAdmin(user?.ROLE) && !isLoading) {
      toast.error("You are not authorized to edit this.");
      router.push("/user");
    }
  }, [router, user, isLoading]);

  useEffect(() => {
    if (data && !isLoading) {
      const admin = data as Admin;
      setCode(admin.CODE);
      setName(admin.NAME);
      setPhone(admin.PHONE);
      setEmail(admin.EMAIL);
      setPassword(admin.PASSWORD);
      setRegion(
        admin.REGION.replace("_", " ")
          .toLowerCase()
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
      );

      // setRole(admin.ROLE.replace("_", " ").);

      const role = Roles.find(
        (r) =>
          r.name.toLowerCase() === admin.ROLE.replace("_", " ").toLowerCase(),
      );

      if (role) {
        console.log(role);
        setRole(role.name);
      }
    }
  }, [data, isLoading]);

  useEffect(() => {
    if (!isPending && editData) router.push(`/user`);
  }, [isPending, router, editData]);

  const handleEdit = () => {
    mutate({
      id: data!.ID,
      name,
      email,
      password,
      phone: +phone,
      role: role.toUpperCase().replaceAll(" ", "_"),
      region: region.toUpperCase().replaceAll(" ", "_"),
      code,
    });
  };

  return (
    <div className="w-full px-0 pt-4 lg:px-14">
      {!isMobile && <BackButton />}

      <h1 className="my-0 mb-10 text-3xl lg:my-10">Edit User</h1>

      <div className="flex w-full flex-col gap-6 lg:w-fit">
        <InputWithLabel label="Code" value={code} setValue={setCode} />
        <InputWithLabel label="Name" value={name} setValue={setName} />
        <InputWithLabel label="Phone" value={phone} setValue={setPhone} />
        <InputWithLabel label="Email" value={email} setValue={setEmail} />

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label>Role</Label>

          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Role Type" />
            </SelectTrigger>
            <SelectContent>
              {Roles.map((item) => (
                <SelectItem key={item.id} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label>Region</Label>

          <Select
            value={region}
            onValueChange={setRegion}
            disabled={role.toLowerCase() !== "salesperson"}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Role Type" />
            </SelectTrigger>
            <SelectContent>
              {Regions.map((item) => (
                <SelectItem key={item.id} value={item.name}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <InputWithLabel
          label="Password"
          value={password}
          setValue={setPassword}
        />

        <Button className="w-fit" onClick={handleEdit}>
          Edit
        </Button>
      </div>
    </div>
  );
};
export default EditUserPage;
