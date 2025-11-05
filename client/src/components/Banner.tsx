import { X, Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BannerVariant } from "@/utilities/banner-map";

const iconByVariant: Record<BannerVariant, LucideIcon> = {
  default: Info,
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle2,
  destructive: AlertTriangle,
};

const wrapByVariant: Record<BannerVariant, string> = {
  default:
    "border-neutral-300 text-neutral-900 bg-neutral-50 " +
    "dark:border-neutral-700/60 dark:text-neutral-100 dark:bg-neutral-900/40",
  info: 
    "border-sky-300 text-sky-900 bg-sky-50 " +
    "dark:border-sky-700/60 dark:text-sky-100 dark:bg-sky-900/20",
  warning:
    "border-amber-300 text-amber-900 bg-amber-50 " +
    "dark:border-amber-700/60 dark:text-amber-100 dark:bg-amber-900/20",
  success:
    "border-emerald-300 text-emerald-900 bg-emerald-50 " +
    "dark:border-emerald-700/60 dark:text-emerald-100 dark:bg-emerald-900/20",
  destructive:
    "border-red-300 text-red-900 bg-red-50 " +
    "dark:border-red-700/60 dark:text-red-100 dark:bg-red-900/20",
};

const iconTintByVariant: Record<BannerVariant, string> = {
  default: "text-neutral-500 dark:text-neutral-400",
  info: "text-sky-600 dark:text-sky-300",
  warning: "text-amber-600 dark:text-amber-300",
  success: "text-emerald-600 dark:text-emerald-300",
  destructive: "text-red-600 dark:text-red-300",
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
  action?: React.ReactNode;
}) {
  const Icon = iconByVariant[variant];
  const role = variant === "destructive" ? "alert" : "status";
  const ariaLive = variant === "destructive" ? "assertive" : "polite";

  return (
    <Alert
      role={role}
      aria-live={ariaLive}
      className={cn(
        "relative",
        onClose ? "pr-10" : "", // only pad for the close button when present
        wrapByVariant[variant],
        className
      )}
    >
      <div className="flex items-start gap-3">
        <Icon
          className={cn("mt-0.5 h-5 w-5 shrink-0", iconTintByVariant[variant])}
          aria-hidden="true"
        />
        <div className="flex-1">
          <AlertDescription className="text-sm leading-5">
            {message}
          </AlertDescription>
          {action ? <div className="mt-2">{action}</div> : null}
        </div>
      </div>

      {onClose && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1 h-7 w-7"
          onClick={onClose}
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      )}
    </Alert>
  );
}
