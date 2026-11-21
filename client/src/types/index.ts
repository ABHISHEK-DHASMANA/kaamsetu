export type Role = 'worker' | 'employer' | 'admin';

export type UserVerificationStatus = 'Registered' | 'Contact Verified' | 'Identity Verified';

export type SkillVerificationStatus = 'Self-declared' | 'Evidence Submitted' | 'Employer Confirmed';

export interface User {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  verificationStatus: UserVerificationStatus;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
}

export interface SkillItem {
  skillName: string;
  category: string;
  experienceYears: number;
  verificationStatus: SkillVerificationStatus;
  endorsementsCount?: number;
  evidenceUrl?: string;
}

export interface GeoLocation {
  state: string;
  city: string;
  area: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
}

export interface WorkerPreferences {
  expectedDailyWage: number;
  expectedMonthlyWage: number;
  jobType: 'Full-time' | 'Part-time' | 'Daily Wage' | 'Contract';
  availableDates: string;
  maxDistanceKm: number;
}

export interface SkillPassport {
  passportId: string;
  qrCodeString: string;
  verifiedSkillsCount: number;
  trustScore: number;
  completedJobsCount: number;
  rating: number;
  reviewsCount: number;
  badges: string[];
  issueDate: string;
  workerName?: string;
  workerId?: string;
  avatar?: string;
  primarySkill?: string;
  skills?: SkillItem[];
  experienceLevel?: string;
  experienceYearsNum?: number;
  location?: GeoLocation;
  bio?: string;
  userVerification?: UserVerificationStatus;
  memberSince?: string;
  verifiedWorkHistory?: number;
}

export interface WorkerProfile {
  _id: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string;
  avatar?: string;
  preferredLanguage: string;
  workerId: string;
  primarySkill: string;
  experienceLevel: string;
  experienceYearsNum: number;
  skills: SkillItem[];
  location: GeoLocation;
  preferences: WorkerPreferences;
  skillPassport: SkillPassport;
  bio: string;
  isProfileComplete: boolean;
}

export interface EmployerProfile {
  _id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  email?: string;
  industry: string;
  businessType: string;
  verificationStatus: UserVerificationStatus;
  gstOrGovtId?: string;
  address: GeoLocation;
  rating: number;
  jobsPostedCount: number;
  activeJobsCount: number;
  hiredWorkersCount: number;
  aboutCompany: string;
  avatar?: string;
  maxHiringDistanceKm?: number;
}

export interface Job {
  _id: string;
  id?: string;
  employerId: string;
  employerProfileId?: string;
  hiringRadiusKm?: number;
  companyName: string;
  title: string;
  category: string;
  requiredSkills: string[];
  description: string;
  requiredExperience: string;
  vacancies: number;
  filledVacancies: number;
  offeredWage: number;
  wageType: 'daily' | 'monthly' | 'task';
  workDuration: string;
  paymentFrequency: string;
  paymentTerms: string;
  deductions: string;
  overtimeTerms: string;
  wageTransparencyWarnings: string[];
  location: {
    address: string;
    area: string;
    city: string;
    state: string;
    pincode: string;
    coordinates: {
      lat: number;
      lng: number;
    };
  };
  startDate: string;
  endDate?: string;
  workTimings: string;
  employerContact?: {
    phone: string;
    personName: string;
  };
  status: 'active' | 'in_progress' | 'completed' | 'cancelled';
  applicantsCount: number;
  shortlistedCount: number;
  matchScore?: number;
  matchBreakdown?: {
    skillScore: number;
    locationScore: number;
    wageScore: number;
    availabilityScore: number;
  };
  distanceKm?: number;
  hiringRadiusKm?: number;
  matchExplanations?: string[];
  hasApplied?: boolean;
  applicationStatus?: string | null;
  createdAt: string;
}

export type ApplicationStatus = 'Applied' | 'Viewed' | 'Shortlisted' | 'Accepted' | 'Rejected' | 'Completed' | 'Cancelled';

export interface Application {
  _id: string;
  jobId: string;
  workerId: string;
  employerId: string;
  status: ApplicationStatus;
  matchScore: {
    total: number;
    breakdown: {
      skillScore: number;
      locationScore: number;
      wageScore: number;
      availabilityScore: number;
    };
    distanceKm: number;
    explanations: string[];
  };
  coverNote?: string;
  employerNotes?: string;
  createdAt: string;
  updatedAt: string;
  job?: Partial<Job>;
  employer?: Partial<EmployerProfile>;
  workerProfile?: Partial<WorkerProfile>;
  workerUser?: Partial<User>;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  actionUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ExtractedJobPreferences {
  skill: string;
  location: string;
  availability: string;
  expected_wage: number;
  wage_type: 'daily' | 'monthly';
  preferred_distance: number;
}
