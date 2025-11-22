import { useState } from "react";
import ChatList from "./ChatList";
import WelcomePanel from "./WelcomePanel";
import ChatWindow from "./ChatWindow";

/**
 * Layout: left sidebar (ChatList) + main area.
 * - If a peerId is present in the route, render ChatWindow (which includes ChatSearch).
 * - Otherwise render the centered WelcomePanel.
 */
export default function ChatPage() {
  const[peerId,setPeerId]=useState<string | null>(null);
  
  
  return (
    <div className="flex w-full h-screen">
      <ChatList/>

      <main className="flex-1 min-w-0 bg-[#F5F5DC]">
        {peerId ? <ChatWindow /> : <WelcomePanel />}
      </main>
    </div>
  );
}