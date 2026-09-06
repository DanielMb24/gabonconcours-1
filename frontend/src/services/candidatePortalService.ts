import { apiService, type ApiResponse } from './api';

const segment = (value: string) => encodeURIComponent(value.trim().toUpperCase());

export const candidatePortalRoutes = {
  dashboard: (nipcan: string) => `/candidats/nipcan/${segment(nipcan)}/dashboard`,
  nipcanFromNupcan: (nupcan: string) => `/candidats/nupcan/${segment(nupcan)}/nipcan`,
  documents: (nupcan: string) => `/candidats/nupcan/${segment(nupcan)}/documents`,
  documentChecklist: (nupcan: string) => `/candidats/nupcan/${segment(nupcan)}/document-checklist`,
  notifications: (nupcan: string) => `/notifications/candidat/${segment(nupcan)}`,
  messages: (nupcan: string) => `/messages/candidat/${segment(nupcan)}`,
  grades: (nupcan: string) => `/grades/candidat/${segment(nupcan)}`,
} as const;

export const candidatePortalService = {
  getDashboard<T>(nipcan: string): Promise<ApiResponse<T>> {
    return apiService.get<T>(candidatePortalRoutes.dashboard(nipcan));
  },
  getNipcan<T>(nupcan: string): Promise<ApiResponse<T>> {
    return apiService.get<T>(candidatePortalRoutes.nipcanFromNupcan(nupcan));
  },
  getNotifications<T>(nupcan: string): Promise<ApiResponse<T>> {
    return apiService.get<T>(candidatePortalRoutes.notifications(nupcan));
  },
  getMessages<T>(nupcan: string): Promise<ApiResponse<T>> {
    return apiService.get<T>(candidatePortalRoutes.messages(nupcan));
  },
  sendMessage<T>(nupcan: string, sujet: string, message: string): Promise<ApiResponse<T>> {
    return apiService.post<T>('/messages/candidat', { nupcan: nupcan.trim().toUpperCase(), sujet, message });
  },
  getGrades<T>(nupcan: string): Promise<ApiResponse<T>> {
    return apiService.get<T>(candidatePortalRoutes.grades(nupcan));
  },
};
