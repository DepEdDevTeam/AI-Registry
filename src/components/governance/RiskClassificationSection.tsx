import { useState } from "react";
import {
  GraduationCap,
  BookOpen,
  Building2,
  Shield,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  CheckCircle,
  Info,
  ShieldX,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  stakeholderData,
  type RiskLevel,
  type RiskClassification,
  type StakeholderGroup,
} from "./RiskClassificationData";

/* ── icon helpers ── */
const stakeholderIcons: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="h-4 w-4" />,
  BookOpen: <BookOpen className="h-4 w-4" />,
  Building2: <Building2 className="h-4 w-4" />,
};

const riskIcons: Record<RiskLevel, React.ReactNode> = {
  minimal: <CheckCircle className="h-5 w-5" />,
  limited: <Info className="h-5 w-5" />,
  high: <AlertTriangle className="h-5 w-5" />,
  unacceptable: <ShieldAlert className="h-5 w-5" />,
};

/* ── colour tokens (mapped to CSS vars already in index.css) ── */
const riskStyles: Record<
  RiskLevel,
  {
    border: string;
    bg: string;
    iconColor: string;
    badgeBg: string;
    badgeText: string;
    indicator: string;
    hoverBorder: string;
  }
> = {
  minimal: {
    border: "border-risk-minimal/25",
    bg: "bg-risk-minimal/5",
    iconColor: "text-risk-minimal",
    badgeBg: "bg-risk-minimal/10",
    badgeText: "text-risk-minimal",
    indicator: "bg-risk-minimal",
    hoverBorder: "hover:border-risk-minimal/50",
  },
  limited: {
    border: "border-risk-limited/25",
    bg: "bg-risk-limited/5",
    iconColor: "text-risk-limited",
    badgeBg: "bg-risk-limited/10",
    badgeText: "text-risk-limited",
    indicator: "bg-risk-limited",
    hoverBorder: "hover:border-risk-limited/50",
  },
  high: {
    border: "border-risk-high/25",
    bg: "bg-risk-high/5",
    iconColor: "text-risk-high",
    badgeBg: "bg-risk-high/10",
    badgeText: "text-risk-high",
    indicator: "bg-risk-high",
    hoverBorder: "hover:border-risk-high/50",
  },
  unacceptable: {
    border: "border-risk-unacceptable/25",
    bg: "bg-risk-unacceptable/5",
    iconColor: "text-risk-unacceptable",
    badgeBg: "bg-risk-unacceptable/10",
    badgeText: "text-risk-unacceptable",
    indicator: "bg-risk-unacceptable",
    hoverBorder: "hover:border-risk-unacceptable/50",
  },
};

const policyIcons: Record<RiskLevel, React.ReactNode> = {
  minimal: <ShieldCheck className="h-3.5 w-3.5" />,
  limited: <Shield className="h-3.5 w-3.5" />,
  high: <ShieldAlert className="h-3.5 w-3.5" />,
  unacceptable: <ShieldX className="h-3.5 w-3.5" />,
};

/* ── Risk spectrum bar ── */
function RiskSpectrum() {
  const levels: { level: RiskLevel; label: string }[] = [
    { level: "minimal", label: "Minimal" },
    { level: "limited", label: "Limited" },
    { level: "high", label: "High" },
    { level: "unacceptable", label: "Unacceptable" },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-center gap-0 rounded-lg overflow-hidden border border-border">
        {levels.map((l, i) => (
          <div
            key={l.level}
            className={cn(
              "flex-1 py-2.5 px-3 text-center text-xs font-semibold tracking-wide transition-colors",
              riskStyles[l.level].indicator,
              "text-white",
              i < levels.length - 1 && "border-r border-white/20"
            )}
          >
            {l.label}
          </div>
        ))}
      </div>
      <div className="flex justify-between mt-1.5 px-1">
        <span className="text-[10px] text-muted-foreground font-medium">LOW RISK</span>
        <span className="text-[10px] text-muted-foreground font-medium">HIGH RISK</span>
      </div>
    </div>
  );
}

