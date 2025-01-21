import { createClient } from "@supabase/supabase-js";

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false,
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
