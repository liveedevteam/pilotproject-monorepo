"use client";

import { trpc } from "@/trpc/client";
import { Button } from "@repo/ui";

export default function Home() {
  const { data: users, isLoading, error } = trpc.user.getAll.useQuery();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">My Monorepo App</h1>

      <Button>Click Me!</Button>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold mb-4">Users:</h2>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error.message}</p>
        ) : (
          <pre>{JSON.stringify(users, null, 2)}</pre>
        )}
      </div>
    </main>
  );
}
