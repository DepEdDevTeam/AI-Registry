import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import PartnerFlowStepper from "@/components/partner/PartnerFlowStepper";
import { getDraft, setDraft } from "@/lib/partnerOnboardingDraft";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PartnerInitiationPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const initial = getDraft();
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const [form, setForm] = useState({
    orgName: initial.orgName ?? "",
    description: initial.description ?? "", // Text Concept Note
    background: initial.background ?? "",
    contactPerson: initial.contactPerson ?? "",
    contactPosition: initial.contactPosition ?? "",
    contactNumber: initial.contactNumber ?? "",
    contactEmail: initial.contactEmail ?? "",
  });

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (v.trim()) {
      setMissingFields((current) => current.filter((field) => field !== k));
    }
  };

  const handleContinue = () => {
    const missing = (["orgName", "description", "contactEmail"] as const).filter(
      (field) => !form[field].trim(),
    );

    if (missing.length > 0) {
      setMissingFields([...missing]);
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    setMissingFields([]);
    setDraft({ ...form });
    navigate("/partner/account-setup");
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        <PartnerFlowStepper currentStep="initiation" />

        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl md:text-3xl">Partner Initiation</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Introduce your organization and the educational concept you wish to propose to DepEd.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="org-name" className={cn(missingFields.includes("orgName") && "text-destructive")}>
                  Organization Name *
                </Label>
                <Input
                  id="org-name"
                  value={form.orgName}
                  onChange={(e) => update("orgName", e.target.value)}
                  placeholder="Enter Company / Organization Name"
                  aria-invalid={missingFields.includes("orgName")}
                  className={cn(
                    missingFields.includes("orgName") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {missingFields.includes("orgName") && (
                  <p className="text-sm text-destructive">Organization name is required.</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="org-desc" className={cn(missingFields.includes("description") && "text-destructive")}>
                  Concept Note / Organization Vision *
                </Label>
                <Textarea
                  id="org-desc"
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="Provide Organization briefer...."
                  rows={4}
                  aria-invalid={missingFields.includes("description")}
                  className={cn(
                    missingFields.includes("description") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {missingFields.includes("description") && (
                  <p className="text-sm text-destructive">Concept note or organization vision is required.</p>
                )}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="org-bg">Background & History</Label>
                <Textarea
                  id="org-bg"
                  value={form.background}
                  onChange={(e) => update("background", e.target.value)}
                  placeholder="Brief history of your organization..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-person">Primary Contact Person</Label>
                <Input
                  id="contact-person"
                  value={form.contactPerson}
                  onChange={(e) => update("contactPerson", e.target.value)}
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-pos">Position</Label>
                <Input
                  id="contact-pos"
                  value={form.contactPosition}
                  onChange={(e) => update("contactPosition", e.target.value)}
                  placeholder="Position / Designation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email" className={cn(missingFields.includes("contactEmail") && "text-destructive")}>
                  Contact Email *
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => update("contactEmail", e.target.value)}
                  placeholder="Email Address"
                  aria-invalid={missingFields.includes("contactEmail")}
                  className={cn(
                    missingFields.includes("contactEmail") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {missingFields.includes("contactEmail") && (
                  <p className="text-sm text-destructive">Contact email is required.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-num">Contact Number</Label>
                <Input
                  id="contact-num"
                  type="tel"
                  value={form.contactNumber}
                  onChange={(e) => update("contactNumber", e.target.value)}
                  placeholder="Enter Phone Number"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="border-border/40 bg-background/40 backdrop-blur-md">
            <Link to="/partner/onboarding">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button onClick={handleContinue}>
            Continue to Account Setup
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartnerInitiationPage;
