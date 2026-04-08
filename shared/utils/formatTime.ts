export function formatTime(timestamp: number | string | Date) {
  return new Date(timestamp).toLocaleTimeString([], {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}