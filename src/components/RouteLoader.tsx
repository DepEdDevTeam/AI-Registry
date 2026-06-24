import { Loader2 } from "lucide-react";

interface RouteLoaderProps {
  label?: string;
}

const RouteLoader = ({ label = "Loading page..." }: RouteLoaderProps) => {
  return (
    <div className="min-h-[60vh] px-4 py-16">
      <div className="mx-auto flex max-w-md flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/70 px-6 py-10 text-center shadow-sm backdrop-blur-sm">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        <p className="mt-4 text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">Preparing the route and assets.</p>
      </div>
    </div>
  );
};

export default RouteLoader;
