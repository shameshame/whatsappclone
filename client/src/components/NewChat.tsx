// components/NewChatSticky.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, UserRound, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useUserDirectory } from "./useUserDirectory";
import { Avatar, AvatarFallback } from "./ui/avatar";

type UserLite = { id: string; displayName: string; handle?: string | null };

type Props = {
  
  /** Optional hook to create/open the DM server-side before navigating */
  onStartChat?: (peerId: string) => Promise<void> | void;
};

export function NewChatSticky({onStartChat }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const{ usersExceptMe } = useUserDirectory();
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return usersExceptMe;
    return usersExceptMe.filter(user =>
      user.displayName.toLowerCase().includes(q) ||
      (user.handle ?? "").toLowerCase().includes(q)
    );
  }, [usersExceptMe, query]);

  async function handleChoose(id: string) {
    setSelectedId(id);
    // if you want “single-select” behavior, uncheck others implicitly
    try {
      if (onStartChat) await onStartChat(id);
      navigate(`/chat/${encodeURIComponent(id)}`, { replace: false });
    } finally {
      setOpen(false);
      // small UX nicety: reset selection for next time
      setTimeout(() => setSelectedId(null), 200);
    }
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50",
        "bg-transparent",
        )}
      aria-label="New chat launcher"
    >
      <Button
        onClick={() => setOpen(true)}
        className="w-full h-11 font-medium bg-lime-500 hover:bg-lime-600 text-white shadow-md hover:shadow transition"
      >
        <Plus className="m-auto h-4 w-4" />
        
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] p-0">
          <SheetHeader className="px-4 pt-4">
            <SheetTitle>Start a new chat</SheetTitle>
            <SheetDescription>Select a person to open a direct message.</SheetDescription>
          </SheetHeader>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people…"
                className="pl-9"
                aria-label="Search users"
              />
            </div>
          </div>

          {/* List */}
          <ScrollArea className="h-[calc(85vh-132px)] px-1">
  <ul className="px-3 pb-6 space-y-1">
    {filtered.length === 0 ? (
      <li className="py-8 text-center text-sm text-muted-foreground">No matches</li>
    ) : (
      filtered.map((user) => {
        // Use first letter(s) as fallback
        const initials =
          (user.displayName?.match(/\b\p{L}/gu)?.slice(0, 2).join("") ||
            user.displayName?.slice(0, 2) ||
            "?").toUpperCase();

        return (
          <li key={user.id}>
            <button
              type="button"
              className="
                w-full flex items-center gap-3 rounded-lg px-3 py-2
                hover:bg-muted/60 transition text-left
              "
              onClick={async () => {
                if (onStartChat) await onStartChat(user.id);
                navigate(`/chat/${encodeURIComponent(user.id)}`);
                setOpen(false);
              }}
            >
              {/* Avatar circle (grey by default). Provide AvatarImage src if you have one */}
              <Avatar className="h-10 w-10">
                {/* If you later add profile photos: <AvatarImage src={u.photoUrl} alt={u.displayName} /> */}
                <AvatarFallback className="bg-muted text-foreground/80 text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="font-medium truncate">{user.displayName}</div>
                {user.handle &&
                  <div className="text-xs text-muted-foreground truncate">@{user.handle}</div>
                 }
              </div>
            </button>
          </li>
        );
      })
    )}
  </ul>
</ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
