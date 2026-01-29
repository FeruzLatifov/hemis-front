import apiClient from './client';

export interface FilterColumn {
  columnName: string;
  referencedTable: string;
  displayName: string;
  dataType: string;
  required: boolean;
}

export interface SelectedFilter {
  columnName: string;
  referencedTable: string;
  allowedCodes: string[];
}

export interface StatisticsRequest {
  horizontalColumns?: SelectedFilter[];
  search?: string;
  page: number;
  size: number;
  sort?: string;
  direction?: 'ASC' | 'DESC';
}

export interface StatisticsResponse {
  content: Record<string, unknown>[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  appliedFilters?: SelectedFilter[];
}

export const universityReportsApi = {
  /**
   * Get available filter columns
   */
  getForeignKeys: async (): Promise<FilterColumn[]> => {
    const response = await apiClient.get<{ data: FilterColumn[] }>(
      '/api/v1/web/reports/universities/foreign-keys'
    );
    return response.data.data;
  },

  /**
   * Generate statistics
   */
  generateStatistics: async (request: StatisticsRequest): Promise<StatisticsResponse> => {
    const response = await apiClient.post<{ data: StatisticsResponse }>(
      '/api/v1/web/reports/universities/statistics',
      request
    );
    return response.data.data;
  },

  /**
   * Export to Excel/CSV
   */
  exportToExcel: async (request: StatisticsRequest): Promise<void> => {
    const response = await apiClient.post(
      '/api/v1/web/reports/universities/export/excel',
      request,
      { responseType: 'blob' }
    );
    
    // Download file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `universities_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
