"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface LoginFormProps {
  login: (formData: FormData) => Promise<void>;
  error?: string;
}

// Define valid error types
type AuthErrorType =
  | "missing-fields"
  | "invalid-credentials"
  | "CredentialsSignin"
  | "credential"
  | "AuthorizeCallbackError"
  | "OAuthAccountNotLinked"
  | "fetch-failed"
  | string;

const formSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export default function LoginForm({ login, error }: LoginFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);

      // We don't need to handle redirects or success toasts here
      // The server action will handle redirects for both success and failure
      await login(formData);

      // If we get here, there was no redirect, which is unexpected but possible
      // Just in case, show a loading message
      toast({
        title: "Processing",
        description: "Please wait while we log you in...",
      });
    } catch (error) {
      // This will only happen if there's a client-side error before the server action
      console.error("Client-side login error:", error);

      // Handle any client-side validation or network errors
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your credentials to sign in to your account
          </p>
          {error && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {(() => {
                // Cast error to the union type
                const errorType = error as AuthErrorType;

                switch (errorType) {
                  case "missing-fields":
                    return "Please provide both email and password.";
                  case "invalid-credentials":
                  case "CredentialsSignin":
                  case "credential":
                    return "Invalid email or password. Please check your credentials and try again.";
                  case "AuthorizeCallbackError":
                    return "Authentication failed. Please try again or contact support if the issue persists.";
                  case "OAuthAccountNotLinked":
                    return "This email is already associated with a different provider. Please sign in using that method.";
                  case "fetch-failed":
                    return "Connection error. Please check your internet connection and try again.";
                  default:
                    return "An error occurred during login. Please try again or contact support.";
                }
              })()}
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="you@example.com"
                        type="email"
                        {...field}
                      />
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
                      <Input
                        type="password"
                        placeholder="••••••••"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </Form>
        </div>

        <p className="px-8 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="underline underline-offset-4 hover:text-primary"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
