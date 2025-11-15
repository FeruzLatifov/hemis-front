/**
 * Dashboard Types
 */

export interface DashboardOverview {
  totalStudents: number
  totalTeachers: number
  totalUniversities: number
  totalDiplomas: number
  totalProjects: number
  totalPublications: number
  activeStudents: number
  graduatedStudents: number
  expelledStudents: number
  academicLeaveStudents: number
  cancelledStudents: number
  grantStudents: number
  contractStudents: number
  maleCount: number
  femaleCount: number
}

export interface ChartDataItem {
  name: string
  count: number
  percentage?: number
}

export interface StudentsByCategory {
  byEducationForm: ChartDataItem[]
  byRegion: ChartDataItem[]
  byLanguage: ChartDataItem[]
}

export interface EducationType {
  code: string
  name: string
  count: number
}

export interface TopUniversity {
  rank: number
  code: string
  name: string
  studentCount: number
  maleCount: number
  femaleCount: number
  grantCount: number
  contractCount: number
}

export interface RecentActivity {
  type: string
  action: string
  name: string
  time: string
}

export interface DashboardStats {
  timestamp: string
  overview: DashboardOverview
  students: StudentsByCategory
  educationTypes: EducationType[]
  topUniversities: TopUniversity[]
  recentActivities: RecentActivity[]
}
