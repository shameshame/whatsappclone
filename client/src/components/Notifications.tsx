import { ArrowLeft, Bell } from "lucide-react";
import { useNavigate } from "react-router";

import { Button } from "@/components/ui/button";

export default function Notifications() {
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
            onClick={() => navigate("/settings")}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <h1 className="text-lg font-semibold">Notifications</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-xl p-4">
        <section className="rounded-2xl border bg-background p-4 shadow-sm">
          <h2 className="text-base font-semibold">Notifications</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Add mute settings, sound controls, vibration, and preview options here.
          </p>
        </section>
      </div>
    </main>
  );
}