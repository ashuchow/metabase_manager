"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userSchema = z.object({
  username: z.string().min(2, { message: 'Username must be at least 2 characters.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['USER', 'SUPER_USER']),
});

export default function CreateUserPage() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formMethods = useForm({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      role: 'USER',
    },
  });
  const { handleSubmit, control, setError: setFormError, reset, formState: { errors } } = formMethods;

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || user?.role !== 'SUPER_USER') {
        router.push('/');
      }
    }
  }, [isAuthenticated, user, loading, router]);

  if (loading || !isAuthenticated || user?.role !== 'SUPER_USER') {
    return <div>Loading...</div>;
  }

  const onSubmit = async (data) => {
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess('User created successfully!');
        reset();
      } else {
        const result = await res.json();
        setFormError('root', { message: result.error || 'Failed to create user.' });
      }
    } catch (err) {
      setFormError('root', { message: 'Failed to create user.' });
    }
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create a New User</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          {success && <p className="text-green-500 mb-4">{success}</p>}
          <FormProvider {...formMethods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <FormField
                control={control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the username" {...field} />
                    </FormControl>
                    {errors.username && (
                      <FormMessage>{errors.username.message}</FormMessage>
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
                      <Input type="password" placeholder="Enter the password" {...field} />
                    </FormControl>
                    {errors.password && (
                      <FormMessage>{errors.password.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USER">User</SelectItem>
                          <SelectItem value="SUPER_USER">Super User</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {errors.role && (
                      <FormMessage>{errors.role.message}</FormMessage>
                    )}
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full mt-4">
                Create User
              </Button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
