"use server";

import { auth } from "@/auth";
import { searchPriceHistory } from "@/lib/price-history";

export async function searchPriceHistoryAction(query: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Authentication required");

  return searchPriceHistory(query, userId);
}
