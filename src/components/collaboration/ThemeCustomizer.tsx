import { Input } from "@/components/ui/input";

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

interface ThemeCustomizerProps {
  theme: ThemeConfig;
  onChange: (theme: ThemeConfig) => void;
  partnerName?: string;
  description?: string;
}

const ThemeCustomizer = ({ theme, onChange }: ThemeCustomizerProps) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Theme Customization</span>
      </div>

      <div className="flex gap-2 rounded-lg border p-3">
        <div className="h-10 w-10 rounded-md" style={{ backgroundColor: theme.primary }} title="Primary" />
        <div className="h-10 w-10 rounded-md" style={{ backgroundColor: theme.secondary }} title="Secondary" />
        <div className="h-10 w-10 rounded-md" style={{ backgroundColor: theme.accent }} title="Accent" />
        <div className="ml-auto flex items-center text-xs text-muted-foreground">Preview</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["primary", "secondary", "accent"] as const).map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-xs capitalize text-muted-foreground">{key}</label>
            <div className="flex gap-1">
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border-0"
              />
              <Input
                value={theme[key]}
                onChange={(e) => onChange({ ...theme, [key]: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ThemeCustomizer;
