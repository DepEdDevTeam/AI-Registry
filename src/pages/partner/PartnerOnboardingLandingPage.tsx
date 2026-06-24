import { Link } from "react-router-dom";
import {
  Building2,
  FileText,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PartnerFlowStepper from "@/components/partner/PartnerFlowStepper";

const checklist: string[] = [
  "Partner or organization name",
  "Organization background or concept note",
  "Primary contact person and email address",
  "Provider description for the public directory",
  "Brand identity (logo and colors)",
];

const features: { icon: typeof Building2; title: string; description: string }[] = [
  {
    icon: Building2,
    title: "Partner profile",
    description:
      "Provide organization background, contact details, and onboarding information.",
  },
  {
    icon: FileText,
    title: "Provider profile and AI tools",
    description:
      "Set up your provider profile, then add AI tools from your provider page. Provider profile and tools will be reviewed separately by DepEd.",
  },
  {
    icon: ShieldCheck,
    title: "DepEd review",
    description:
      "Submitted provider profiles and AI tools proceed through human-in-the-loop governance review before approval.",
  },
];

const PartnerOnboardingLandingPage = () => {
  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
        <PartnerFlowStepper currentStep="onboarding" />
        {/* Badge row */}
        <div className="flex flex-wrap items-center gap-2 mb-8">
          <Badge variant="secondary" className="bg-card/40 backdrop-blur-md border border-border/40">
            <Sparkles className="mr-1 h-3.5 w-3.5" />
            DepEd AI Registry
          </Badge>
          <Badge variant="outline" className="border-border/40 bg-background/40 backdrop-blur-md">
            Partner Onboarding
          </Badge>
        </div>

        {/* Hero + side cards grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Hero card */}
          <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
            <CardHeader className="space-y-4">
              <CardTitle className="text-3xl md:text-4xl font-bold tracking-tight">
                Exclusive Partner Onboarding
              </CardTitle>
              <p className="text-muted-foreground leading-relaxed">
                Register as a partner organization and prepare AI tool submissions for governance
                review, documentation, and DepEd approval.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Separator className="bg-border/60" />
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/partner/initiation">
                    Start partner initiation
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-border/40 bg-background/40 backdrop-blur-md">
                  <Link to="/">Back to AI Registry</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Right column */}
          <div className="space-y-6">
            <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ClipboardCheck className="h-5 w-5" />
                  </span>
                  What partners will prepare
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {checklist.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-background/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  Governance reminder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  AI tools submitted through this onboarding flow should be reviewed by DepEd before
                  publication or approval. Do not submit real learner or student personal data
                  through this page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card
              key={title}
              className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl"
            >
              <CardHeader>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <CardTitle className="mt-3 text-lg">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PartnerOnboardingLandingPage;
