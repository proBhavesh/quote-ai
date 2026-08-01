import { prisma } from "@/lib/prisma";
import { getUserOrganizations } from "@/lib/organizations";

export interface PriceHistoryResult {
  count: number;
  averageQuotedUnitPrice: number;
  averageMarketUnitPriceEstimate: number | null;
  minQuotedUnitPrice: number;
  maxQuotedUnitPrice: number;
  observations: {
    id: string;
    description: string;
    quantity: number;
    currency: string;
    quotedUnitPrice: number;
    marketUnitPriceEstimate: number | null;
    source: string;
    createdAt: Date;
    quote: { id: string; title: string } | null;
  }[];
}

export async function searchPriceHistory(
  query: string,
  userId: string
): Promise<PriceHistoryResult | null> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return null;
  }

  const memberships = await getUserOrganizations(userId);
  const organizationIds = memberships.map((m) => m.organization.id);

  const observations = await prisma.priceObservation.findMany({
    where: {
      description: { contains: trimmedQuery, mode: "insensitive" },
      OR: [
        { quote: { userId } },
        ...(organizationIds.length > 0
          ? [{ organizationId: { in: organizationIds } }]
          : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { quote: { select: { id: true, title: true } } },
  });

  if (observations.length === 0) {
    return {
      count: 0,
      averageQuotedUnitPrice: 0,
      averageMarketUnitPriceEstimate: null,
      minQuotedUnitPrice: 0,
      maxQuotedUnitPrice: 0,
      observations: [],
    };
  }

  const quotedPrices = observations.map((o) => o.quotedUnitPrice);
  const marketEstimates = observations
    .map((o) => o.marketUnitPriceEstimate)
    .filter((v): v is number => v != null);

  return {
    count: observations.length,
    averageQuotedUnitPrice:
      quotedPrices.reduce((sum, v) => sum + v, 0) / quotedPrices.length,
    averageMarketUnitPriceEstimate:
      marketEstimates.length > 0
        ? marketEstimates.reduce((sum, v) => sum + v, 0) / marketEstimates.length
        : null,
    minQuotedUnitPrice: Math.min(...quotedPrices),
    maxQuotedUnitPrice: Math.max(...quotedPrices),
    observations,
  };
}
