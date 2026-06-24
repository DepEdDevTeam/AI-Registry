import { Link } from "react-router-dom";
import { ArrowRight, ClipboardList, RefreshCw, ShieldCheck } from "lucide-react";

const About = () => {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-12 animate-page-in">
      <h1 className="font-display text-3xl font-bold text-foreground animate-card-in">About the DepEd AI Registry</h1>
      <p className="mt-4 text-muted-foreground leading-relaxed">
        The Department of Education maintains the AI Registry as a centralized, transparent record of all artificial intelligence technologies used across DepEd offices, schools, and programs. This initiative reflects DepEd's commitment to responsible innovation — harnessing the potential of AI to improve education while safeguarding the rights, privacy, and well-being of Filipino learners and educators.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <div className="animate-card-in" style={{ animationDelay: "80ms" }}><AboutCard
          icon={<ClipboardList className="h-6 w-6" />}
          title="Transparency"
          description="By cataloguing every AI tool — including its purpose, risk level, and compliance status — DepEd ensures that stakeholders can see how AI is used in education."
        /></div>
        <div className="animate-card-in" style={{ animationDelay: "160ms" }}><AboutCard
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Safeguards"
          description="Each registered AI tool undergoes risk classification, privacy impact assessment, and compliance evaluation to protect learners and educators."
        /></div>
        <div className="animate-card-in" style={{ animationDelay: "240ms" }}><AboutCard
          icon={<RefreshCw className="h-6 w-6" />}
          title="Continuously Updated"
          description="The registry is a living document. As AI tools are adopted, modified, or retired, the registry is updated to reflect their current status and assessment."
        /></div>
      </div>

      <div className="mt-10 rounded-xl border border-border bg-card p-6 shadow-sm animate-card-in" style={{ animationDelay: "320ms" }}>
        <h2 className="font-display text-lg font-bold text-foreground">Why an AI Registry?</h2>
        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>To provide a clear, accessible record of AI technologies in use across DepEd — supporting informed decision-making by school heads, teachers, and administrators.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>To ensure every AI tool meets DepEd's standards for privacy, safety, and ethical use before and during its deployment.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>To promote innovation in Philippine basic education while maintaining human oversight and accountability at every stage.</span>
          </li>
        </ul>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 animate-card-in" style={{ animationDelay: "400ms" }}>
        <Link
          to="/ai-technology"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow transition-transform hover:scale-105"
        >
          View AI Technologies <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/governance"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-secondary"
        >
          Learn About Governance
        </Link>
      </div>
    </section>
  );
};

function AboutCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 text-center shadow-sm">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-3 font-display text-sm font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

export default About;
