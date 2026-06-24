import { Link } from "react-router-dom";
import type { AITool } from "@/data/aiRegistry";
import { getPartnerKeyFromProvider } from "@/data/aiRegistry";
import { ArrowRight, ExternalLink } from "lucide-react";

const AICard = ({ tool }: { tool: AITool }) => {
  const partnerKey = tool.partnerKey ?? getPartnerKeyFromProvider(tool.provider);
  const partnerLink = partnerKey ? `/partners/${partnerKey}#${tool.id}` : `/ai-technology/${tool.id}`;

  const themeColors: Record<string, { primary: string; accent: string }> = {
    openai: { primary: "#10A37F", accent: "#1A7F64" },
    microsoft: { primary: "#0078D4", accent: "#005A9E" },
    google: { primary: "#4285F4", accent: "#1A73E8" },
    canva: { primary: "#00C4CC", accent: "#7D2AE8" },
  };

  const theme = tool.partnerTheme ?? (partnerKey ? themeColors[partnerKey] : undefined) ?? {
    primary: "hsl(var(--primary))",
    accent: "hsl(var(--accent))",
  };

  const glass = (color: string, opacity: number) =>
    `color-mix(in srgb, ${color} ${Math.round(opacity * 100)}%, transparent)`;

  return (
    <Link
      to={partnerLink}
      className="group flex flex-col rounded-xl border p-5 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:-translate-y-0.5 backdrop-blur-md"
      style={{
        background: `linear-gradient(140deg, ${glass(theme.primary, 0.14)}, ${glass(theme.accent, 0.14)})`,
        borderColor: glass(theme.primary, 0.35),
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="flex-1 font-display text-base font-bold text-foreground">
          {tool.name}
        </h3>
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide"
          style={{
            background: `linear-gradient(135deg, ${glass(theme.primary, 0.2)}, ${glass(theme.accent, 0.2)})`,
            borderColor: glass(theme.primary, 0.35),
            color: theme.primary,
          }}
        >
          {tool.provider}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
        {tool.description}
      </p>

      <div className="mt-4">
        <span
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold backdrop-blur-xl transition-all duration-200 hover:shadow-md"
          style={{
            background: `linear-gradient(135deg, ${glass(theme.primary, 0.4)}, ${glass(theme.accent, 0.4)})`,
            borderColor: glass(theme.accent, 0.45),
            color: "hsl(var(--foreground))",
            boxShadow: `inset 0 0 0 1px ${glass(theme.primary, 0.25)}`,
          }}
        >
          {tool.externalUrl ? "Visit Tool" : "View Details"}
          {tool.externalUrl ? <ExternalLink className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
        </span>
      </div>
    </Link>
  );
};

export default AICard;
