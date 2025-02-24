import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import LoginForm from "./login-form";

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: "Login - Quote AI",
  description: "Login to your account",
};

interface RedirectError extends Error {
  digest?: string;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  const params = await searchParams;
  
  if (session?.user) {
    redirect("/dashboard");
  }

  async function login(formData: FormData) {
    "use server";

    const email = formData.get("email");
    const password = formData.get("password");

    if (!email || !password) {
      throw new Error("Please provide both email and password");
    }

    try {
      await signIn("credentials", {
        email: email as string,
        password: password as string,
        callbackUrl: (typeof params.callbackUrl === 'string' ? params.callbackUrl : undefined) || "/dashboard",
        redirect: true
      });

      // Note: We won't reach here because redirect: true will handle the navigation
    } catch (error) {
      console.error("Login error:", error);
      // Only throw error if it's not a redirect
      if (!(error as RedirectError)?.digest?.includes('NEXT_REDIRECT')) {
        if ((error as Error).message.includes("CredentialsSignin")) {
          throw new Error("Invalid email or password");
        }
        throw error;
      }
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm login={login} error={params.error as string | undefined} />
    </div>
  );
}
