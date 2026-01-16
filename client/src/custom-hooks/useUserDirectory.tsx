import { httpErrorFromResponse } from "@/utilities/error-utils";
import { useEffect, useState, useMemo } from "react";

type UserSummary = { id: string; displayName: string, handle?: string | null };

export function useUserDirectory(currentUserId?: string) {
  const [usersExceptMe, setUsersExceptMe] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const ac = new AbortController();

    (async () => {
      setLoading(true);
      setError(undefined);
      
      try {
        const res = await fetch("/api/users", { credentials: "include" ,signal: ac.signal});
        
        if (!res.ok) httpErrorFromResponse(res);
        const data = await res.json();
        setUsersExceptMe((data.users ?? []) as UserSummary[]);
      } catch (err: unknown) {
         if ((err as Error).name !== "AbortError") 
            setError((err as Error).message ?? "Failed to load users");
      } finally {
        setLoading(false);
      }
    })();
    
    return () => ac.abort();
    
  }, []);

  return {
    usersExceptMe,            
    loading,
    error,
  };
}
