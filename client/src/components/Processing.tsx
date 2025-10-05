import {
  Item,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { SpinnerCustom } from "@/components/ui/spinner"

export function Processing({msg}:{msg:string}) {
  return (
    <div className="flex w-full max-w-xs flex-col gap-4 [--radius:1rem]">
      <Item variant="muted">
        <ItemMedia>
          <SpinnerCustom />
        </ItemMedia>
        <ItemContent>
          <ItemTitle className="line-clamp-1">{msg}</ItemTitle>
        </ItemContent>
        
      </Item>
    </div>
  )
}
