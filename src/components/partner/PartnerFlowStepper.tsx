import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PartnerFlowStep =
  | "onboarding"
  | "initiation"
  | "account"
  | "profile"
  | "review";

interface PartnerFlowStepperProps {
  currentStep: PartnerFlowStep;
}

const STEPS: { key: PartnerFlowStep; label: string }[] = [
  { key: "onboarding", label: "Onboarding" },
  { key: "initiation", label: "Initiation" },
  { key: "account", label: "Account Setup" },
  { key: "profile", label: "Provider Profile" },
  { key: "review", label: "DepEd Review" },
];

const PartnerFlowStepper = ({ currentStep }: PartnerFlowStepperProps) => {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="bg-card/40 backdrop-blur-md border border-border/40 rounded-xl shadow-xl p-4 mb-8">
      <ol className="flex items-center justify-between gap-2 overflow-x-auto">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          return (
            <li key={step.key} className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={cn(
                    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors",
                    isCompleted && "bg-primary text-primary-foreground border-primary",
                    isCurrent &&
                      "bg-primary/20 text-primary border-primary",
                    !isCompleted &&
                      !isCurrent &&
                      "bg-muted text-muted-foreground border-border/40",
                  )}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  {isCompleted ? <Check className="h-4 w-4" /> : idx + 1}
                </span>
                <span
                  className={cn(
                    "text-xs sm:text-sm truncate",
                    isCurrent
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                    !isCurrent && "hidden sm:inline",
                  )}
                >
                  {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <span
                  className={cn(
                    "h-px flex-1 min-w-[12px]",
                    idx < currentIndex ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};

export default PartnerFlowStepper;
