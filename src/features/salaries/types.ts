export type SalaryPayment = {
  id: string;
  date: string;
  amount: number;
  notes: string | null;
};

export type SalaryCardData = {
  staffId: string;
  username: string;
  displayName: string;
  totalPaid: number;
  totalCalculated: number;
  totalHoursPay: number;
  totalHours: number;
  totalCommission: number;
  totalMissions: number;
  lastPaymentDate: string | null;
  status: "settled" | "partial" | "unpaid";
  paymentHistory: SalaryPayment[];
};
