import React from "react";
import { useRegister } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Shield, KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/layout/AuthShell";

const adminRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  adminPasskey: z.string().min(1, "Admin passkey is required"),
});

export default function RegisterAdmin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const registerMutation = useRegister();

  const form = useForm<z.infer<typeof adminRegisterSchema>>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      adminPasskey: "",
    },
  });

  const onSubmit = (values: z.infer<typeof adminRegisterSchema>) => {
    registerMutation.mutate(
      {
        data: {
          name: values.name,
          email: values.email,
          password: values.password,
          role: "Admin",
          adminPasskey: values.adminPasskey,
        },
      },
      {
        onSuccess: (res) => {
          queryClient.setQueryData(getGetMeQueryKey(), res.user);
          setLocation("/dashboard");
        },
        onError: (err: any) => {
          toast({
            title: "Admin registration failed",
            description: err.message || "Please check your details and passkey.",
            variant: "destructive",
          });
        },
      },
    );
  };

  return (
    <AuthShell
      title="Admin Registration"
      subtitle="Create an administrator account with your institution passkey"
      icon={Shield}
      badge="Admin Registration"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Administrator" {...field} className="bg-background" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="admin@library.com" {...field} className="bg-background" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} className="bg-background" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="adminPasskey"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4" />
                  Admin Passkey
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter institution passkey"
                    {...field}
                    className="bg-background"
                  />
                </FormControl>
                <FormDescription>
                  Contact your institution to obtain the admin registration passkey.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="pt-2">
            <Button type="submit" className="w-full" size="lg" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? "Creating Account..." : "Create Admin Account"}
            </Button>
          </div>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an admin account?{" "}
        <Link href="/login/admin" className="text-primary font-medium hover:underline">
          Sign in instead
        </Link>
      </div>

      <div className="mt-3 text-center text-sm text-muted-foreground">
        Registering as a student?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Student registration
        </Link>
      </div>
    </AuthShell>
  );
}
