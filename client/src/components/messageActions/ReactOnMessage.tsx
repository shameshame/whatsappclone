import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const QUICK = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isHandheld: boolean;
  onPick: (emoji: string) => Promise<void> | void;
};

export function ReactPicker({ open, onOpenChange, isHandheld, onPick }: Props) {
  const pick = async (emoji: string) => {
    await onPick(emoji);
    onOpenChange(false);
  };

  if (isHandheld) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>React</SheetTitle>
          </SheetHeader>
          <div className="mt-4 grid grid-cols-6 gap-2">
            {QUICK.map(emoji => (
              <Button key={emoji} variant="secondary" className="h-12 text-xl" onClick={() => pick(emoji)}>
                {emoji}
              </Button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <span />{/* controlled externally */}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64">
        <div className="text-sm font-medium mb-2">React</div>
        <div className="grid grid-cols-6 gap-2">
          {QUICK.map(e => (
            <Button key={e} variant="secondary" className="h-10 text-lg" onClick={() => pick(e)}>
              {e}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
