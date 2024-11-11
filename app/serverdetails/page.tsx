"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const serverSchema = z.object({
  hostUrl: z.string(),
  email: z.string(),
  password: z.string(),
  isSource: z.boolean(),
});

export default function MetabaseServersPage() {
  const { user } = useAuth();
  const formMethods = useForm({
    resolver: zodResolver(serverSchema),
    defaultValues: {
      hostUrl: "",
      email: "",
      password: "",
      isSource: true,
    },
  });

  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = formMethods;
  const [servers, setServers] = useState([]); // State to hold the user's servers
  const [success, setSuccess] = useState("");
  const [error, setErrorState] = useState("");

  // Fetch servers associated with the user on component load
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await fetch(`/api/servers?userId=${user?.id}`);
        if (!res.ok) throw new Error("Failed to fetch servers");
        const data = await res.json();
        setServers(data);
      } catch (err) {
        console.error("Failed to load servers", err);
        setErrorState("Failed to load servers");
      }
    };

    if (user?.id) {
      fetchServers();
    }
  }, [user]);

  const onSubmit = async (data) => {
    try {
      const res = await fetch("/api/servers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, userId: user?.id }),
      });

      if (res.ok) {
        const newServer = await res.json();
        setSuccess("Server details saved successfully!");
        setServers((prevServers) => [...prevServers, newServer]);
        reset();
      } else {
        const result = await res.json();
        setError("root", {
          message: result.error || "Failed to save server details.",
        });
      }
    } catch (err) {
      setError("root", { message: "Failed to save server details." });
      console.error("Error in request to save server:", err);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen space-x-8 px-8">
      {/* First Card */}
      <div className="flex-1 max-w-2xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Add Metabase Server</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-500 mb-4">{success}</p>}
            <FormProvider {...formMethods}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FormField
                  control={control}
                  name="hostUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Host URL</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter the host URL" {...field} />
                      </FormControl>
                      {errors.hostUrl && (
                        <FormMessage>{errors.hostUrl.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      {errors.email && (
                        <FormMessage>{errors.email.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Enter your password"
                          {...field}
                        />
                      </FormControl>
                      {errors.password && (
                        <FormMessage>{errors.password.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="isSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Server Type</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value ? "source" : "destination"}
                          onValueChange={(value) =>
                            field.onChange(value === "source")
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select server type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="source">Source</SelectItem>
                            <SelectItem value="destination">
                              Destination
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      {errors.isSource && (
                        <FormMessage>{errors.isSource.message}</FormMessage>
                      )}
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full mt-4">
                  Save Server
                </Button>
              </form>
            </FormProvider>
          </CardContent>
        </Card>
      </div>

      {/* Second Card */}
      <div className="flex-1 max-w-2xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Your Metabase Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              {servers.map((server) => (
                <li key={server.id} className="mb-2">
                  {server.hostUrl} -{" "}
                  {server.isSource ? "Source" : "Destination"}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
