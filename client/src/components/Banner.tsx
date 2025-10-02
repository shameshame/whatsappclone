import { X, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerVariant } from "@/utilities/banner-map";




const iconByVariant: Record<BannerVariant, React.ElementType> = {
  default: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  destructive: AlertTriangle,
};

export function Banner({
  message,
  variant = "default",
  className,
  onClose,
  action,
}: {
  message: string;
  variant?: BannerVariant;
  className?: string;
  onClose?: () => void;
  action?: React.ReactNode; // optional extra button/link (e.g., “Create account”)
}) {
  const Icon = iconByVariant[variant];
  return (
    <Alert
      role="status"
      className={cn(
        "relative pr-10",
        variant === "warning" && "border-amber-300 text-amber-900 bg-amber-50",
        variant === "success" && "border-emerald-300 text-emerald-900 bg-emerald-50",
        variant === "destructive" && "border-red-300 text-red-900 bg-red-50",
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <AlertDescription className="text-sm">{message}</AlertDescription>
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </div>
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