/* ── Single risk card ── */
function RiskCard({
  classification,
  index,
}: {
  classification: RiskClassification;
  index: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const s = riskStyles[classification.level];
  const showCount = 3;
  const hasMore = classification.useCases.length > showCount;
  const visibleCases = expanded
    ? classification.useCases
    : classification.useCases.slice(0, showCount);

  return (
    <div
      className={cn(
        "group relative rounded-xl border p-5 transition-all duration-300 animate-card-in",
        s.border,
        s.bg,
        s.hoverBorder,
        "hover:shadow-md"
      )}
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Top indicator bar */}
      <div
        className={cn(
          "absolute top-0 left-4 right-4 h-0.5 rounded-b-full opacity-60 group-hover:opacity-100 transition-opacity",
          s.indicator
        )}
      />

      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            s.badgeBg,
            s.iconColor
          )}
        >
          {riskIcons[classification.level]}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm font-bold text-foreground leading-tight">
            {classification.title}
          </h3>
          {/* Policy treatment badge */}
          <div
            className={cn(
              "mt-1.5 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
              s.border,
              s.badgeBg,
              s.badgeText
            )}
          >
            {policyIcons[classification.level]}
            {classification.policyTreatment}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm leading-relaxed text-muted-foreground mb-4">
        {classification.description}
      </p>

      {/* Use cases */}
      <div className="space-y-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
          Sample Use Cases
        </p>
        <div className="flex flex-wrap gap-1.5">
          {visibleCases.map((uc) => (
            <span
              key={uc.label}
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                "bg-background/60 text-foreground/80 border-border/60",
                "hover:bg-background hover:border-border"
              )}
            >
              {uc.label}
            </span>
          ))}
        </div>
        {hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className={cn(
              "mt-2 inline-flex items-center gap-1 text-xs font-medium transition-colors",
              s.badgeText,
              "hover:underline"
            )}
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                +{classification.useCases.length - showCount} more{" "}
                <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Governance footer strip ── */
function GovernanceFooter() {
  const actions: { level: RiskLevel; label: string; action: string }[] = [
    { level: "minimal", label: "Minimal", action: "Standard IT controls" },
    { level: "limited", label: "Limited", action: "Transparency & disclosure" },
    { level: "high", label: "High", action: "PIA + Human oversight + Audit" },
    { level: "unacceptable", label: "Unacceptable", action: "Prohibited — Do not deploy" },
  ];

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5">
      <h3 className="font-display text-sm font-bold text-foreground mb-4 flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        Required Governance Actions by Risk Level
      </h3>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map((a) => {
          const s = riskStyles[a.level];
          return (
            <div
              key={a.level}
              className={cn(
                "rounded-lg border p-3 text-center transition-colors",
                s.border,
                s.bg
              )}
            >
              <div
                className={cn(
                  "text-[11px] font-bold uppercase tracking-wider mb-1",
                  s.badgeText
                )}
              >
                {a.label}
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {a.action}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Stakeholder tab content ── */
function StakeholderTab({ group }: { group: StakeholderGroup }) {
  return (
    <div>
      <RiskSpectrum />
      <div className="grid gap-4 sm:grid-cols-2">
        {group.classifications.map((c, i) => (
          <RiskCard key={c.level} classification={c} index={i} />
        ))}
      </div>
      <GovernanceFooter />
    </div>
  );
}

/* ── Main exported section ── */
export default function RiskClassificationSection() {
  return (
    <div className="mb-14">
      {/* Hero header */}
      <div className="mb-8 text-center animate-card-in">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
          <Shield className="h-3.5 w-3.5" />
          Risk-Based Framework
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-3">
          AI Risk Classification & Sample Use Cases
        </h2>
        <p className="max-w-2xl mx-auto text-sm leading-relaxed text-muted-foreground">
          The level of risk an AI system poses depends on its <strong className="text-foreground">purpose</strong>,{" "}
          <strong className="text-foreground">context of use</strong>, and{" "}
          <strong className="text-foreground">impact on people</strong>. Select a stakeholder group
          below to see how AI tools are classified and what governance measures apply.
        </p>
      </div>

      {/* Tabbed interface */}
      <Tabs defaultValue="learners" className="animate-card-in" style={{ animationDelay: "100ms" }}>
        <div className="flex justify-center mb-6">
          <TabsList className="h-auto gap-1 bg-muted/60 p-1 rounded-xl">
            {stakeholderData.map((g) => (
              <TabsTrigger
                key={g.id}
                value={g.id}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                {stakeholderIcons[g.icon]}
                <span className="hidden sm:inline">{g.label}</span>
                <span className="sm:hidden">{g.label.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {stakeholderData.map((g) => (
          <TabsContent key={g.id} value={g.id}>
            <StakeholderTab group={g} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
