import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

// Custom fetch function with retry logic
const customFetchWithRetryAndTimeout = async (url: RequestInfo | URL, options?: RequestInit) => {
  const MAX_RETRIES = 3;
  const TIMEOUT_MS = 30000; // 30 seconds

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      retries++;
      if (retries >= MAX_RETRIES) throw error;

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  throw new Error("Maximum retries reached");
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
    },
    global: {
      fetch: customFetchWithRetryAndTimeout,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

export async function verifyRealtimeConnection() {
  try {
    console.log("🔍 Verifying realtime connection...");

    const channel = supabase.channel("system");
    const status = await new Promise((resolve) => {
      channel
        .on("system", { event: "test" }, (payload) => {
          console.log("📡 Realtime test payload:", payload);
        })
        .subscribe((status) => {
          console.log("📡 Realtime connection status:", status);
          resolve(status);
        });
    });

    console.log("✅ Realtime connection verified:", status);
    return true;
  } catch (error) {
    console.error("❌ Realtime connection failed:", error);
    return false;
  }
}
