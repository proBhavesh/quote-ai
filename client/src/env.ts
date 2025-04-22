import { z } from "zod";

const serverSchema = z.object({
  STRIPE_SECRET_KEY: z.string({
    required_error:
      "STRIPE_SECRET_KEY is required. Get it from Stripe Dashboard → Developers → API keys",
  }),
  STRIPE_WEBHOOK_SECRET: z.string({
    required_error:
      "STRIPE_WEBHOOK_SECRET is required. Get it from Stripe Dashboard → Developers → Webhooks",
  }),
  STRIPE_PREMIUM_PRICE_ID: z.string({
    required_error:
      "STRIPE_PREMIUM_PRICE_ID is required. Create a Premium product in Stripe Dashboard",
  }),
  STRIPE_ENTERPRISE_PRICE_ID: z.string({
    required_error:
      "STRIPE_ENTERPRISE_PRICE_ID is required. Create an Enterprise product in Stripe Dashboard",
  }),
  // Xero OAuth credentials
  XERO_CLIENT_ID: z.string().optional(),
  XERO_CLIENT_SECRET: z.string().optional(),
  XERO_REDIRECT_URI: z.string().optional(),
});

// This is used to make sure we don't access server-side env vars on the client
const clientSchema = z.object({
  NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID: z.string(),
  NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID: z.string(),
});

/**
 * You can't destruct `process.env` as a regular object, so we do
 * a workaround. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
const processEnv = {
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
  STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
  STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID: process.env.STRIPE_PREMIUM_PRICE_ID,
  NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID: process.env.STRIPE_ENTERPRISE_PRICE_ID,
  // Xero environment variables
  XERO_CLIENT_ID: process.env.XERO_CLIENT_ID,
  XERO_CLIENT_SECRET: process.env.XERO_CLIENT_SECRET,
  XERO_REDIRECT_URI: process.env.XERO_REDIRECT_URI,
};

const merged = serverSchema.merge(clientSchema);

/** @type {Record<keyof z.infer<typeof merged>, string | undefined>} */
export const env =
  process.env.NODE_ENV === "production" ? merged.parse(processEnv) : processEnv;
