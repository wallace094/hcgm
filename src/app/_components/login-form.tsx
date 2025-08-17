"use client";
import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { api } from "~/trpc/react";
import { LoadingSpinner } from "~/components/ui/loader";
import { useEffect, useState } from "react";
import { redirect, useRouter } from "next/navigation";
import InputWithLabel from "~/components/ui/input-with-label";
import { useUserStore } from "~/lib/store/useUserStore";
import toast from "react-hot-toast";
import type { UserType } from "~/lib/types";
import type { TRPCError } from "@trpc/server";

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const router = useRouter();
  const { setUser } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { mutateAsync, isPending } = api.user.login.useMutation({
    onSuccess: (data) => {
      setUser(data);
      localStorage.setItem("USER-HCGM", JSON.stringify(data));

      return router.push("/dashboard");
    },
  });

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email || !password) return toast.error("Please fill all the fields");

    const promise = mutateAsync({ email, password });

    await toast.promise(promise, {
      loading: "Logging in...",
      success: "Login successful",
      error: (err: TRPCError) => {
        return err.message;
      },
    });
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("USER-HCGM");
    if (storedUser) {
      const userData = JSON.parse(storedUser) as UserType;
      setUser(userData);
      redirect("/dashboard");
    }
  }, [setUser]);

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="bg-white">
          <CardTitle className="text-2xl text-black">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="flex flex-col gap-6">
              <InputWithLabel label="Email" value={email} setValue={setEmail} />

              <InputWithLabel
                label="Password"
                value={password}
                setValue={setPassword}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? <LoadingSpinner /> : "Login"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
