// Generate a clean, deterministic vector logo for a tool, themed to the partner.
// Used when the partner does not upload a logo when creating an AI tool.

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

const escapeXml = (value: string) =>
  value.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case "<": return "&lt;";
      case ">": return "&gt;";
      case "&": return "&amp;";
      case '"': return "&quot;";
      case "'": return "&apos;";
      default: return c;
    }
  });

const getInitials = (name: string): string => {
  const parts = name
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "AI";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const generateToolLogoSvg = (toolName: string, theme: ThemeConfig): string => {
  const initials = escapeXml(getInitials(toolName || "AI"));
  const primary = escapeXml(theme.primary || "#3B82F6");
  const secondary = escapeXml(theme.secondary || "#1E40AF");
  const accent = escapeXml(theme.accent || "#60A5FA");
  const gradId = `g${Math.random().toString(36).slice(2, 8)}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${primary}"/><stop offset="100%" stop-color="${secondary}"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#${gradId})"/><circle cx="48" cy="16" r="6" fill="${accent}" fill-opacity="0.75"/><text x="32" y="40" text-anchor="middle" font-family="Inter, ui-sans-serif, system-ui, sans-serif" font-weight="700" font-size="24" fill="#ffffff">${initials}</text></svg>`;
};
