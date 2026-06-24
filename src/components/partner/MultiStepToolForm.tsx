import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, ArrowRight, Check, Loader2, Upload, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateToolLogoSvg } from "@/lib/toolLogo";

const STEPS = [
  { key: 1, label: "Basic Information" },
  { key: 2, label: "Users & Use Case" },
  { key: 3, label: "Requirements" },
  { key: 4, label: "Review" },
];

interface ToolDraft {
  toolName: string;
  toolDescription: string;
  toolObjective: string;
  intendedUse: string;
  targetUsers: string;
  estimatedUsers: string;
  useCase: string;
  privacyNotes: string;
  governanceNotes: string;
  budget: string;
  techRequirements: string;
  trainingRequired: string;
}

const initialDraft: ToolDraft = {
  toolName: "",
  toolDescription: "",
  toolObjective: "",
  intendedUse: "",
  targetUsers: "",
  estimatedUsers: "",
  useCase: "",
  privacyNotes: "",
  governanceNotes: "",
  budget: "",
  techRequirements: "",
  trainingRequired: "needed",
};

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

const DEFAULT_THEME: ThemeConfig = { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" };

interface MultiStepToolFormProps {
  /** partners.id */
  proposalId: string;
  /** kept for backward compat; always treated as "partner" now */
  parentType?: "proposal" | "partner";
  /** Partner theme used to auto-generate a logo when none is uploaded */
  partnerTheme?: ThemeConfig;
  onSuccess: () => void;
}

const MultiStepToolForm = ({ proposalId, partnerTheme, onSuccess }: MultiStepToolFormProps) => {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<ToolDraft>(initialDraft);
  const [toolLogoSvg, setToolLogoSvg] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const theme = partnerTheme ?? DEFAULT_THEME;

  const update = <K extends keyof ToolDraft>(key: K, value: ToolDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (ev) => setToolLogoSvg(ev.target?.result as string);
      reader.readAsText(file);
      return;
    }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        setToolLogoSvg(
          `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><clipPath id="clip"><rect width="64" height="64" rx="12"/></clipPath></defs><image href="${dataUrl}" width="64" height="64" clip-path="url(#clip)" preserveAspectRatio="xMidYMid slice"/></svg>`,
        );
      };
      reader.readAsDataURL(file);
      return;
    }
    toast({ title: "Unsupported file type", description: "Please upload an SVG or image.", variant: "destructive" });
  };

  const previewLogo = toolLogoSvg || generateToolLogoSvg(draft.toolName || "AI", theme);

  const handleSubmit = async () => {
    if (!draft.toolName.trim()) {
      toast({ title: "Error", description: "Tool name is required.", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    const finalLogo = toolLogoSvg || generateToolLogoSvg(draft.toolName, theme);

    const { error } = await supabase.from("partner_tool_details").insert({
      tool_name: draft.toolName,
      description: draft.toolDescription,
      tool_objective: draft.toolObjective,
      intended_use: draft.intendedUse,
      target_users: draft.targetUsers,
      estimated_users: draft.estimatedUsers,
      use_case: draft.useCase,
      privacy_impact_assessment: draft.privacyNotes,
      oversight_mechanism: draft.governanceNotes,
      budget: draft.budget,
      tech_requirements: draft.techRequirements,
      training_required: draft.trainingRequired,
      tool_logo_svg: finalLogo,
      partner_id: proposalId,
      risk_classification: "Minimal",
      risk_approved: false,
    });

    if (error) {
      toast({ title: "Failed to submit tool", description: error.message, variant: "destructive" });
      setSubmitting(false);
    } else {
      toast({ title: "Tool Submitted!", description: "Your AI tool has been registered and is pending governance review." });
      setSubmitting(false);
      onSuccess();
    }
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <ol className="flex items-center justify-between gap-2">
        {STEPS.map((s, idx) => {
          const isCompleted = s.key < step;
          const isCurrent = s.key === step;
          return (
            <li key={s.key} className="flex items-center gap-2 flex-1 min-w-0">
              <span
                className={cn(
                  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                  isCompleted && "bg-primary text-primary-foreground border-primary",
                  isCurrent && "bg-primary/20 text-primary border-primary",
                  !isCompleted && !isCurrent && "bg-muted text-muted-foreground border-border/40",
                )}
              >
                {isCompleted ? <Check className="h-3.5 w-3.5" /> : s.key}
              </span>
              <span
                className={cn(
                  "text-xs truncate",
                  isCurrent ? "text-foreground font-medium" : "text-muted-foreground",
                  !isCurrent && "hidden md:inline",
                )}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px flex-1 min-w-[8px]",
                    s.key < step ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="rounded-lg border border-border/40 bg-background/40 backdrop-blur-md p-5 shadow-sm">
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-name">Tool name</Label>
              <Input
                id="t-name"
                value={draft.toolName}
                onChange={(e) => update("toolName", e.target.value)}
                placeholder="e.g. Project PAARAL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-desc">Concept Note / Brief Description</Label>
              <Textarea
                id="t-desc"
                value={draft.toolDescription}
                onChange={(e) => update("toolDescription", e.target.value)}
                placeholder="Describe the AI tool and its core functionalities in text..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-obj">Tool objective</Label>
              <Textarea
                id="t-obj"
                value={draft.toolObjective}
                onChange={(e) => update("toolObjective", e.target.value)}
                placeholder="What educational outcome does it support?"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tool logo</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="h-8"
                  >
                    <Upload className="mr-1 h-3.5 w-3.5" />
                    Upload
                  </Button>
                  {toolLogoSvg && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setToolLogoSvg("")}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.svg"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/40 p-3">
                <div
                  className="h-14 w-14 shrink-0 overflow-hidden rounded-lg ring-1 ring-border/40"
                  dangerouslySetInnerHTML={{ __html: previewLogo }}
                />
                <p className="text-xs text-muted-foreground">
                  {toolLogoSvg ? (
                    "Custom logo uploaded."
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" />
                      No logo uploaded — a themed vector logo will be generated automatically.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-intended">Intended use</Label>
              <Textarea
                id="t-intended"
                value={draft.intendedUse}
                onChange={(e) => update("intendedUse", e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-target">Target users</Label>
                <Input
                  id="t-target"
                  value={draft.targetUsers}
                  onChange={(e) => update("targetUsers", e.target.value)}
                  placeholder="e.g. Teachers, school heads"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-est">Estimated number of users (optional)</Label>
                <Input
                  id="t-est"
                  value={draft.estimatedUsers}
                  onChange={(e) => update("estimatedUsers", e.target.value)}
                  placeholder="e.g. 5,000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-uc">Specific Use Case Context</Label>
              <Textarea
                id="t-uc"
                value={draft.useCase}
                onChange={(e) => update("useCase", e.target.value)}
                placeholder="Describe how it will be used specifically within DepEd."
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="t-priv">Privacy and compliance notes</Label>
              <Textarea
                id="t-priv"
                value={draft.privacyNotes}
                onChange={(e) => update("privacyNotes", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-gov">Governance & Human-in-the-loop notes</Label>
              <Textarea
                id="t-gov"
                value={draft.governanceNotes}
                onChange={(e) => update("governanceNotes", e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="t-budget">Budget requirements</Label>
                <Input
                  id="t-budget"
                  value={draft.budget}
                  onChange={(e) => update("budget", e.target.value)}
                  placeholder="e.g. PHP 1,000,000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="t-tech">Technology / system requirements</Label>
                <Input
                  id="t-tech"
                  value={draft.techRequirements}
                  onChange={(e) => update("techRequirements", e.target.value)}
                  placeholder="e.g. Cloud hosting, internet access"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Training requirements</Label>
              <RadioGroup
                value={draft.trainingRequired}
                onValueChange={(v) => update("trainingRequired", v)}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="needed" id="tr-needed" />
                  <Label htmlFor="tr-needed" className="font-normal">
                    Training is needed for deployment
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="none" id="tr-none" />
                  <Label htmlFor="tr-none" className="font-normal">
                    No specialized training required
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review the AI tool details before submission.
            </p>
            <dl className="grid gap-3 text-sm md:grid-cols-2">
              {[
                ["Tool name", draft.toolName],
                ["Concept Note", draft.toolDescription],
                ["Objective", draft.toolObjective],
                ["Intended use", draft.intendedUse],
                ["Target users", draft.targetUsers],
                ["Estimated users", draft.estimatedUsers],
                ["Use case", draft.useCase],
                ["Privacy notes", draft.privacyNotes],
                ["Governance notes", draft.governanceNotes],
                ["Budget", draft.budget],
                ["Tech requirements", draft.techRequirements],
                [
                  "Training",
                  draft.trainingRequired === "needed"
                    ? "Training requirements are needed"
                    : "No training requirements are necessary",
                ],
              ].map(([label, value]) => (
                <div key={label} className="rounded-md border border-border/40 bg-card/40 backdrop-blur-md p-3">
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">{label}</dt>
                  <dd className="mt-1 text-foreground/90 break-words line-clamp-3">
                    {value || <span className="text-muted-foreground italic">Not provided</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          className="border-border/40 bg-background/40 backdrop-blur-md"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || submitting}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {step < STEPS.length ? (
            <Button type="button" onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}>
              Next
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit for DepEd review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MultiStepToolForm;