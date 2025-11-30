export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;

  if (diffMs < 0) return "now";

  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return "now";

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;

  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h`;

  const day = Math.floor(hour / 24);
  if (day < 7) return `${day}d`;

  const date = new Date(timestamp);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayNum = String(date.getDate()).padStart(2, "0");
  return `${month}/${dayNum}`;
}
