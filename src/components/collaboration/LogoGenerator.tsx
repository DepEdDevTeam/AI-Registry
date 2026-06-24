import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, Pencil } from "lucide-react";

interface LogoGeneratorProps {
  logoSvg: string;
  onLogoChange: (svg: string) => void;
  partnerName?: string;
  description?: string;
}

const LogoGenerator = ({ logoSvg, onLogoChange }: LogoGeneratorProps) => {
  const [editMode, setEditMode] = useState(false);
  const [editSvg, setEditSvg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "image/svg+xml") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        onLogoChange(ev.target?.result as string);
        toast({ title: "SVG uploaded!" });
      };
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
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Partner Logo</Label>
        <div className="flex gap-1">
          <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-1 h-3 w-3" /> Upload
          </Button>
          {logoSvg && (
            <Button type="button" size="sm" variant="outline" onClick={() => { setEditSvg(logoSvg); setEditMode(true); }}>
              <Pencil className="mr-1 h-3 w-3" /> Edit
            </Button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleFileUpload} />
      </div>

      {logoSvg ? (
        <div className="flex items-center gap-3 rounded-lg border p-3">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-secondary/50 p-1" dangerouslySetInnerHTML={{ __html: logoSvg }} />
          <p className="text-xs text-muted-foreground">Upload your logo or edit the SVG code.</p>
        </div>
      ) : (
        <div className="flex h-16 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
          No logo yet — upload one
        </div>
      )}

      {editMode && (
        <div className="space-y-2 rounded-lg border p-3">
          <Label className="text-xs">Edit SVG Code</Label>
          <Textarea
            value={editSvg}
            onChange={(e) => setEditSvg(e.target.value)}
            rows={5}
            className="font-mono text-xs"
            placeholder="<svg ...>...</svg>"
          />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={handleEditSave}>Save SVG</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogoGenerator;
