import { useEffect, useState, useMemo } from "react";

type UserSummary = { id: string; displayName: string };

export function useUserDirectory(currentUserId?: string) {
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setError(undefined);
      try {
        const res = await fetch("/api/users", { credentials: "include" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setUsers((data.users ?? []) as UserSummary[]);
      } catch (err: any) {
        
        // Check how to use an errorHandler here ( in utils)
        if (err.name !== "AbortError") setError(err.message ?? "Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
    
    return () => ac.abort();
    
  }, []);

  // 🔹 memoized derived values

  const usersExcludingMe = useMemo(
    () => users.filter(user => user.id !== currentUserId),
    [users, currentUserId]
  );

  const sortedUsers = useMemo(
    () =>
      [...usersExcludingMe].sort((a, b) =>
        a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" })
      ),
    [usersExcludingMe]
  );

  return {
    users,            // raw list from server
    usersExcludingMe, // derived, memoized
    sortedUsers,      // derived, memoized
    loading,
    error,
  };
}
