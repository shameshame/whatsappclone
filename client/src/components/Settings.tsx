import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { MoreVertical } from "lucide-react";
import { Account } from "./Account";
import { ChevronRight, ShieldUser } from "lucide-react";

export default function Settings() {
  return (
    <div className="min-h-screen bg-background p-4">
      <h1 className="mb-4 text-xl font-semibold">Settings</h1>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-2">
              <ShieldUser className="h-4 w-4" />
              Account
            </span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-56">
          <Account />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}