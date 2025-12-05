// components/NewChatSticky.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useUserDirectory } from "./useUserDirectory";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { httpErrorFromResponse } from "@/utilities/error-utils";
import { CreateGroupDialog } from "./CreateGroupDialog";

import { useChats } from "./context/ChatListContext";
import { ChatSummary } from "@shared/types/chatSummary";





export function NewChat() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const { addOrUpdateChat } = useChats();
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

  

  async function onStartChat(peerId: string) {
  // Ask server to create/ensure DM and give you chatId
    const res = await fetch(`/api/chat/dm/${encodeURIComponent(peerId)}/open`, {
      method: "POST",
      credentials: "include",
    });
    if (!res.ok) throw await httpErrorFromResponse(res);
    const data = await res.json() as { ok: boolean; chat:ChatSummary}; 
    

   if(data.chat.id===undefined){
    throw new Error("Chat ID is undefined");
   }
    addOrUpdateChat(data.chat);  // update chat list in UI

  // Navigate to /chat/:chatId
    navigate(`/chat/${data.chat.id}`); 
    setOpen(false);
  }

  function onNewGroupClick() {
    setGroupDialogOpen(true);     // ⬅️ open dialog
  }

  return (
    
    <>
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

          {/* NEW GROUP ROW */}
  <div className="px-4 pt-2 pb-1">
    <button
      type="button"
      onClick={onNewGroupClick}
      className="
        w-full flex items-center gap-3 rounded-lg px-2 py-2
        hover:bg-muted/60 transition text-left
      "
    >
      {/* dark-green circle */}
      <div
        className="
          h-9 w-9 rounded-full 
          bg-emerald-700 text-white 
          flex items-center justify-center
          shadow-sm
        "
      >
        <Users className="h-4 w-4" />
      </div>

      <div className="flex flex-col">
        <span className="text-sm font-medium">New group</span>
        <span className="text-xs text-muted-foreground">
          Create a group chat with multiple people
        </span>
      </div>
    </button>
  </div>




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
              onClick={() => onStartChat(user.id)}
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
    
    {/* Group creation dialog */}
      <CreateGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        users={usersExceptMe}
      />
    
    
    </>
  );
}
