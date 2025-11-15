/**
 * Dashboard API Client
 */

import apiClient from './client';

export interface DashboardStats {
  timestamp: string;
  overview: {
    // Total counts
    totalStudents: number;
    totalTeachers: number;
    totalUniversities: number;
    totalDiplomas: number;
    totalProjects: number;
    totalPublications: number;
    
    // Students by status
    activeStudents: number;           // O'qimoqda
    graduatedStudents: number;        // Bitirgan
    expelledStudents: number;         // Chetlashgan
    academicLeaveStudents: number;    // Akademik ta'til
    cancelledStudents: number;        // Bekor qilingan
    
    // Payment type (only active)
    grantStudents: number;
    contractStudents: number;
    
    // Gender (only active)
    maleCount: number;
    femaleCount: number;
  };
  students: {
    byEducationForm: Array<{ name: string; count: number }>;
    byRegion: Array<{ name: string; count: number }>;
    byLanguage: Array<{ name: string; count: number }>;
  };
  educationTypes: Array<{
    code: string;
    name: string;
    count: number;
  }>;
  topUniversities: Array<{
    rank: number;
    code: string;
    name: string;
    studentCount: number;
    maleCount: number;
    femaleCount: number;
    grantCount: number;
    contractCount: number;
  }>;
  recentActivities: Array<{
    type: string;
    action: string;
    name: string;
    time: string;
  }>;
}

/**
 * Get dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await apiClient.get<DashboardStats>('/api/v1/web/dashboard/stats');
  return response.data;
};

export const dashboardApi = {
  getStats: getDashboardStats,
};
