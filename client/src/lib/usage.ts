"use server";

import { PLANS } from "./plans";
import { checkSubscription } from "./stripe";
import { prisma } from "./prisma";
import { UsageInfo } from "./types/usage";

/**
 * Get the current usage information for a user
 */
export async function getUserUsage(userId: string): Promise<UsageInfo> {
  // Get user's subscription status
  const subscription = await checkSubscription(userId);
  const plan = PLANS[subscription?.plan || "free"];

  // Get current month's usage
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const currentUsage = await prisma.quote.count({
    where: {
      userId,
      createdAt: {
        gte: startOfMonth,
      },
    },
  });

  const maxQuotes = plan.quotas.maxQuotes;
  const remainingQuotes = Math.max(0, maxQuotes - currentUsage);
  const percentageUsed = (currentUsage / maxQuotes) * 100;
  const isOverLimit = currentUsage >= maxQuotes;

  let message: string | undefined;
  if (isOverLimit) {
    message = `You've reached your ${plan.name} plan limit of ${maxQuotes} quotes per month. Upgrade your plan to continue uploading and unlock additional features.`;
  } else if (remainingQuotes <= 5) {
    message = `You have ${remainingQuotes} quote${
      remainingQuotes === 1 ? "" : "s"
    } remaining in your ${
      plan.name
    } plan this month. Consider upgrading to avoid interruption.`;
  }

  return {
    currentUsage,
    maxQuotes,
    canUpload: !isOverLimit,
    remainingQuotes,
    percentageUsed,
    message,
    planName: plan.name,
    isOverLimit,
    limitType: "MONTHLY",
  };
}

/**
 * Check if a user has exceeded their usage limits
 */
export async function checkUsageLimit(userId: string): Promise<UsageInfo> {
  const usageInfo = await getUserUsage(userId);

  if (usageInfo.isOverLimit) {
    throw {
      code: "USAGE_LIMIT_EXCEEDED" as const,
      message: usageInfo.message || "Usage limit exceeded",
      usage: usageInfo,
    };
  }

  return usageInfo;
}

/**
 * Increment usage count for a user
 * Note: The quote creation itself serves as the usage tracking
 */
export async function incrementUsage(): Promise<void> {
  // The quote creation itself serves as the usage tracking
  // No need for a separate counter since we count quotes directly
}

/**
 * Reset usage for a user (typically at the start of a new billing period)
 * Note: This is handled automatically by counting only current month's quotes
 */
export async function resetUsage(): Promise<void> {
  // No action needed - usage is automatically reset by the date-based query
}
