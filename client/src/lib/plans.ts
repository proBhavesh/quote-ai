export interface PlanBase {
  name: string;
  id: string;
  price: number;
  quotas: {
    maxQuotes: number;
  };
}

export interface FreePlan extends PlanBase {
  id: "free";
}

export interface PaidPlan extends PlanBase {
  stripePriceId: string;
}

export const PLANS = {
  FREE: {
    name: "Free",
    id: "free",
    price: 0,
    quotas: {
      maxQuotes: 5,
    },
  } as FreePlan,
  PREMIUM: {
    name: "Premium",
    id: "premium",
    price: 29,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    quotas: {
      maxQuotes: 50,
    },
  } as PaidPlan,
  ENTERPRISE: {
    name: "Enterprise",
    id: "enterprise",
    price: 99,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_ENTERPRISE_PRICE_ID,
    quotas: {
      maxQuotes: -1, // unlimited
    },
  } as PaidPlan,
} as const;

export type PlanId = keyof typeof PLANS;
