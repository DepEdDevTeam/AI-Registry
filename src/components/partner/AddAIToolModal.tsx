import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MultiStepToolForm from "./MultiStepToolForm";

interface ThemeConfig {
  primary: string;
  secondary: string;
  accent: string;
}

interface AddAIToolModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
  parentType?: "proposal" | "partner";
  partnerTheme?: ThemeConfig;
  onSaved: () => void;
}

const AddAIToolModal = ({ open, onOpenChange, proposalId, parentType = "proposal", partnerTheme, onSaved }: AddAIToolModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card/80 backdrop-blur-md border-border/40">
        <DialogHeader>
          <DialogTitle>Add AI Tool</DialogTitle>
          <DialogDescription>
            Complete the governance details for this AI tool. Tool submissions will
            be reviewed separately by DepEd.
          </DialogDescription>
        </DialogHeader>
        <MultiStepToolForm
          proposalId={proposalId}
          parentType={parentType}
          partnerTheme={partnerTheme}
          onSuccess={() => {-
            onOpenChange(false);
            onSaved();
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AddAIToolModal;
