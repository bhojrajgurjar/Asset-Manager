import React from "react";
import { useLogin, useLogout } from "@workspace/api-client-react";
import { useLocation, Link, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { GraduationCap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AuthShell } from "@/components/layout/AuthShell";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const ROLE_CONFIG = {
  user: {
    label: "Student",
    apiRole: "Student" as const,
    icon: GraduationCap,
    description: "Sign in to browse books, manage loans, and discover reads",
    placeholder: "student@library.com",
  },
  admin: {
    label: "Admin",
    apiRole: "Admin" as const,
    icon: Shield,
    description: "Sign in to manage catalog, users, and library operations",
    placeholder: "admin@library.com",
  },
};

export default function Login() {
  const [, params] = useRoute("/login/:role");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const roleKey = params?.role === "admin" ? "admin" : "user";
  const config = ROLE_CONFIG[roleKey];
  const RoleIcon = config.icon;

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (res) => {
        if (res.user.role !== config.apiRole) {
          logoutMutation.mutate(undefined, {
            onSettled: () => {
              queryClient.setQueryData(getGetMeQueryKey(), null);
              toast({
                title: "Wrong account type",
                description: `This login is for ${config.label} accounts. Please use the correct login option.`,
                variant: "destructive",
              });
            },
          });
          return;
        }
        queryClient.setQueryData(getGetMeQueryKey(), res.user);
        setLocation("/dashboard");
      },
      onError: (err: any) => {
        toast({
          title: "Login failed",
          description: err.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AuthShell
      title={`Welcome back`}
      subtitle={config.description}
      icon={RoleIcon}
      badge={`${config.label} Login`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder={config.placeholder} {...field} className="bg-background" />
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
          <Button type="submit" className="w-full" size="lg" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : `Sign In as ${config.label}`}
          </Button>
        </form>
      </Form>

      <div className="mt-6 text-center text-sm text-muted-foreground">
        {roleKey === "user" ? (
          <>
            Are you an administrator?{" "}
            <Link href="/login/admin" className="text-primary font-medium hover:underline">
              Admin login
            </Link>
          </>
        ) : (
          <>
            Are you a student?{" "}
            <Link href="/login/user" className="text-primary font-medium hover:underline">
              Student login
            </Link>
          </>
        )}
      </div>

      <div className="mt-3 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        {roleKey === "admin" ? (
          <Link href="/register/admin" className="text-primary font-medium hover:underline">
            Register as admin
          </Link>
        ) : (
          <Link href="/register" className="text-primary font-medium hover:underline">
            Register here
          </Link>
        )}
      </div>
    </AuthShell>
  );
}
