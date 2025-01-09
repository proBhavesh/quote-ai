import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import LoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Login - Quote AI",
  description: "Login to your account",
};

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
      redirect: false,
    });
  } catch (error) {
    if ((error as Error).message.includes("CredentialsSignin")) {
      throw new Error("Invalid email or password");
    }
    throw error;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const { error } = await searchParams;

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoginForm login={login} error={error} />
    </div>
  );
}
