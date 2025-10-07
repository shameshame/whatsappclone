import { cn } from "@/lib/utils";
import { Device } from "@/types/device";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@radix-ui/react-dropdown-menu";
import {MoreVertical, LogOut, Laptop, Monitor, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "./ui/button";
import { getDevicePlatform, getIsMobile } from "@/utilities/device";







export function LinkedDeviceRow({ device, onSignOut }: { device: Device; onSignOut: () => void }) {
  
  const isMobile = device.mobile ?? getIsMobile(undefined, device.userAgent);
  
  function pickDeviceIcon(device: Device) {
    // Prefer your explicit flag
    if (device.mobile) return Smartphone;

     // Fallback heuristic from UA
    const ua = (device.userAgent || "").toLowerCase();
    if (/\b(iphone|ipad|ipod|android)\b/.test(ua)) return Smartphone;
    if (/\b(mac|windows|linux|cros)\b/.test(ua)) return Laptop;
    
    return Monitor;
}


  
  function formatLastSeen(iso?: string | null) {
    if (!iso) return "last seen: unknown";
    const time = new Date(iso).getTime();
    
    if (Number.isNaN(time)) return "last seen: unknown";
    const diff = Math.max(0, Date.now() - time);
    const mins = Math.round(diff / 60000);
    
    if (mins < 1) return "last seen: just now";
    else if (mins < 60) return `last seen: ${mins}m ago`;
    const hrs = Math.round(mins / 60);
    
    if (hrs < 24) return `last seen: ${hrs}h ago`;
    const days = Math.round(hrs / 24);
    
    return `last seen: ${days}d ago`;
}

const subtitle = [
    isMobile ? "Mobile" : "Desktop",
    getDevicePlatform(undefined, device.userAgent),
    formatLastSeen(device.lastSeenISO),
  ].filter(Boolean).join(" · ");


const Icon = pickDeviceIcon(device);  
  
return (
    <li className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border bg-muted",
          device.current && "border-primary/40"
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate font-medium">
              {device.name || "Unknown device"}
            </div>
            {device.current && <Badge variant="secondary">This device</Badge>}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {subtitle}
          </div>
          {/* Optionally show the full UA (wrap in details) */}
          {/* <div className="mt-1 truncate text-[11px] text-muted-foreground/70">{device.userAgent}</div> */}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="rounded-full">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </li>
  );
}