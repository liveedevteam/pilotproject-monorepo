"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { useState } from "react";
import { trpc } from "@/trpc/client";
import { EnhancedAuthProvider } from "@repo/ui";
import superjson from "superjson";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: process.env.NODE_ENV === "development" ? false : 3,
            staleTime: 1000 * 60 * 5, // 5 minutes
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        ...(process.env.NODE_ENV === "development"
          ? [
              loggerLink({
                enabled: opts =>
                  process.env.NODE_ENV === "development" ||
                  (opts.direction === "down" && opts.result instanceof Error),
                colorMode: "ansi",
              }),
            ]
          : []),
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <EnhancedAuthProvider>{children}</EnhancedAuthProvider>
        {process.env.NODE_ENV === "development" && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
