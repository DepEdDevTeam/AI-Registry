import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, UserCog } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PartnerFlowStepper from "@/components/partner/PartnerFlowStepper";
import { useState } from "react";
import { getDraft, setDraft, clearDraft } from "@/lib/partnerOnboardingDraft";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const DEFAULT_THEME = { primary: "#3B82F6", secondary: "#1E40AF", accent: "#60A5FA" };

const PartnerAccountSetupPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const draft = getDraft();
  const [form, setForm] = useState({
    orgName: draft.orgName ?? "",
    email: draft.accountEmail ?? draft.contactEmail ?? "",
    contactPerson: draft.contactPerson ?? "",
    contactPosition: draft.contactPosition ?? "",
    contactNumber: draft.contactNumber ?? "",
    password: "",
    password2: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);

  const update = (k: keyof typeof form, v: string) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (v.trim()) {
      setMissingFields((current) => current.filter((field) => field !== k));
    }
  };

  const handleContinue = async () => {
    const missing = (["orgName", "email", "password", "password2"] as const).filter(
      (field) => !form[field].trim(),
    );

    if (missing.length > 0) {
      setMissingFields([...missing]);
      toast({ title: "Missing required fields", variant: "destructive" });
      return;
    }
    setMissingFields([]);
    if (form.password.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (form.password !== form.password2) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // Sign up (or sign in if account already exists)
      const redirectUrl = `${window.location.origin}/partner/provider-profile`;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: { display_name: form.contactPerson || form.orgName },
        },
      });

      let userId = signUpData?.user?.id;
      if (signUpError) {
        // Maybe account exists already — try sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (signInError) {
          throw signUpError;
        }
        userId = signInData.user?.id;
      }

      // Wait briefly for session
      const { data: sessionData } = await supabase.auth.getSession();
      userId = userId ?? sessionData.session?.user?.id;
      if (!userId) {
        throw new Error("Could not establish a session. Please try signing in.");
      }

      // Insert partner row (pending)
      const slug = (form.orgName || "partner")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "partner";
      const uniqueKey = `${slug}-${userId.slice(0, 8)}`;
      const insertRow = {
        name: form.orgName,
        email: form.email,
        description: draft.description ?? "",
        background: draft.background ?? "",
        status: "pending",
        logo_svg: "",
        theme_config: DEFAULT_THEME,
        proposed_by: userId,
        owner_email: form.email,
        contact_email: draft.contactEmail ?? form.email,
        contact_person: form.contactPerson ?? "",
        contact_position: form.contactPosition ?? "",
        contact_number: form.contactNumber ?? "",
        key: uniqueKey,
        tools: "",
        tool_count: 0,
      };
      const { data: inserted, error: insertError } = await supabase
        .from("partners")
        .insert(insertRow)
        .select()
        .single();
      if (insertError) throw insertError;

      await logAudit("create", "partner", inserted.id, null, inserted);

      // Assign 'partner' role (no-op if user already has a role)
      const { error: roleError } = await supabase.rpc("assign_partner_role", { _user_id: userId });
      if (!roleError) {
        await logAudit("assign_role", "user_role", userId, null, { role: "partner" });
      }

      // Auto-link this user to any partners rows pre-assigned via owner_email
      await supabase.rpc("link_partner_by_email", { _user_id: userId, _email: form.email });

      setDraft({
        accountEmail: form.email,
        contactPerson: form.contactPerson,
        contactPosition: form.contactPosition,
        contactNumber: form.contactNumber,
        proposedPartnerId: inserted.id as string,
      });

      toast({ title: "Submitted for DepEd review", description: "You can customize your logo & theme while waiting for approval." });
      // Clear after a tick so any consumers can still read it during navigation
      setTimeout(() => clearDraft(), 500);
      navigate("/partner/provider-profile");
    } catch (e: any) {
      toast({ title: "Could not create account", description: e?.message ?? "Unknown error", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        <PartnerFlowStepper currentStep="account" />

        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
          <CardHeader>
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <UserCog className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-2xl md:text-3xl">Partner Account Setup</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Create the partner workspace profile that will later be used to
                  manage AI tool submissions.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="acc-org" className={cn(missingFields.includes("orgName") && "text-destructive")}>
                  Organization name *
                </Label>
                <Input
                  id="acc-org"
                  value={form.orgName}
                  onChange={(e) => update("orgName", e.target.value)}
                  placeholder="Organization legal name"
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
                <Label htmlFor="acc-email" className={cn(missingFields.includes("email") && "text-destructive")}>
                  Official email address *
                </Label>
                <Input
                  id="acc-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="partner@organization.org"
                  aria-invalid={missingFields.includes("email")}
                  className={cn(
                    missingFields.includes("email") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {missingFields.includes("email") && (
                  <p className="text-sm text-destructive">Official email address is required.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-contact">Primary contact name</Label>
                <Input id="acc-contact" value={form.contactPerson} onChange={(e) => update("contactPerson", e.target.value)} placeholder="Full name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-position">Contact position</Label>
                <Input id="acc-position" value={form.contactPosition} onChange={(e) => update("contactPosition", e.target.value)} placeholder="e.g. Director" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="acc-number">Contact number</Label>
                <Input id="acc-number" type="tel" value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} placeholder="+63 ..." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-pass" className={cn(missingFields.includes("password") && "text-destructive")}>
                  Password *
                </Label>
                <Input
                  id="acc-pass"
                  type="password"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  placeholder="At least 6 characters"
                  aria-invalid={missingFields.includes("password")}
                  className={cn(
                    missingFields.includes("password") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {missingFields.includes("password") && (
                  <p className="text-sm text-destructive">Password is required.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="acc-pass2" className={cn(missingFields.includes("password2") && "text-destructive")}>
                  Confirm password *
                </Label>
                <Input
                  id="acc-pass2"
                  type="password"
                  value={form.password2}
                  onChange={(e) => update("password2", e.target.value)}
                  placeholder="Re-enter password"
                  aria-invalid={missingFields.includes("password2")}
                  className={cn(
                    missingFields.includes("password2") &&
                      "border-destructive focus-visible:ring-destructive",
                  )}
                />
                {missingFields.includes("password2") && (
                  <p className="text-sm text-destructive">Please confirm your password.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-background/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Account creation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Submitting will create your partner account and a pending provider profile for DepEd review.
            </p>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <Button asChild variant="outline" className="border-border/40 bg-background/40 backdrop-blur-md" disabled={submitting}>
            <Link to="/partner/initiation">
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to partner initiation
            </Link>
          </Button>
          <Button onClick={handleContinue} disabled={submitting}>
            {submitting ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
            Continue to provider profile
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PartnerAccountSetupPage;
