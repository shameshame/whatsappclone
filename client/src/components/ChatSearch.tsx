import { useMemo, useState } from "react";
import { Drawer, DrawerTrigger, DrawerContent } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { ChatMessage } from "@shared/types/chatMessage";

type ChatSearchProps = {
  messages: ChatMessage[];
};

export function ChatSearch({ messages }: ChatSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const searchableMessages = useMemo(
    () =>
      messages.filter(
        (message) =>
          message.type === "text" &&
          !message.isDeleted &&
          typeof message.text === "string" &&
          message.text.trim() !== ""
      ),
    [messages]
  );

  const filteredMessages = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) return [];

    return searchableMessages.filter((message) =>
      (message.text ?? "").toLowerCase().includes(term)
    );
  }, [searchTerm, searchableMessages]);

  return (
    <Drawer direction="right">
      <DrawerTrigger asChild>
        <div className="cursor-pointer rounded p-2 transition hover:bg-gray-100">
          <Search className="h-5 w-5 cursor-pointer" />
        </div>
      </DrawerTrigger>

      <DrawerContent className="ml-auto flex h-full max-w-sm flex-col border-l p-4">
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
          placeholder="Search text messages"
        />

        <div className="flex-1 space-y-2 overflow-y-auto">
          {searchTerm === "" ? (
            <p>Search for messages</p>
          ) : filteredMessages.length === 0 ? (
            <p className="text-sm text-muted-foreground">No messages found.</p>
          ) : (
            filteredMessages.map((message) => (
              <div key={message.id} className="rounded bg-muted p-2 text-sm">
                {message.text}
              </div>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}