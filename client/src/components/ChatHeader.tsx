import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import { MonitorSmartphone, MoreVertical, Settings, Users } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router";
import { useState } from "react";




export function ChatHeader(){

  const navigate=useNavigate()
    
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
    



    return <>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button
                      variant="ghost"
                      size="icon"
                      aria-label="More options"
                      className="rounded-full"
                  >
                      <MoreVertical className="h-5 w-5" />
                  </Button>
             </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          
          <DropdownMenuItem onSelect={() => navigate("/phone/devices")}>
            <MonitorSmartphone className="mr-2 h-4 w-4" />
            <span>Connected devices</span>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => navigate("/settings")}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem  onSelect={() => setGroupOpen(true)}>
            <Users className="mr-2 h-4 w-4" />
            <span>New group</span>
            <DropdownMenuShortcut>⌘G</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    
    
    
    </>
}