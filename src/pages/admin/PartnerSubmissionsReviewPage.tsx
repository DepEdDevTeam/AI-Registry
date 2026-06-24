// TODO: protect this route for super_admin and admin using has_role().
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

const PartnerSubmissionsReviewPage = () => {
  return (
    <div className="min-h-screen bg-background bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:py-16">
        <Card className="bg-card/40 backdrop-blur-md border-border/40 shadow-xl rounded-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="h-5 w-5" />
              </span>
              Partner Submissions Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Admin review interface will be implemented in a later phase.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PartnerSubmissionsReviewPage;
