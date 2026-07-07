import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import depedLogo from "@/assets/deped-logo.png";

const rules = [
  { id: "len", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "case", label: "Mix of upper & lowercase letters", test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: "num", label: "Contains a number", test: (p: string) => /\d/.test(p) },
];

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [linkChecked, setLinkChecked] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    const activateForm = () => {
      if (!mounted) return;
      setReady(true);
      setLinkError(null);
      setLinkChecked(true);
    };

    const finishWithError = (message: string) => {
      if (!mounted) return;
      setReady(false);
      setLinkError(message);
      setLinkChecked(true);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) activateForm();
    });

    const initializeRecoverySession = async () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const queryParams = new URLSearchParams(window.location.search);
      const urlError = hashParams.get("error_description") || queryParams.get("error_description");

      if (urlError) {
        toast({ title: "Reset link problem", description: urlError, variant: "destructive" });
        finishWithError(urlError);
        return;
      }

      const clearSensitiveUrl = () => window.history.replaceState({}, document.title, window.location.pathname);

      const code = queryParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          toast({ title: "Reset link expired", description: error.message, variant: "destructive" });
          finishWithError(error.message);
        } else {
          clearSensitiveUrl();
          activateForm();
        }
        return;
      }

      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          toast({ title: "Reset link expired", description: error.message, variant: "destructive" });
          finishWithError(error.message);
        } else {
          clearSensitiveUrl();
          activateForm();
        }
        return;
      }

      const tokenHash = queryParams.get("token_hash") || hashParams.get("token_hash");
      if (tokenHash && (queryParams.get("type") === "recovery" || hashParams.get("type") === "recovery")) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });
        if (error) {
          toast({ title: "Reset link expired", description: error.message, variant: "destructive" });
          finishWithError(error.message);
        } else {
          clearSensitiveUrl();
          activateForm();
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) activateForm();
      else finishWithError("Open the latest password reset link from your email before updating your password.");
    };

    initializeRecoverySession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const checks = useMemo(() => rules.map((r) => ({ ...r, ok: r.test(password) })), [password]);
  const strength = checks.filter((c) => c.ok).length;
  const strengthLabel = ["Too weak", "Weak", "Good", "Strong"][strength];
  const strengthColor = ["bg-destructive", "bg-risk-high", "bg-risk-limited", "bg-risk-minimal"][strength];
  const allValid = strength === rules.length && password === confirm && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allValid) {
      toast({
        title: "Please complete all requirements",
        description:
          password !== confirm ? "Passwords do not match." : "Your password doesn't meet the requirements yet.",
        variant: "destructive",
      });
      return;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setReady(false);
      setLinkError("Open the latest password reset link from your email before updating your password.");
      toast({
        title: "Reset link not active",
        description: "Please open the latest reset email link, then try again.",
        variant: "destructive",
      });
      return;
    }
    setReady(true);
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      toast({ title: "Could not update password", description: error.message, variant: "destructive" });
      return;
    }
    setDone(true);
    setTimeout(async () => {
      await supabase.auth.signOut();
      navigate("/auth");
    }, 2200);
  };

  return (
    <div className="relative min-h-[85vh] overflow-hidden">
      {/* Ambient brand background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute top-40 -right-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <div className="container mx-auto flex min-h-[85vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Brand header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-card/40 backdrop-blur-xl shadow-sm">
              <img src={depedLogo} alt="DepEd" className="h-10 w-10 object-contain" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">DepEd AI Registry</p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card/40 p-8 shadow-xl backdrop-blur-xl">
            {done ? (
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-risk-minimal/15">
                  <CheckCircle2 className="h-8 w-8 text-risk-minimal" />
                </div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Password updated</h1>
                <p className="mt-2 text-sm text-muted-foreground">Redirecting you to sign in with your new password…</p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight text-foreground">Set a new password</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ready
                        ? "Choose a strong password you haven't used before."
                        : linkError
                          ? linkError
                          : linkChecked
                            ? "Open the latest password reset link from your email to update your password."
                            : "Validating your secure reset link…"}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground/80">
                      New password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={show ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="password"
                        required
                        disabled={loading}
                        className="pr-10 bg-background/60"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        tabIndex={-1}
                        aria-label={show ? "Hide password" : "Show password"}
                      >
                        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {password.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex h-1.5 flex-1 gap-1">
                            {[0, 1, 2].map((i) => (
                              <div
                                key={i}
                                className={`h-full flex-1 rounded-full transition-colors ${
                                  i < strength ? strengthColor : "bg-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-muted-foreground w-14 text-right">
                            {strengthLabel}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm" className="text-foreground/80">
                      Confirm password
                    </Label>
                    <Input
                      id="confirm"
                      type={show ? "text" : "password"}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="confirm password"
                      required
                      disabled={loading}
                      className="bg-background/60"
                    />
                    {confirm.length > 0 && password !== confirm && (
                      <p className="text-xs text-destructive">Passwords do not match.</p>
                    )}
                  </div>

                  <ul className="space-y-1.5 rounded-lg border border-border/60 bg-background/40 p-3">
                    {checks.map((c) => (
                      <li
                        key={c.id}
                        className={`flex items-center gap-2 text-xs transition-colors ${
                          c.ok ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        <CheckCircle2
                          className={`h-3.5 w-3.5 shrink-0 ${c.ok ? "text-risk-minimal" : "text-muted-foreground/40"}`}
                        />
                        {c.label}
                      </li>
                    ))}
                  </ul>

                  <Button type="submit" className="w-full" disabled={loading || !allValid}>
                    {loading ? "Updating…" : "Update password"}
                  </Button>

                  <div className="flex items-center justify-center gap-1.5 pt-1 text-xs text-muted-foreground">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Secured by the DepEd AI Registry
                  </div>
                </form>
              </>
            )}
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Having trouble?{" "}
            <button onClick={() => navigate("/auth")} className="font-medium text-primary hover:underline">
              Back to sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
