export type RiskLevel = "minimal" | "limited" | "high" | "unacceptable";

export interface UseCaseItem {
  label: string;
}

export interface RiskClassification {
  level: RiskLevel;
  title: string;
  description: string;
  policyTreatment: string;
  useCases: UseCaseItem[];
}

export interface StakeholderGroup {
  id: string;
  label: string;
  icon: string; // lucide icon name
  classifications: RiskClassification[];
}

export const stakeholderData: StakeholderGroup[] = [
  {
    id: "learners",
    label: "Learners",
    icon: "GraduationCap",
    classifications: [
      {
        level: "minimal",
        title: "Minimal Risk",
        description:
          "Everyday AI tools that support learning with little to no risk. These tools do not process sensitive data or make important decisions about learners.",
        policyTreatment: "Subject to standard IT controls",
        useCases: [
          { label: "Grammar and spelling correction" },
          { label: "Text-to-speech for accessibility" },
          { label: "Auto-formatting of documents" },
          { label: "Dictionary and thesaurus lookup" },
          { label: "Basic math calculators" },
          { label: "Language translation tools" },
        ],
      },
      {
        level: "limited",
        title: "Limited Risk",
        description:
          "AI that interacts directly with learners but does not make high-stakes decisions. These tools require transparency so students and parents understand how AI is being used.",
        policyTreatment: "Need transparency obligations",
        useCases: [
          { label: "AI tutoring and study assistants" },
          { label: "AI-generated quizzes and practice tests" },
          { label: "Personalized learning recommendations" },
          { label: "AI-powered educational chatbots" },
          { label: "Content summarization tools" },
          { label: "Interactive learning simulations" },
        ],
      },
      {
        level: "high",
        title: "High Risk",
        description:
          "AI used for decisions that significantly affect a learner's educational journey. Requires completed PIA, human oversight, audit logging, and appeal mechanisms.",
        policyTreatment: "Permitted subject to strict safeguards",
        useCases: [
          { label: "AI-assisted grading and scoring" },
          { label: "AI proctoring during examinations" },
          { label: "Scholarship eligibility screening" },
          { label: "Student performance prediction" },
          { label: "Automated admission decisions" },
          { label: "Behavioral risk assessment" },
        ],
      },
      {
        level: "unacceptable",
        title: "Unacceptable Risk",
        description:
          "AI that poses clear threats to learners' rights, dignity, or safety. These uses are absolutely prohibited in basic education under all circumstances.",
        policyTreatment: "Absolutely prohibited",
        useCases: [
          { label: "Emotion recognition for grading or evaluation" },
          { label: "Social scoring or behavioral ranking" },
          { label: "Manipulative or deceptive AI chatbots" },
          { label: "Distortion of facts, history, or science" },
          { label: "Subliminal manipulation of minors" },
          { label: "Mass surveillance of student activities" },
        ],
      },
    ],
  },
  {
    id: "teaching",
    label: "Teaching Personnel",
    icon: "BookOpen",
    classifications: [
      {
        level: "minimal",
        title: "Minimal Risk",
        description:
          "Basic AI productivity tools that help teachers with routine tasks. These tools don't process sensitive student data or make consequential decisions.",
        policyTreatment: "Subject to standard IT controls",
        useCases: [
          { label: "Spell-check and grammar tools" },
          { label: "Document formatting assistants" },
          { label: "Calendar and scheduling helpers" },
          { label: "Email auto-complete and sorting" },
          { label: "Presentation design suggestions" },
          { label: "File organization and tagging" },
        ],
      },
      {
        level: "limited",
        title: "Limited Risk",
        description:
          "AI that supports teaching and content creation but does not make final decisions. Requires transparency about AI involvement in materials and interactions.",
        policyTreatment: "Need transparency obligations",
        useCases: [
          { label: "AI-generated lesson plans and activities" },
          { label: "Automated quiz and test generation" },
          { label: "AI-assisted grading suggestions" },
          { label: "Classroom analytics dashboards" },
          { label: "AI-powered content translation" },
          { label: "Drafting reports and narratives" },
        ],
      },
      {
        level: "high",
        title: "High Risk",
        description:
          "AI used in decisions about teacher performance, evaluations, or sensitive administrative processes. Strict safeguards, auditing, and human oversight are required.",
        policyTreatment: "Permitted subject to strict safeguards",
        useCases: [
          { label: "Teacher performance evaluation tools" },
          { label: "AI-assisted staff appraisal systems" },
          { label: "Biometric attendance tracking" },
          { label: "Workload and deployment optimization" },
          { label: "Professional development scoring" },
          { label: "Automated classroom observation analysis" },
        ],
      },
      {
        level: "unacceptable",
        title: "Unacceptable Risk",
        description:
          "AI uses that violate teachers' rights, dignity, or professional standing. These are strictly prohibited and represent clear ethical violations.",
        policyTreatment: "Absolutely prohibited",
        useCases: [
          { label: "Emotion recognition for staff evaluation" },
          { label: "Covert monitoring of teaching methods" },
          { label: "Falsification of performance records" },
          { label: "AI replacing professional judgment entirely" },
          { label: "Social scoring of teaching staff" },
          { label: "Discriminatory profiling of educators" },
        ],
      },
    ],
  },
  {
    id: "non-teaching",
    label: "Non-Teaching Personnel",
    icon: "Building2",
    classifications: [
      {
        level: "minimal",
        title: "Minimal Risk",
        description:
          "AI tools that support routine administrative and operational tasks with negligible risk. Standard IT policies are sufficient for governance.",
        policyTreatment: "Subject to standard IT controls",
        useCases: [
          { label: "Spam and email filtering" },
          { label: "IT system monitoring and alerts" },
          { label: "Automated backup scheduling" },
          { label: "Helpdesk ticket categorization" },
          { label: "Document scanning and OCR" },
          { label: "Inventory tracking automation" },
        ],
      },
      {
        level: "limited",
        title: "Limited Risk",
        description:
          "AI used for administrative support and communication that interacts with staff or the public. Requires transparency about AI use in communications and processes.",
        policyTreatment: "Need transparency obligations",
        useCases: [
          { label: "AI-powered helpdesk chatbots" },
          { label: "Report drafting and summarization" },
          { label: "Analytics and data visualization" },
          { label: "Meeting transcription and minutes" },
          { label: "Procurement pattern analysis" },
          { label: "Budget forecasting tools" },
        ],
      },
      {
        level: "high",
        title: "High Risk",
        description:
          "AI involved in sensitive HR, financial, or security decisions affecting personnel. Requires PIA completion, human-in-the-loop, and comprehensive audit trails.",
        policyTreatment: "Permitted subject to strict safeguards",
        useCases: [
          { label: "Recruitment screening and shortlisting" },
          { label: "Payroll anomaly detection" },
          { label: "Staff disciplinary case analysis" },
          { label: "Security clearance processing" },
          { label: "Contract compliance monitoring" },
          { label: "Sensitive records classification" },
        ],
      },
      {
        level: "unacceptable",
        title: "Unacceptable Risk",
        description:
          "AI that threatens the rights, privacy, or dignity of non-teaching staff. These applications are absolutely banned from use in DepEd operations.",
        policyTreatment: "Absolutely prohibited",
        useCases: [
          { label: "Behavior-based monitoring and scoring" },
          { label: "Falsification of administrative records" },
          { label: "Covert surveillance of personnel" },
          { label: "Emotion-based hiring or firing decisions" },
          { label: "Discriminatory profiling of staff" },
          { label: "Manipulative communication targeting" },
        ],
      },
    ],
  },
];
