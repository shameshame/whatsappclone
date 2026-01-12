export function debounce<T extends (...args: any[]) => void>(fn: T, wait: number) {
  let time: number | undefined;
  return (...args: Parameters<T>) => {
    window.clearTimeout(time);
    time = window.setTimeout(() => fn(...args), wait);
  };
}