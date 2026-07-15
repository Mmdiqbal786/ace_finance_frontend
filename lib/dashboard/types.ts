export interface HistoryLog {
  action: string;
  timestamp: string;
  user: string;
  notes?: string;
}

export interface Expense {
  id: string;
  requesterName: string;
  requesterEmail: string;
  amount: number;
  paidAmount?: number;
  originalAmount?: number;
  country?: string;
  currency?: string;
  exchangeRate?: number;
  exchangeRateDate?: string;
  category: string;
  project: string;
  description: string;
  date: string;
  dueDate?: string;
  status: string;
  submittedAt: string;
  approverNotes?: string;
  approvedAt?: string;
  processorNotes?: string;
  processedAt?: string;
  history: HistoryLog[];
}

export interface CategoryItem {
  _id: string;
  name: string;
  label: string;
  isActive: boolean;
}

export interface ProjectItem {
  _id: string;
  name: string;
  code?: string;
  isActive: boolean;
}

export interface CountryItem {
  _id: string;
  name: string;
  currency: string;
  isActive: boolean;
}

export interface DashboardStats {
  totalRequests: number;
  pendingApproval: number;
  pendingProcessing: number;
  processed: number;
  rejected: number;
  totalRequestedAmount: number;
  totalProcessedAmount: number;
  byCategory: { [key: string]: number };
  recentActivity: {
    expenseId: string;
    requesterName: string;
    action: string;
    timestamp: string;
    user: string;
  }[];
}

export type ExpenseActionType =
  | "approve"
  | "reject"
  | "process"
  | "partial-pay"
  | "processor-reject"
  | "view"
  | "edit"
  | "delete";

export type DashboardSection =
  | "home"
  | "approver"
  | "processor"
  | "user-management"
  | "categories"
  | "projects"
  | "countries"
  | "analytics";
