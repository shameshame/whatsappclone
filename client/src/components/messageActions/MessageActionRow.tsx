import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function ActionRow({
  icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "w-full justify-start h-12 rounded-xl px-3",
        danger && "text-red-600 hover:text-red-600"
      )}
    >
      <span className="mr-3">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
}