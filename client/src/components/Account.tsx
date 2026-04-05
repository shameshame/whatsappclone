import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";


import { LogOut, ShieldUser } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useAuth } from "./context/AuthContext"; // adjust path if needed

export function Account() {
  const navigate = useNavigate();
  const { forceLogout } = useAuth();

  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
      forceLogout();
      navigate("/phone/login", { replace: true });
    }
    

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <ShieldUser className="mr-2 h-4 w-4" />
        <span>Account</span>
      </DropdownMenuSubTrigger>

      <DropdownMenuSubContent className="w-48">
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void handleLogout();
          }}
          disabled={loggingOut}
          className="text-red-600 focus:text-red-600"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

