import { formatDistanceToNow, parseISO } from "date-fns";

/** Convert an ISO timestamp to a relative "2 hours ago" string */
export function relativeTime(iso: string | null): string {
  if (!iso) return "Never";
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

/** Copy text to clipboard and call back after a short delay */
export function copyToClipboard(text: string, onDone?: () => void) {
  navigator.clipboard.writeText(text).then(() => {
    if (onDone) setTimeout(onDone, 1500);
  });
}
