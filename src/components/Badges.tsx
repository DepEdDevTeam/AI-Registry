import type { AITool } from "@/data/aiRegistry";

export function RiskBadge({ level }: { level: AITool["riskLevel"] }) {
  const styles: Record<string, string> = {
    unacceptable: "bg-risk-unacceptable/10 text-risk-unacceptable border-risk-unacceptable/20",
    high: "bg-risk-high/10 text-risk-high border-risk-high/20",
    limited: "bg-risk-limited/10 text-risk-limited border-risk-limited/20",
    minimal: "bg-risk-minimal/10 text-risk-minimal border-risk-minimal/20",
  };

  const labels: Record<string, string> = {
    unacceptable: "Unacceptable",
    high: "High Risk",
    limited: "Limited Risk",
    minimal: "Minimal Risk",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[level]}`}>
      {labels[level]}
    </span>
  );
}

export function StatusBadge({ status }: { status: AITool["status"] }) {
  const styles: Record<string, string> = {
    Pilot: "bg-status-pilot/10 text-status-pilot border-status-pilot/20",
    Active: "bg-status-active/10 text-status-active border-status-active/20",
    Retired: "bg-status-retired/10 text-status-retired border-status-retired/20",
  };

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}
