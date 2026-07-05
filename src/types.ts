/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'income' | 'expense' | 'investment' | 'lending' | 'borrowed';

export type ExpenseCategory =
  | 'Food'
  | 'Utilities'
  | 'Rent/EMI'
  | 'Entertainment'
  | 'Transport'
  | 'Shopping'
  | 'Miscellaneous';

export type InvestmentCategory =
  | 'Mutual Funds'
  | 'Stocks/ETFs'
  | 'Gold'
  | 'Provident Fund (PF)'
  | 'Fixed Deposits';

export type IncomeCategory =
  | 'Salary'
  | 'Freelance'
  | 'Business'
  | 'Dividends'
  | 'Other';

export type PaymentMethod = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  amount: number;
  type: TransactionType;
  category: ExpenseCategory | InvestmentCategory | IncomeCategory | string;
  paymentMethod: PaymentMethod;
  note?: string;
}

export interface CategoryBudget {
  category: string;
  limit: number;
}
