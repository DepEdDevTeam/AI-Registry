import { Link } from "react-router-dom";
import { Shield, Eye, BookOpen, ArrowRight } from "lucide-react";
import ECairShowcase from "@/components/ECairShowcase";
import depedLogo from "@/assets/deped-logo.png";

const Home = () => {
  return (
    <div className="relative text-slate-200">
      {/* Ambient mesh — augments the existing 3D globe in LandingLayout */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.18)_0%,rgba(30,30,90,0.06)_50%,transparent_100%)] blur-[80px]" />
        <div className="absolute left-1/2 top-1/2 h-[450px] w-[450px] -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border border-indigo-500/10" />
        <div className="absolute left-1/2 top-1/2 h-[650px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/5" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 py-20 sm:py-28">
        {/* HERO */}
        <section className="flex flex-col items-center text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-1.5 backdrop-blur-md">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-300">
              Responsible AI in Education
            </span>
          </div>

          <img src={depedLogo} alt="DepEd" className="mb-6 h-24 w-auto opacity-90" />

          <h1 className="font-display text-6xl font-extrabold tracking-tight text-white sm:text-7xl md:text-8xl">
            AI Registry<span className="text-indigo-500">.</span>
          </h1>

          <p className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-slate-400 md:text-xl">
            A transparent catalogue of AI technologies used by the Department of Education —{" "}
            <span className="font-normal text-slate-100">
              ensuring ethical, privacy-respecting, and human-centered AI
            </span>{" "}
            for Philippine basic education.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/ai-technology"
              className="rounded-xl bg-indigo-600 px-10 py-4 text-sm font-bold text-white shadow-[0_0_30px_rgba(79,70,229,0.4)] transition-all hover:scale-105 hover:bg-indigo-500 active:scale-95"
            >
              View AI Tools
            </Link>
            <Link
              to="/governance"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-10 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10"
            >
              Learn About Governance <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* E-CAIR Showcase (preserved interactive component) */}
        <section>
          <ECairShowcase />
        </section>

        {/* Trust pillars */}
        <section>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold tracking-tight text-white md:text-5xl">
              AI for Education, <span className="text-indigo-400">With Safeguards</span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-400">
              DepEd uses AI tools to support teaching, learning, and administration — always with
              human oversight and strict governance.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <FeatureCard
              icon={<BookOpen className="h-7 w-7" />}
              title="Catalogued & Transparent"
              description="Every AI tool is registered with its purpose, risk level, and compliance status — fully transparent to all stakeholders."
            />
            <FeatureCard
              icon={<Shield className="h-7 w-7" />}
              title="Risk-Classified"
              description="AI tools are classified from Minimal to High Risk, with appropriate safeguards at every level to protect learners."
            />
            <FeatureCard
              icon={<Eye className="h-7 w-7" />}
              title="Human-in-the-Loop"
              description="Teachers and officials remain the final decision-makers. AI supports — it never replaces — professional judgment."
            />
          </div>
        </section>
      </div>
    </div>
  );
};

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-[2rem] border border-white/5 bg-white/[0.02] p-8 backdrop-blur-md transition-all hover:border-indigo-500/30 hover:bg-white/[0.04]">
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20 transition-transform group-hover:scale-110">
        {icon}
      </div>
      <h3 className="font-display text-xl font-bold text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}

export default Home;
