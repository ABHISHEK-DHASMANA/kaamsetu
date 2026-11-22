import {
  User,
  Job,
  Application,
  WorkerProfile,
  EmployerProfile,
  SkillPassport,
  NotificationItem,
  ExtractedJobPreferences
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = sessionStorage.getItem('kaamsetu_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

// Generic fetcher with error handling
const request = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...(options.headers || {})
      }
    });

    const responseText = await response.text();
    let data: any = null;

    if (responseText.trim()) {
      try {
        data = JSON.parse(responseText);
      } catch {
        const contentType = response.headers.get('content-type') || 'unknown content type';
        throw new Error(
          `Server returned an invalid response for ${endpoint} (HTTP ${response.status}, ${contentType}). Please try again or contact support.`
        );
      }
    } else {
      throw new Error(
        `Server returned an empty response for ${endpoint} (HTTP ${response.status}). Please try again in a moment.`
      );
    }

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || `Request failed with status ${response.status}`);
    }
    return data as T;
  } catch (err: any) {
    console.warn(`[API] Network request to ${endpoint} failed:`, err.message);
    throw err;
  }
};

// Auth API
export const apiLogin = async (phone: string, password: string) => {
  return request<{ success: boolean; token: string; user: User; profile: any }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ phone, password })
  });
};

export const apiRegister = async (payload: any) => {
  return request<{ success: boolean; token: string; user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const apiFirebaseLogin = async (idToken: string) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('Firebase sign-in did not return an ID token. Please sign in again.');
  }
  return request<{ success: boolean; token: string; user: User; profile: any }>('/auth/firebase', {
    method: 'POST',
    headers: { Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ idToken })
  });
};

export const apiGetMe = async () => {
  return request<{ success: boolean; user: User; profile: any }>('/auth/me');
};

// Jobs API
export const apiGetJobs = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return request<{ success: boolean; count: number; jobs: Job[] }>(`/jobs${query ? `?${query}` : ''}`);
};

export const apiGetMatchingJobs = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return request<{ success: boolean; count: number; jobs: Job[]; workerLocation: any }>(
    `/jobs/matching${query ? `?${query}` : ''}`
  );
};

export const apiGetJobById = async (id: string) => {
  return request<{ success: boolean; job: Job; employerProfile: EmployerProfile }>(`/jobs/${id}`);
};

export const apiCreateJob = async (jobData: Partial<Job>) => {
  return request<{ success: boolean; message: string; job: Job }>('/jobs', {
    method: 'POST',
    body: JSON.stringify(jobData)
  });
};

