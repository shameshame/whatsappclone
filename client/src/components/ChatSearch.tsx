import { useState } from 'react';
import { Drawer, DrawerTrigger, DrawerContent } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function ChatSearch({ messages }: { messages: { id: string; text: string }[] }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMessages = messages.filter((msg) =>
    msg.text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Drawer direction="right">
      {/* Trigger Button (Search Icon) */}
      <DrawerTrigger asChild>
        <div className="cursor-pointer p-2 rounded hover:bg-gray-100 transition">
          <Search className="cursor-pointer h-5 w-5" />
        </div>
      </DrawerTrigger>

      {/* Slide-in Drawer */}
      <DrawerContent className="h-full max-w-sm ml-auto p-4 flex flex-col border-l">
        {/* Search Input */}
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-4"
        />

        

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-2">
          {searchTerm==='' 
           ? <div><p>Search for messages</p></div> 
           :filteredMessages.length === 0 
            ? (
            <p className="text-muted-foreground text-sm">No messages found.</p>
          ) : (
            filteredMessages.map((msg) => (
              <div key={msg.id} className="bg-muted p-2 rounded text-sm">
                {msg.text}
              </div>
            ))
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
