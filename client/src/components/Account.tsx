import { useState } from "react";
import {
  ArrowLeft,
  Laptop,
  LogOut,
  ShieldUser,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";
import SettingsRow  from "./settings/SettingsRow";
import { useAuth } from "./context/AuthContext"; // adjust path

export default function AccountPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    try {
      setLoggingOut(true);
      await logout();
     
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Go back"
            onClick={() => navigate("/settings")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <ShieldUser className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Account</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl p-4">
        <div className="space-y-3">
          <SettingsRow
            icon={<UserCircle className="h-5 w-5" />}
            label="Profile"
            onClick={() => navigate("/settings/account/profile")}
          />

          <SettingsRow
            icon={<Laptop className="h-5 w-5" />}
            label="Connected devices"
            onClick={() => navigate("/phone/devices")}
          />

          <SettingsRow
            icon={<LogOut className="h-5 w-5" />}
            label={loggingOut ? "Logging out..." : "Log out"}
            onClick={() => {
              if (!loggingOut) void handleLogout();
            }}
            destructive
            trailing={null}
            
          />
        </div>
      </div>
    </main>
  );
}