export const apiUpdateJob = async (id: string, jobData: Partial<Job>) => {
  return request<{ success: boolean; message: string; job: Job }>(`/jobs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(jobData)
  });
};

export const apiDeleteJob = async (id: string) => {
  return request<{ success: boolean; message: string }>(`/jobs/${id}`, {
    method: 'DELETE'
  });
};

// Applications API
export const apiApplyJob = async (jobId: string, coverNote?: string) => {
  return request<{ success: boolean; message: string; application: Application }>('/applications/apply', {
    method: 'POST',
    body: JSON.stringify({ jobId, coverNote })
  });
};

export const apiGetWorkerApplications = async () => {
  return request<{ success: boolean; count: number; applications: Application[] }>('/applications/worker');
};

export const apiGetEmployerApplications = async (jobId?: string, status?: string) => {
  const params = new URLSearchParams();
  if (jobId) params.append('jobId', jobId);
  if (status) params.append('status', status);
  const q = params.toString();
  return request<{ success: boolean; count: number; applications: Application[] }>(
    `/applications/employer${q ? `?${q}` : ''}`
  );
};

export const apiUpdateWorkLifecycle = async (appId: string, action: 'start_work' | 'request_completion' | 'confirm_completion' | 'cancel', reason?: string, paymentMode?: 'online' | 'offline') => {
  return request<{ success: boolean; message: string; application: Application }>(`/applications/${appId}/lifecycle`, {
    method: 'POST', body: JSON.stringify({ action, reason, paymentMode })
  });
};

export const apiUpdateApplicationStatus = async (appId: string, status: string, notes?: string) => {
  return request<{ success: boolean; message: string; application: Application }>(
    `/applications/${appId}/status`,
    {
      method: 'PUT',
      body: JSON.stringify({ status, employerNotes: notes })
    }
  );
};

// Public worker discovery
export const apiGetWorkers = async (params: Record<string, string> = {}) => {
  const query = new URLSearchParams(params).toString();
  return request<{ success: boolean; count: number; workers: Array<{
    _id: string; userId: string; fullName: string; avatar?: string; primarySkill: string;
    experienceLevel: string; experienceYearsNum: number; skills?: Array<{ skillName: string }>;
    location?: { city?: string; area?: string };
    skillPassport?: { passportId?: string; rating?: number; reviewsCount?: number; completedJobsCount?: number; trustScore?: number };
    bio?: string; isProfileComplete?: boolean;
  }> }>('/workers/all' + (query ? '?' + query : ''));
};

// Worker Profile & Passport API
export const apiGetWorkerProfile = async (userId?: string) => {
  return request<{ success: boolean; workerProfile: WorkerProfile; user: User; reviews: any[] }>(
    userId ? `/workers/profile/${userId}` : '/workers/profile'
  );
};

export const apiUpdateWorkerProfile = async (updates: Partial<WorkerProfile>) => {
  return request<{ success: boolean; message: string; workerProfile: WorkerProfile }>('/workers/profile', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
};

export const apiGetSkillPassport = async (passportId?: string) => {
  return request<{ success: boolean; skillPassport: SkillPassport }>(
    passportId ? `/workers/passport/${passportId}` : '/workers/passport'
  );
};

// Employer API
export const apiGetEmployerProfile = async (userId?: string) => {
  return request<{ success: boolean; profile: EmployerProfile; user: User }>(
    userId ? `/employers/profile/${userId}` : '/employers/profile'
  );
};

export const apiUpdateEmployerProfile = async (updates: Partial<EmployerProfile>) => {
  return request<{ success: boolean; message: string; profile: EmployerProfile }>('/employers/profile', {
    method: 'PUT',
    body: JSON.stringify(updates)
  });
};

export const apiGetCandidatesForJob = async (jobId: string) => {
  return request<{ success: boolean; count: number; job: Job; candidates: any[] }>(
    `/employers/jobs/${jobId}/candidates`
  );
};

// Voice AI API
export const apiExtractVoicePreferences = async (transcript: string, language?: string) => {
  return request<{
    success: boolean;
    preferences: ExtractedJobPreferences;
    meta: { extractor: string; originalTranscript: string; detectedLanguage: string };
  }>('/voice/extract-preferences', {
    method: 'POST',
    body: JSON.stringify({ transcript, language })
  });
};

// Notifications API
export const apiGetNotifications = async () => {
  return request<{ success: boolean; unreadCount: number; notifications: NotificationItem[] }>(
    '/notifications'
  );
};

export const apiMarkNotificationRead = async (id: string) => {
  return request<{ success: boolean }>(`/notifications/${id}/read`, {
    method: 'PUT'
  });
};

export const apiMarkAllNotificationsRead = async () => {
  return request<{ success: boolean }>('/notifications/mark-all-read', {
    method: 'PUT'
  });
};

// Admin API
export const apiGetAdminStats = async () => {
  return request<{
    success: boolean;
    stats: any;
    categoryDistribution: { name: string; count: number }[];
    workerVerificationCounts: Record<string, number>;
    dailyActivity: any[];
  }>('/admin/stats');
};

export const apiGetAdminUsers = async (role?: string) => {
  return request<{ success: boolean; count: number; users: User[] }>(
    `/admin/users${role ? `?role=${role}` : ''}`
  );
};

export const apiToggleUserStatus = async (id: string) => {
  return request<{ success: boolean; message: string; user: any }>(
    `/admin/users/${id}/toggle-status`,
    { method: 'PUT' }
  );
};

export const apiVerifyUserIdentity = async (id: string, verificationStatus: string) => {
  return request<{ success: boolean; message: string }>(`/admin/users/${id}/verify-identity`, {
    method: 'PUT',
    body: JSON.stringify({ verificationStatus })
  });
};

export const apiGetAdminReports = async () => {
  return request<{ success: boolean; count: number; reports: any[] }>('/admin/reports');
};

export const apiUpdateReportStatus = async (id: string, payload: any) => {
  return request<{ success: boolean; message: string }>(`/admin/reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
};

export const apiCreateReview = async (payload: { toUserId: string; jobId: string; rating: number; reviewText: string }) => {
  return request<{ success: boolean; message: string; review: any }>('/reviews', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

// Reports API (Public / User)
export const apiSubmitReport = async (payload: {
  targetType: 'job' | 'employer' | 'worker';
  targetId: string;
  targetName: string;
  reason: string;
  details: string;
}) => {
  return request<{ success: boolean; message: string }>('/reports', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};


// Direct employer-to-worker payment tracking
export const apiGetMyPayments = async () => {
  return request<{ success: boolean; payments: any[]; summary: { paidTotal: number; directUpiTotal: number; cashTotal: number; pendingTotal: number; paidCount: number } }>('/payments/me');
};

export const apiCreatePayment = async (payload: { applicationId: string; amount: number; method: 'cash' | 'direct_upi'; transactionReference?: string; note?: string }) => {
  return request<{ success: boolean; message: string; payment: any }>('/payments', {
    method: 'POST', body: JSON.stringify(payload)
  });
};

export const apiConfirmPaymentReceived = async (id: string) => {
  return request<{ success: boolean; message: string; payment: any }>(`/payments/${id}/confirm-received`, { method: 'PUT' });
};

export const apiDisputePayment = async (id: string, reason: string) => {
  return request<{ success: boolean; message: string; payment: any }>(`/payments/${id}/dispute`, {
    method: 'POST', body: JSON.stringify({ reason })
  });
};


// PhonePe PG V2 checkout and server-side status verification
export const apiGetPhonePeAvailability = async () => {
  return request<{ success: boolean; available: boolean; environment: string; message: string }>('/phonepe/availability');
};

export const apiCreatePhonePeCheckout = async (payload: { applicationId: string; amount: number }) => {
  return request<{ success: boolean; message: string; checkoutUrl: string; payment: any }>('/phonepe/checkout', {
    method: 'POST', body: JSON.stringify(payload)
  });
};

export const apiGetPhonePePaymentStatus = async (merchantOrderId: string) => {
  return request<{ success: boolean; payment: any }>(`/phonepe/${encodeURIComponent(merchantOrderId)}/status`);
};

export const apiGetMyPhonePePayments = async () => {
  return request<{ success: boolean; payments: any[] }>('/phonepe/me');
};
