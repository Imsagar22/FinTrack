/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Transaction, CategoryBudget } from './types';

export const INITIAL_BUDGETS: CategoryBudget[] = [
  { category: 'Food', limit: 600 },
  { category: 'Utilities', limit: 250 },
  { category: 'Rent/EMI', limit: 1600 },
  { category: 'Entertainment', limit: 300 },
  { category: 'Transport', limit: 200 },
  { category: 'Shopping', limit: 400 },
  { category: 'Miscellaneous', limit: 200 }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // --- July 2026 (Current Month) ---
  {
    id: 'jul-inc-1',
    date: '2026-07-01',
    amount: 5200,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'Bank Transfer',
    note: 'Monthly base salary'
  },
  {
    id: 'jul-inc-2',
    date: '2026-07-10',
    amount: 750,
    type: 'income',
    category: 'Freelance',
    paymentMethod: 'Bank Transfer',
    note: 'Website UI design contract'
  },
  {
    id: 'jul-lend-1',
    date: '2026-07-12',
    amount: 1500,
    type: 'lending',
    category: 'Lent to Friends',
    paymentMethod: 'UPI',
    note: 'Lent to Rahul for weekend trip'
  },
  {
    id: 'jul-borrow-1',
    date: '2026-07-14',
    amount: 3000,
    type: 'borrowed',
    category: 'Borrowed from Family',
    paymentMethod: 'Bank Transfer',
    note: 'Borrowed from dad for laptop service'
  },
  {
    id: 'jul-exp-1',
    date: '2026-07-01',
    amount: 1500,
    type: 'expense',
    category: 'Rent/EMI',
    paymentMethod: 'Bank Transfer',
    note: 'Apartment monthly rent'
  },
  {
    id: 'jul-exp-2',
    date: '2026-07-02',
    amount: 120,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'Card',
    note: 'Electricity bill'
  },
  {
    id: 'jul-exp-3',
    date: '2026-07-03',
    amount: 45,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'UPI',
    note: 'Internet connection'
  },
  {
    id: 'jul-exp-4',
    date: '2026-07-04',
    amount: 85,
    type: 'expense',
    category: 'Food',
    paymentMethod: 'UPI',
    note: 'Weekly grocery run'
  },
  {
    id: 'jul-exp-5',
    date: '2026-07-04',
    amount: 32,
    type: 'expense',
    category: 'Transport',
    paymentMethod: 'Card',
    note: 'Fuel refill'
  },
  {
    id: 'jul-exp-6',
    date: '2026-07-03',
    amount: 110,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'Card',
    note: 'New headphones'
  },
  {
    id: 'jul-inv-1',
    date: '2026-07-02',
    amount: 600,
    type: 'investment',
    category: 'Mutual Funds',
    paymentMethod: 'Bank Transfer',
    note: 'Index Fund SIP auto-debit'
  },
  {
    id: 'jul-inv-2',
    date: '2026-07-03',
    amount: 450,
    type: 'investment',
    category: 'Stocks/ETFs',
    paymentMethod: 'Bank Transfer',
    note: 'Tech ETF purchase'
  },

  // --- June 2026 ---
  {
    id: 'jun-inc-1',
    date: '2026-06-01',
    amount: 5200,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'Bank Transfer',
    note: 'Monthly base salary'
  },
  {
    id: 'jun-inc-2',
    date: '2026-06-15',
    amount: 900,
    type: 'income',
    category: 'Freelance',
    paymentMethod: 'Bank Transfer',
    note: 'E-commerce consulting'
  },
  {
    id: 'jun-exp-1',
    date: '2026-06-01',
    amount: 1500,
    type: 'expense',
    category: 'Rent/EMI',
    paymentMethod: 'Bank Transfer',
    note: 'Apartment rent'
  },
  {
    id: 'jun-exp-2',
    date: '2026-06-05',
    amount: 135,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'Card',
    note: 'Electricity + Gas'
  },
  {
    id: 'jun-exp-3',
    date: '2026-06-10',
    amount: 310,
    type: 'expense',
    category: 'Food',
    paymentMethod: 'UPI',
    note: 'Dine-outs and groceries'
  },
  {
    id: 'jun-exp-4',
    date: '2026-06-18',
    amount: 120,
    type: 'expense',
    category: 'Transport',
    paymentMethod: 'UPI',
    note: 'Train passes and cabs'
  },
  {
    id: 'jun-exp-5',
    date: '2026-06-20',
    amount: 210,
    type: 'expense',
    category: 'Entertainment',
    paymentMethod: 'Card',
    note: 'Concert ticket'
  },
  {
    id: 'jun-exp-6',
    date: '2026-06-25',
    amount: 185,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'Card',
    note: 'Summer clothes'
  },
  {
    id: 'jun-exp-7',
    date: '2026-06-28',
    amount: 90,
    type: 'expense',
    category: 'Miscellaneous',
    paymentMethod: 'Cash',
    note: 'Salon and haircuts'
  },
  {
    id: 'jun-inv-1',
    date: '2026-06-02',
    amount: 600,
    type: 'investment',
    category: 'Mutual Funds',
    paymentMethod: 'Bank Transfer',
    note: 'Index Fund SIP'
  },
  {
    id: 'jun-inv-2',
    date: '2026-06-05',
    amount: 500,
    type: 'investment',
    category: 'Stocks/ETFs',
    paymentMethod: 'Bank Transfer',
    note: 'Blue-chip equities'
  },
  {
    id: 'jun-inv-3',
    date: '2026-06-12',
    amount: 300,
    type: 'investment',
    category: 'Gold',
    paymentMethod: 'UPI',
    note: 'Sovereign digital gold'
  },

  // --- May 2026 ---
  {
    id: 'may-inc-1',
    date: '2026-05-01',
    amount: 5200,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'Bank Transfer',
    note: 'Monthly base salary'
  },
  {
    id: 'may-exp-1',
    date: '2026-05-01',
    amount: 1500,
    type: 'expense',
    category: 'Rent/EMI',
    paymentMethod: 'Bank Transfer',
    note: 'Apartment rent'
  },
  {
    id: 'may-exp-2',
    date: '2026-05-04',
    amount: 110,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'Card',
    note: 'Water & Electric'
  },
  {
    id: 'may-exp-3',
    date: '2026-05-12',
    amount: 420,
    type: 'expense',
    category: 'Food',
    paymentMethod: 'UPI',
    note: 'Monthly groceries & snacks'
  },
  {
    id: 'may-exp-4',
    date: '2026-05-15',
    amount: 160,
    type: 'expense',
    category: 'Entertainment',
    paymentMethod: 'UPI',
    note: 'Movie night with friends'
  },
  {
    id: 'may-exp-5',
    date: '2026-05-22',
    amount: 150,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'Card',
    note: 'Office chair'
  },
  {
    id: 'may-inv-1',
    date: '2026-05-02',
    amount: 600,
    type: 'investment',
    category: 'Mutual Funds',
    paymentMethod: 'Bank Transfer',
    note: 'Index Fund SIP'
  },
  {
    id: 'may-inv-2',
    date: '2026-05-10',
    amount: 400,
    type: 'investment',
    category: 'Stocks/ETFs',
    paymentMethod: 'Bank Transfer',
    note: 'Diversified index ETF'
  },
  {
    id: 'may-inv-3',
    date: '2026-05-25',
    amount: 500,
    type: 'investment',
    category: 'Fixed Deposits',
    paymentMethod: 'Bank Transfer',
    note: 'Emergency fund FD'
  },

  // --- April 2026 ---
  {
    id: 'apr-inc-1',
    date: '2026-04-01',
    amount: 5200,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'Bank Transfer',
    note: 'Monthly base salary'
  },
  {
    id: 'apr-inc-2',
    date: '2026-04-20',
    amount: 1200,
    type: 'income',
    category: 'Freelance',
    paymentMethod: 'Bank Transfer',
    note: 'Logo branding project'
  },
  {
    id: 'apr-exp-1',
    date: '2026-04-01',
    amount: 1500,
    type: 'expense',
    category: 'Rent/EMI',
    paymentMethod: 'Bank Transfer',
    note: 'Apartment rent'
  },
  {
    id: 'apr-exp-2',
    date: '2026-04-03',
    amount: 125,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'Card',
    note: 'Electricity and sewage'
  },
  {
    id: 'apr-exp-3',
    date: '2026-04-08',
    amount: 380,
    type: 'expense',
    category: 'Food',
    paymentMethod: 'UPI',
    note: 'Weekly food prep supplies'
  },
  {
    id: 'apr-exp-4',
    date: '2026-04-14',
    amount: 90,
    type: 'expense',
    category: 'Transport',
    paymentMethod: 'UPI',
    note: 'Cab rides'
  },
  {
    id: 'apr-exp-5',
    date: '2026-04-18',
    amount: 340,
    type: 'expense',
    category: 'Entertainment',
    paymentMethod: 'Card',
    note: 'Weekend resort stay'
  },
  {
    id: 'apr-inv-1',
    date: '2026-04-02',
    amount: 600,
    type: 'investment',
    category: 'Mutual Funds',
    paymentMethod: 'Bank Transfer',
    note: 'Index Fund SIP'
  },
  {
    id: 'apr-inv-2',
    date: '2026-04-05',
    amount: 450,
    type: 'investment',
    category: 'Stocks/ETFs',
    paymentMethod: 'Bank Transfer',
    note: 'High dividend portfolio'
  },

  // --- March 2026 ---
  {
    id: 'mar-inc-1',
    date: '2026-03-01',
    amount: 5200,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'Bank Transfer',
    note: 'Monthly base salary'
  },
  {
    id: 'mar-exp-1',
    date: '2026-03-01',
    amount: 1500,
    type: 'expense',
    category: 'Rent/EMI',
    paymentMethod: 'Bank Transfer',
    note: 'Apartment rent'
  },
  {
    id: 'mar-exp-2',
    date: '2026-03-04',
    amount: 140,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'Card',
    note: 'Gas & Electric'
  },
  {
    id: 'mar-exp-3',
    date: '2026-03-10',
    amount: 390,
    type: 'expense',
    category: 'Food',
    paymentMethod: 'UPI',
    note: 'Grocery store visits'
  },
  {
    id: 'mar-exp-4',
    date: '2026-03-15',
    amount: 80,
    type: 'expense',
    category: 'Transport',
    paymentMethod: 'UPI',
    note: 'Bus and metro fares'
  },
  {
    id: 'mar-exp-5',
    date: '2026-03-24',
    amount: 290,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'Card',
    note: 'Smart kitchen appliance'
  },
  {
    id: 'mar-inv-1',
    date: '2026-03-02',
    amount: 600,
    type: 'investment',
    category: 'Mutual Funds',
    paymentMethod: 'Bank Transfer',
    note: 'Index Fund SIP'
  },
  {
    id: 'mar-inv-2',
    date: '2026-03-05',
    amount: 400,
    type: 'investment',
    category: 'Stocks/ETFs',
    paymentMethod: 'Bank Transfer',
    note: 'Growth stocks allocation'
  },
  {
    id: 'mar-inv-3',
    date: '2026-03-15',
    amount: 250,
    type: 'investment',
    category: 'Provident Fund (PF)',
    paymentMethod: 'Bank Transfer',
    note: 'Employee voluntary PF'
  },

  // --- February 2026 ---
  {
    id: 'feb-inc-1',
    date: '2026-02-01',
    amount: 5200,
    type: 'income',
    category: 'Salary',
    paymentMethod: 'Bank Transfer',
    note: 'Monthly base salary'
  },
  {
    id: 'feb-inc-2',
    date: '2026-02-22',
    amount: 650,
    type: 'income',
    category: 'Dividends',
    paymentMethod: 'Bank Transfer',
    note: 'Quarterly stock payout'
  },
  {
    id: 'feb-exp-1',
    date: '2026-02-01',
    amount: 1500,
    type: 'expense',
    category: 'Rent/EMI',
    paymentMethod: 'Bank Transfer',
    note: 'Apartment rent'
  },
  {
    id: 'feb-exp-2',
    date: '2026-02-04',
    amount: 115,
    type: 'expense',
    category: 'Utilities',
    paymentMethod: 'Card',
    note: 'Electricity bill'
  },
  {
    id: 'feb-exp-3',
    date: '2026-02-08',
    amount: 360,
    type: 'expense',
    category: 'Food',
    paymentMethod: 'UPI',
    note: 'Daily lunch runs + home prep'
  },
  {
    id: 'feb-exp-4',
    date: '2026-02-12',
    amount: 180,
    type: 'expense',
    category: 'Shopping',
    paymentMethod: 'Card',
    note: 'Winter boots purchase'
  },
  {
    id: 'feb-exp-5',
    date: '2026-02-19',
    amount: 65,
    type: 'expense',
    category: 'Entertainment',
    paymentMethod: 'UPI',
    note: 'Gaming subscription + arcade'
  },
  {
    id: 'feb-inv-1',
    date: '2026-02-02',
    amount: 600,
    type: 'investment',
    category: 'Mutual Funds',
    paymentMethod: 'Bank Transfer',
    note: 'Index Fund SIP'
  },
  {
    id: 'feb-inv-2',
    date: '2026-02-05',
    amount: 300,
    type: 'investment',
    category: 'Stocks/ETFs',
    paymentMethod: 'Bank Transfer',
    note: 'Growth ETF'
  }
];
