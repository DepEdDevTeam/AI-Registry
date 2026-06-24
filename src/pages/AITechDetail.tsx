import { useParams, Link } from "react-router-dom";
import { getToolById } from "@/data/aiRegistry";
import { RiskBadge, StatusBadge } from "@/components/Badges";
import { ArrowLeft, Calendar, User, Shield, Eye, FileCheck, AlertTriangle } from "lucide-react";

const AITechDetail = () => {
  const { id } = useParams<{ id: string }>();
  const tool = getToolById(id || "");

  if (!tool) {
    return (
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground">AI Tool Not Found</h1>
        <p className="mt-2 text-muted-foreground">The requested AI tool was not found in the registry.</p>
        <Link to="/ai-technology" className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to catalogue
        </Link>
      </section>
    );
  }

  return (
    <section className="container mx-auto max-w-4xl px-4 py-12">
      <Link to="/ai-technology" className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to catalogue
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-bold text-foreground">{tool.name}</h1>
          <RiskBadge level={tool.riskLevel} />
          <StatusBadge status={tool.status} />
        </div>
        <p className="mt-1 text-muted-foreground">{tool.provider}</p>
        <p className="mt-4 text-foreground leading-relaxed">{tool.description}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Risk & Safeguards */}
        <InfoPanel icon={<AlertTriangle className="h-5 w-5 text-risk-high" />} title="Risk Classification">
          <p className="text-sm text-foreground font-medium">{tool.riskClassification}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {tool.riskLevel === "high" && "This tool is considered High Risk in basic education because it involves content generation, interaction with minors, and potential privacy implications. It requires strict safeguards including human oversight, PIA, and appeal mechanisms."}
            {tool.riskLevel === "limited" && "This tool is considered Limited Risk — it interacts with users but does not make high-impact decisions. It requires transparency and safeguards against misuse."}
            {tool.riskLevel === "minimal" && "This tool is considered Minimal Risk — it performs routine tasks with little or no impact on rights or safety."}
            {tool.riskLevel === "unacceptable" && "This tool is classified as Unacceptable Risk and is not allowed in basic education."}
          </p>
        </InfoPanel>

        {/* Intended Use */}
        <InfoPanel icon={<Eye className="h-5 w-5 text-primary" />} title="Intended Use">
          <p className="text-sm text-foreground leading-relaxed">{tool.intendedUse}</p>
        </InfoPanel>

        {/* PIA & Compliance */}
        <InfoPanel icon={<FileCheck className="h-5 w-5 text-status-active" />} title="Privacy & Compliance">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Privacy Impact Assessment</p>
              <p className="mt-1 text-sm text-foreground font-medium">{tool.piaStatus}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conformity / Compliance Assessment</p>
              <p className="mt-1 text-sm text-foreground">{tool.complianceAssessment}</p>
            </div>
          </div>
        </InfoPanel>

        {/* Governance & Oversight */}
        <InfoPanel icon={<Shield className="h-5 w-5 text-primary" />} title="Governance & Oversight">
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Responsible Officer</p>
              <p className="mt-1 text-sm text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" /> {tool.responsibleOfficer}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Oversight & Human-in-the-Loop Mechanism</p>
              <p className="mt-1 text-sm text-foreground leading-relaxed">{tool.oversightMechanism}</p>
            </div>
          </div>
        </InfoPanel>
      </div>

      {/* Date */}
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span>Date of Entry / Update: {tool.dateOfEntry}</span>
      </div>
    </section>
  );
};

function InfoPanel({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h3 className="font-display text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default AITechDetail;
