export function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span
      className="
        min-w-[20px] h-[20px]
        px-1
        flex items-center justify-center
        rounded-full
        bg-green-500
        text-white
        text-[11px]
        font-semibold
        leading-none
      "
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
