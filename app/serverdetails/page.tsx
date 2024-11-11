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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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

  // Function to handle server deletion
  const handleDelete = async (serverId) => {
    try {
      const res = await fetch(`/api/servers?serverId=${serverId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setServers((prevServers) =>
          prevServers.filter((server) => server.id !== serverId)
        );
        setSuccess("Server deleted successfully!");
      } else {
        const result = await res.json();
        setErrorState(result.error || "Failed to delete server.");
      }
    } catch (err) {
      console.error("Error deleting server:", err);
      setErrorState("Failed to delete server.");
    }
  };

  // Group servers into source and destination
  const sourceServers = servers.filter((server) => server.isSource);
  const destinationServers = servers.filter((server) => !server.isSource);

  return (
    <div className="flex flex-col lg:flex-row justify-center items-start lg:items-center h-screen space-x-0 lg:space-x-8 px-8">
      {/* First Card */}
      <div className="flex-1 max-w-2xl mb-8 lg:mb-0">
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
            {error && <p className="text-red-500 mb-4">{error}</p>}
            {success && <p className="text-green-500 mb-4">{success}</p>}

            {/* Source Servers */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Source Servers</h2>
              {sourceServers.length > 0 ? (
                <ul>
                  {sourceServers.map((server) => (
                    <li
                      key={server.id}
                      className="flex justify-between items-center mb-2"
                    >
                      <span>{server.hostUrl}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(server.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No source servers added.</p>
              )}
            </div>

            {/* Destination Servers */}
            <div>
              <h2 className="text-lg font-semibold mb-2">
                Destination Servers
              </h2>
              {destinationServers.length > 0 ? (
                <ul>
                  {destinationServers.map((server) => (
                    <li
                      key={server.id}
                      className="flex justify-between items-center mb-2"
                    >
                      <span>{server.hostUrl}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(server.id)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No destination servers added.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
