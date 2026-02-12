export function maskName(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts
    .map((part) => {
      if (part.length <= 2) return part;
      return part.slice(0, 2) + '*****';
    })
    .join(' ');
}
