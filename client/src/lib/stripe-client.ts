import Stripe from "stripe";
import { env } from "@/env";

if (!env.STRIPE_SECRET_KEY) {
  throw new Error(
    "STRIPE_SECRET_KEY is required. Get it from Stripe Dashboard → Developers → API keys"
  );
}

// This ensures stripe client is only created on the server
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
});
