import { httpLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";

import type { AppRouter } from "@/backend/trpc/app-router";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = (): string | null => {
  const url = process.env.EXPO_PUBLIC_RORK_API_BASE_URL;

  if (!url) {
    // Return null instead of throwing - allows app to function without TRPC
    console.warn(
      "EXPO_PUBLIC_RORK_API_BASE_URL not set. TRPC features will be disabled."
    );
    return null;
  }

  return url;
};

// Create a safe client that handles missing base URL
const baseUrl = getBaseUrl();

export const trpcClient = baseUrl
  ? trpc.createClient({
      links: [
        httpLink({
          url: `${baseUrl}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  : // Create a dummy client that won't crash the app
    trpc.createClient({
      links: [
        httpLink({
          url: "http://localhost:3000/api/trpc", // Dummy URL - won't be used
          transformer: superjson,
        }),
      ],
    });
