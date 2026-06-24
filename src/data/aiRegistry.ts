export interface AIToolTheme {
  primary: string;
  secondary?: string;
  accent: string;
}

export interface AITool {
  id: string;
  name: string;
  provider: string;
  description: string;
  riskClassification: string;
  riskLevel: "unacceptable" | "high" | "limited" | "minimal";
  intendedUse: string;
  piaStatus: string;
  complianceAssessment: string;
  responsibleOfficer: string;
  oversightMechanism: string;
  dateOfEntry: string;
  status: "Pilot" | "Active" | "Retired";
  externalUrl?: string;
  partnerKey?: string;
  partnerTheme?: AIToolTheme;
}

export const aiRegistry: AITool[] = [];

export const getToolById = (id: string): AITool | undefined =>
  aiRegistry.find((t) => t.id === id);

export const getToolsByProvider = (provider: string): AITool[] =>
  aiRegistry.filter((t) => t.provider === provider);

export const getPartnerKeyFromProvider = (provider: string): string =>
  provider.toLowerCase().replace(/\s+/g, "-");
