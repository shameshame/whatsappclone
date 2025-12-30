import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isHandheld: boolean;
  initialText: string;
  onSave: (nextText: string) => Promise<void> | void;
};

export function EditMessageDialog({
  open,
  onOpenChange,
  isHandheld,
  initialText,
  onSave,
}: Props) {
  const [value, setValue] = useState(initialText);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(initialText);
  }, [open, initialText]);

  const doSave = async () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  if (isHandheld) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Edit message</SheetTitle>
          </SheetHeader>

          <div className="mt-4 space-y-3">
            <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={doSave} disabled={saving || !value.trim()}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: Popover
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span />{/* controlled externally */}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <div className="text-sm font-medium mb-2">Edit message</div>
        <Input value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={doSave} disabled={saving || !value.trim()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
