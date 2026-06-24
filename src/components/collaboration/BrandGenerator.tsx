import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Pencil } from "lucide-react";

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

interface BrandGeneratorProps {
  logoSvg: string;
  onLogoChange: (svg: string) => void;
  theme: ThemeConfig;
  onThemeChange: (theme: ThemeConfig) => void;
  partnerName?: string;
  description?: string;
}

const BrandGenerator = ({ logoSvg, onLogoChange, theme, onThemeChange }: BrandGeneratorProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editSvg, setEditSvg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (ev) => { onLogoChange(ev.target?.result as string); toast({ title: "SVG uploaded!" }); };
      reader.readAsText(file);
      return;
    }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        onLogoChange(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><clipPath id="clip"><rect width="64" height="64" rx="8"/></clipPath></defs><image href="${dataUrl}" width="64" height="64" clip-path="url(#clip)" preserveAspectRatio="xMidYMid slice"/></svg>`);
        toast({ title: "Image converted to SVG!" });
      };
      reader.readAsDataURL(file);
      return;
    }
    toast({ title: "Unsupported file type", variant: "destructive" });
  };

  const handleEditSave = () => {
    if (editSvg.includes("<svg")) {
      onLogoChange(editSvg);
      setEditMode(false);
      toast({ title: "SVG updated!" });
    } else {
      toast({ title: "Invalid SVG", description: "Must contain an <svg> element.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Brand Identity</Label>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-1 h-3 w-3" /> Upload Logo
          </Button>
          {logoSvg && (
            <Button type="button" size="sm" variant="outline" onClick={() => { setEditSvg(logoSvg); setEditMode(true); }}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFileUpload} />
      </div>

      <div className="flex items-center gap-4 rounded-lg border p-3">
        {logoSvg ? (
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-secondary/50 p-0.5" dangerouslySetInnerHTML={{ __html: logoSvg }} />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            Logo
          </div>
        )}
        <div className="flex gap-2">
          <div className="h-10 w-10 rounded-md" style={{ backgroundColor: theme.primary }} title="Primary" />
          <div className="h-10 w-10 rounded-md" style={{ backgroundColor: theme.secondary }} title="Secondary" />
          <div className="h-10 w-10 rounded-md" style={{ backgroundColor: theme.accent }} title="Accent" />
        </div>
        <div className="ml-auto text-xs text-muted-foreground">Preview</div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["primary", "secondary", "accent"] as const).map((key) => (
          <div key={key} className="space-y-1">
            <label className="text-xs capitalize text-muted-foreground">{key}</label>
            <div className="flex gap-1">
              <input
                type="color"
                value={theme[key]}
                onChange={(e) => onThemeChange({ ...theme, [key]: e.target.value })}
                className="h-8 w-8 cursor-pointer rounded border-0"
              />
              <Input
                value={theme[key]}
                onChange={(e) => onThemeChange({ ...theme, [key]: e.target.value })}
                className="h-8 text-xs"
              />
            </div>
          </div>
        ))}
      </div>

      {editMode && (
        <div className="space-y-2 rounded-lg border p-3">
          <Label className="text-xs">Edit SVG Code</Label>
          <Textarea value={editSvg} onChange={(e) => setEditSvg(e.target.value)} rows={5} className="font-mono text-xs" />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleEditSave}>Save SVG</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandGenerator;
