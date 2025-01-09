import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import RegisterForm from "./register-form";

export const metadata: Metadata = {
  title: "Register - Quote AI",
  description: "Create a new account",
};

export default async function RegisterPage() {
  const session = await auth();
  if (session) {
    redirect("/");
  }

  async function register(formData: FormData) {
    "use server";

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!name || !email || !password) {
      return { message: "Please fill in all fields" };
    }

    if (password.length < 8) {
      return { message: "Password must be at least 8 characters" };
    }

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return { message: "Email already exists" };
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
        },
      });

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { message: "Something went wrong. Please try again." };
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <RegisterForm register={register} />
    </div>
  );
}
