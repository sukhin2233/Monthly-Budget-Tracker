export interface BudgetEntry {
  id: string;
  date: string;
  productName: string;
  amount: number;
  teamMember: string;
  type: 'Advanced' | 'Total';
}

export interface TeamPerformance {
  name: string;
  totalSpent: number;
  entries: BudgetEntry[];
}
