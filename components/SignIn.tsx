"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const signInSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
});

export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();

  const formMethods = useForm({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const { handleSubmit, setError, formState: { errors } } = formMethods;

  const onSubmit = async (data) => {
    try {
      const res = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (res.ok) {
        signIn(result.user);
        router.push("/");
      } else {
        setError("root", { message: result.error || "An error occurred during sign-in" });
      }
    } catch (err) {
      setError("root", { message: "An error occurred during sign-in" });
      console.error("Sign-in error:", err);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          {errors.root && <p className="text-red-500 mb-4">{errors.root.message}</p>}
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormField
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your username" {...field} />
                    </FormControl>
                    {errors.username && (
                      <FormMessage>{errors.username.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your password" {...field} />
                    </FormControl>
                    {errors.password && (
                      <FormMessage>{errors.password.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-4">
                Sign In
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}