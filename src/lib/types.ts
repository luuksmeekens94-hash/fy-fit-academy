export type Role = "MEDEWERKER" | "TEAMLEIDER" | "BEHEERDER" | "REVIEWER";
export type ModulePublicationStatus = "CONCEPT" | "GEPUBLICEERD" | "GEARCHIVEERD";

export type OnboardingContentType =
  | "TEXT"
  | "VIDEO"
  | "DOCUMENT"
  | "MODULE_LINK"
  | "CHECKLIST";

export type ModuleSectionType = "TEXT" | "VIDEO" | "QUIZ" | "IMAGE";
export type ModuleStatus = "NIET_GESTART" | "BEZIG" | "AFGEROND";
export type LearningGoalStatus = "OPEN" | "BEZIG" | "AFGEROND";
export type DocumentType =
  | "PROTOCOL"
  | "WERKAFSPRAAK"
  | "KERNBOODSCHAP"
  | "FORMAT"
  | "OVERIG";
export type Visibility = "PRIVATE" | "TEAM";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  team?: string | null;
  professionalRegistrationNumber?: string | null;
  title: string;
  location: string;
  buddyId?: string;
  teamleaderId?: string;
  isActive: boolean;
  isOnboarding: boolean;
  bio: string;
  avatarColor: string;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  order: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type ModuleSection = {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  type: ModuleSectionType;
  content: string;
  quizData?: QuizQuestion[];
};

export type AcademyModule = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  thumbnailLabel?: string | null;
  status: ModulePublicationStatus;
  isRequired: boolean;
  estimatedMinutes: number;
  authorId: string;
  sections: ModuleSection[];
};

export type ModuleProgress = {
  id: string;
  userId: string;
  moduleId: string;
  status: ModuleStatus;
  score?: number;
  startedAt: string;
  completedAt?: string;
};

export type OnboardingStep = {
  id: string;
  pathId: string;
  order: number;
  title: string;
  description: string;
  contentType: OnboardingContentType;
  content: string;
  isRequired: boolean;
};

export type OnboardingPath = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  steps: OnboardingStep[];
};

export type OnboardingProgress = {
  id: string;
  userId: string;
  stepId: string;
  completed: boolean;
  completedAt?: string;
  completedById?: string;
  notes?: string;
};

export type LibraryDocument = {
  id: string;
  title: string;
  type: DocumentType;
  categoryId: string;
  version: string;
  ownerId: string;
  isPublished: boolean;
  updatedAt: string;
  summary: string;
  content: string;
  tags: string[];
};

export type LearningGoal = {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: LearningGoalStatus;
  targetDate?: string;
  updatedAt: string;
};

export type DevelopmentDocument = {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  visibility: Visibility;
  updatedAt: string;
};
