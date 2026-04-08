import { ArrowLeft, Bell, Settings, Shield, User } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import SettingsRow  from "./settings/SettingsRow";

export default function SettingsPage() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-xl items-center gap-3 px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl p-4">
        <div className="space-y-3">
          <SettingsRow
            icon={<User className="h-5 w-5" />}
            label="Account"
            onClick={() => navigate("/settings/account")}
          />

          <SettingsRow
            icon={<Shield className="h-5 w-5" />}
            label="Security"
            onClick={() => navigate("/settings/security")}
          />

          <SettingsRow
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            onClick={() => navigate("/settings/notifications")}
          />
        </div>
      </div>
    </main>
  );
}