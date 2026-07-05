/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, PaymentMethod } from '../types';

const EXPENSE_CATEGORIES = [
  'Food',
  'Utilities',
  'Rent/EMI',
  'Entertainment',
  'Transport',
  'Shopping',
  'Miscellaneous'
];

const INVESTMENT_CATEGORIES = [
  'Mutual Funds',
  'Stocks/ETFs',
  'Gold',
  'Provident Fund (PF)',
  'Fixed Deposits'
];

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Dividends',
  'Other'
];

const LENDING_CATEGORIES = [
  'Lent to Friends',
  'Lent to Family',
  'Lent to Colleagues',
  'Other lending'
];

const BORROWED_CATEGORIES = [
  'Borrowed from Bank (Loan)',
  'Borrowed from Friends',
  'Borrowed from Family',
  'Other borrowing'
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Card',
  'UPI',
  'Bank Transfer'
];

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'> & { id?: string }) => void;
  onClose: () => void;
  editingTransaction?: Transaction | null;
}

export default function TransactionForm({ onSave, onClose, editingTransaction }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [date, setDate] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errors, setErrors] = useState<{ amount?: string; category?: string; date?: string }>({});

  // Initialize form fields when in editing mode
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(editingTransaction.amount.toString());
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDate(editingTransaction.date);
      setNote(editingTransaction.note || '');
    } else {
      // Set to current local date by default (YYYY-MM-DD format)
      const now = new Date();
      const localDate = now.toISOString().split('T')[0];
      setDate(localDate);
      setType('expense');
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  }, [editingTransaction]);

  // Sync category options when transaction type changes
  useEffect(() => {
    if (!editingTransaction) {
      if (type === 'expense') {
        setCategory(EXPENSE_CATEGORIES[0]);
      } else if (type === 'investment') {
        setCategory(INVESTMENT_CATEGORIES[0]);
      } else if (type === 'income') {
        setCategory(INCOME_CATEGORIES[0]);
      } else if (type === 'lending') {
        setCategory(LENDING_CATEGORIES[0]);
      } else {
        setCategory(BORROWED_CATEGORIES[0]);
      }
    }
  }, [type, editingTransaction]);

  const categoriesToRender =
    type === 'expense'
      ? EXPENSE_CATEGORIES
      : type === 'investment'
      ? INVESTMENT_CATEGORIES
      : type === 'income'
      ? INCOME_CATEGORIES
      : type === 'lending'
      ? LENDING_CATEGORIES
      : BORROWED_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    if (!date) {
      newErrors.date = 'Please choose a date';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      id: editingTransaction?.id,
      type,
      amount: numericAmount,
      category,
      paymentMethod,
      date,
      note: note.trim() || undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Transaction Type Segmented Control */}
      <div>
        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Transaction Type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
          {(['expense', 'investment', 'income', 'lending', 'borrowed'] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`py-2 px-1.5 rounded-lg text-[10px] sm:text-xs font-bold capitalize transition-all duration-200 ${
                type === t
                  ? t === 'expense'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : t === 'investment'
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : t === 'income'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : t === 'lending'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-purple-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Amount Input */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Amount (INR)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold font-mono text-sm">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              className={`w-full pl-8 pr-4 py-2 bg-slate-50 dark:bg-slate-800/40 border ${
                errors.amount
                  ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                  : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'
              } rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 font-mono font-bold text-sm transition-all`}
            />
          </div>
          {errors.amount && (
            <span className="text-[11px] text-rose-500 font-medium mt-1 block">
              {errors.amount}
            </span>
          )}
        </div>

        {/* Date Input */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (errors.date) setErrors((prev) => ({ ...prev, date: undefined }));
            }}
            className={`w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800/40 border ${
              errors.date
                ? 'border-rose-400 focus:ring-rose-500/20 focus:border-rose-500'
                : 'border-slate-200 dark:border-slate-800 focus:ring-indigo-500/20 focus:border-indigo-500'
            } rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 text-sm font-semibold transition-all`}
          />
          {errors.date && (
            <span className="text-[11px] text-rose-500 font-medium mt-1 block">
              {errors.date}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Category Dropdown */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              if (errors.category) setErrors((prev) => ({ ...prev, category: undefined }));
            }}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold transition-all"
          >
            {categoriesToRender.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {errors.category && (
            <span className="text-[11px] text-rose-500 font-medium mt-1 block">
              {errors.category}
            </span>
          )}
        </div>

        {/* Payment Method Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-semibold transition-all"
          >
            {PAYMENT_METHODS.map((pm) => (
              <option key={pm} value={pm}>
                {pm}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Optional Note Description */}
      <div>
        <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
          Note <span className="text-slate-400 lowercase">(optional)</span>
        </label>
        <textarea
          placeholder="What was this for? (e.g. Weekly grocery stock, Freelance work, SIP)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm font-medium transition-all resize-none"
        />
      </div>

      {/* Button footer actions */}
      <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-xs font-bold transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
            type === 'expense'
              ? 'bg-rose-500 hover:bg-rose-600 focus:ring-rose-500/20'
              : type === 'investment'
              ? 'bg-indigo-500 hover:bg-indigo-600 focus:ring-indigo-500/20'
              : type === 'income'
              ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500/20'
              : type === 'lending'
              ? 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/20'
              : 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-500/20'
          }`}
        >
          {editingTransaction ? 'Save Changes' : 'Record Transaction'}
        </button>
      </div>
    </form>
  );
}
