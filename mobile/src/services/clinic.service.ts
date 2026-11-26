import api from './api';

export interface BranchItem {
  branchId: string;
  branchName: string;
  address?: string;
  phone?: string;
  status?: string;
}

export const clinicService = {
  getBranches: async (): Promise<BranchItem[]> => {
    const response = await api.get('/branches');
    const data = response.data?.data ?? response.data ?? [];
    return Array.isArray(data) ? data : [];
  },
};
