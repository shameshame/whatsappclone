import { ChevronRight} from "lucide-react";



type SettingsRowProps = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  destructive?: boolean;
  trailing?: React.ReactNode;
};

export default function SettingsRow({ icon, label, onClick }: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border bg-background px-4 py-4 text-left shadow-sm transition hover:bg-accent"
    >
      <span className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </span>

      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}