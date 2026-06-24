// Lightweight sessionStorage-backed draft for the partner onboarding wizard.
// Password is intentionally NOT persisted here — handled in-memory only.

export interface PartnerOnboardingDraft {
  // Initiation
  orgName?: string;
  description?: string;
  conceptNoteUrl?: string;
  background?: string;
  contactPerson?: string;
  contactPosition?: string;
  contactNumber?: string;
  contactEmail?: string;
  contactMode?: string;
  contractNote?: string;
  // Account
  accountEmail?: string;
  // Result
  proposedPartnerId?: string;
}

const KEY = "partner_onboarding_draft_v1";

export const getDraft = (): PartnerOnboardingDraft => {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};

export const setDraft = (patch: Partial<PartnerOnboardingDraft>) => {
  const next = { ...getDraft(), ...patch };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
};

export const clearDraft = () => {
  sessionStorage.removeItem(KEY);
};
