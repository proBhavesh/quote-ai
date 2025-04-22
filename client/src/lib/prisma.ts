import { PrismaClient } from "@prisma/client";

// Check if we're running on the server or client
const isServer = typeof window === 'undefined';

// Define extended Prisma types to ensure the client properly handles all models
// This is particularly important for models that might have been added or modified
type ExtendedPrismaClient = PrismaClient;

function getPrismaClient(): ExtendedPrismaClient {
  try {
    // Only initialize PrismaClient on the server
    if (!isServer) {
      // Return a mock/dummy client for client-side
      return {} as ExtendedPrismaClient;
    }

    return new PrismaClient({
      log: ["error"],
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  } catch (error) {
    console.error("[PRISMA_CLIENT_ERROR]", error);
    throw new Error(
      "Failed to initialize Prisma client. Check your database connection."
    );
  }
}

const prismaClientSingleton = () => {
  // Only check for DATABASE_URL on the server
  if (isServer && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }
  return getPrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
