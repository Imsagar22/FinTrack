/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  ReceiptText,
  TrendingUp,
  Wallet,
  Settings,
  PlusCircle,
  Download,
  Upload,
  Trash2,
  Edit,
  Filter,
  Calendar,
  Search,
  CheckCircle2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  RefreshCw,
  Clock,
  X,
  CreditCard,
  User,
  AlertTriangle,
  Lock,
  Unlock,
  Users,
  Database,
  ShieldAlert
} from 'lucide-react';

import { Transaction, TransactionType, CategoryBudget, PaymentMethod } from './types';
import { INITIAL_BUDGETS, INITIAL_TRANSACTIONS } from './initialData';
import { DonutChart, TrendChart, WealthRatioBar } from './components/CustomCharts';
import TransactionForm from './components/TransactionForm';
import WealthForecaster from './components/WealthForecaster';
import BudgetMonitor from './components/BudgetMonitor';

// Firebase imports
import { auth, db, signInWithEmail, signUpWithEmail, signInWithGoogle, signOutUser } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';

export default function App() {
  // --- Firebase Sync & Auth States ---
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'user' | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [syncInProgress, setSyncInProgress] = useState(false);

  // --- Profile Menu & Admin Modal States ---
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Handle clicking outside of profile dropdown to close it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- Admin telemetry states ---
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, totalTransactions: 0, totalVolume: 0 });
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // --- Persistent State Hooks ---
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_tracker_transactions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse transactions', e);
      }
    }
    return INITIAL_TRANSACTIONS; // Fallback to seeded demo records
  });

  const [budgets, setBudgets] = useState<CategoryBudget[]>(() => {
    const saved = localStorage.getItem('finance_tracker_budgets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse budgets', e);
      }
    }
    return INITIAL_BUDGETS;
  });

  // Keep localStorage updated on changes
  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('finance_tracker_transactions', JSON.stringify(transactions));
    }
  }, [transactions, currentUser]);

  useEffect(() => {
    if (!currentUser) {
      localStorage.setItem('finance_tracker_budgets', JSON.stringify(budgets));
    }
  }, [budgets, currentUser]);

  // --- Firebase Auth & Firestore Subscription ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        // Realtime user role check
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUserRole(snap.data().role || 'user');
          } else {
            setUserRole(user.email === 'sagarmailstop@gmail.com' ? 'admin' : 'user');
          }
        });

        // Realtime transactions check
        const txQuery = query(collection(db, 'transactions'), where('userId', '==', user.uid));
        const unsubscribeTx = onSnapshot(txQuery, (snapshot) => {
          const cloudTx: Transaction[] = [];
          snapshot.forEach((dSnap) => {
            cloudTx.push({ id: dSnap.id, ...dSnap.data() } as Transaction);
          });
          // Sort by date desc
          const sorted = cloudTx.sort((a, b) => b.date.localeCompare(a.date));
          setTransactions(sorted);
        });

        // Realtime budgets check
        const budgetQuery = query(collection(db, 'budgets'), where('userId', '==', user.uid));
        const unsubscribeBudget = onSnapshot(budgetQuery, (snapshot) => {
          const cloudBudgets: CategoryBudget[] = [];
          snapshot.forEach((dSnap) => {
            const data = dSnap.data();
            cloudBudgets.push({ category: data.category, limit: data.limit } as CategoryBudget);
          });
          if (cloudBudgets.length > 0) {
            setBudgets(cloudBudgets);
          }
        });

        return () => {
          unsubscribeUser();
          unsubscribeTx();
          unsubscribeBudget();
        };
      } else {
        setUserRole(null);
        // Reset to local data
        const savedTx = localStorage.getItem('finance_tracker_transactions');
        if (savedTx) {
          try {
            setTransactions(JSON.parse(savedTx));
          } catch (e) {
            setTransactions(INITIAL_TRANSACTIONS);
          }
        } else {
          setTransactions(INITIAL_TRANSACTIONS);
        }

        const savedBudgets = localStorage.getItem('finance_tracker_budgets');
        if (savedBudgets) {
          try {
            setBudgets(JSON.parse(savedBudgets));
          } catch (e) {
            setBudgets(INITIAL_BUDGETS);
          }
        } else {
          setBudgets(INITIAL_BUDGETS);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Active Tab State ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'analytics' | 'budgets' | 'settings' | 'admin'>('dashboard');

  // --- Filter and Month-Selection States ---
  const [selectedPeriod, setSelectedPeriod] = useState<string>('2026-07'); // Default to active July 2026
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | PaymentMethod>('all');
  const [sortField, setSortField] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // --- Modal Forms / Editing States ---
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // --- File Import States ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // --- Notification Toast ---
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // --- Extract All Distinct Months for Filter Options ---
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.date && tx.date.length >= 7) {
        months.add(tx.date.substring(0, 7)); // 'YYYY-MM'
      }
    });
    // Sort descending
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // --- Sync Selected Period if the list updates ---
  useEffect(() => {
    if (selectedPeriod !== 'all' && !availableMonths.includes(selectedPeriod) && availableMonths.length > 0) {
      // If our current selected month got deleted or doesn't exist, default to the latest month
      setSelectedPeriod(availableMonths[0]);
    }
  }, [availableMonths, selectedPeriod]);

  // --- Calculate Metrics (Income, Expense, Investment, Balances) ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const matchPeriod = selectedPeriod === 'all' || tx.date.startsWith(selectedPeriod);
      const matchQuery =
        tx.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (tx.note && tx.note.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchType = typeFilter === 'all' || tx.type === typeFilter;
      const matchPayment = paymentFilter === 'all' || tx.paymentMethod === paymentFilter;

      return matchPeriod && matchQuery && matchType && matchPayment;
    });
  }, [transactions, selectedPeriod, searchQuery, typeFilter, paymentFilter]);

  // Sort transactions for table view
  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
      if (sortField === 'date') {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      } else {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
    });
  }, [filteredTransactions, sortField, sortOrder]);

  // --- Period-specific aggregations for KPI summary cards ---
  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    let investment = 0;
    let lending = 0;
    let borrowed = 0;

    // Filtered strictly by selected period
    transactions.forEach((tx) => {
      const matchPeriod = selectedPeriod === 'all' || tx.date.startsWith(selectedPeriod);
      if (matchPeriod) {
        if (tx.type === 'income') income += tx.amount;
        else if (tx.type === 'expense') expense += tx.amount;
        else if (tx.type === 'investment') investment += tx.amount;
        else if (tx.type === 'lending') lending += tx.amount;
        else if (tx.type === 'borrowed') borrowed += tx.amount;
      }
    });

    return {
      income,
      expense,
      investment,
      lending,
      borrowed,
      netBalance: income - expense - investment - lending + borrowed,
    };
  }, [transactions, selectedPeriod]);

  // --- Recent 5 transactions for the dashboard sidebar ---
  const recentActivity = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // --- Donut Chart category classification ---
  const expenseBreakdown = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.forEach((tx) => {
      const matchPeriod = selectedPeriod === 'all' || tx.date.startsWith(selectedPeriod);
      if (matchPeriod && tx.type === 'expense') {
        categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
      }
    });

    const colors = [
      '#ef4444', // Red
      '#f97316', // Orange
      '#f59e0b', // Amber
      '#10b981', // Emerald
      '#06b6d4', // Cyan
      '#6366f1', // Indigo
      '#8b5cf6', // Violet
      '#ec4899', // Pink
    ];

    return Object.entries(categories)
      .map(([label, value], idx) => ({
        label,
        value,
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, selectedPeriod]);

  // --- Current Month category spending for budgets ---
  const categorySpendingMap = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.forEach((tx) => {
      // Compute for currently chosen active period (or latest active month)
      const currentMonthStr = selectedPeriod === 'all' ? '2026-07' : selectedPeriod;
      if (tx.date.startsWith(currentMonthStr) && tx.type === 'expense') {
        map[tx.category] = (map[tx.category] || 0) + tx.amount;
      }
    });
    return map;
  }, [transactions, selectedPeriod]);

  // --- Trend Chart monthly aggregations (Last 6 Months) ---
  const monthlyTrendData = useMemo(() => {
    const monthlyData: Record<string, { income: number; expense: number; investment: number }> = {};

    // Use specific hardcoded order or dynamic order
    // Fill in last 6 months starting from Feb 2026 to July 2026 for a premium trend view
    const trendMonths = ['2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07'];

    // Initialize months to preserve 0-values for smooth columns
    trendMonths.forEach((m) => {
      monthlyData[m] = { income: 0, expense: 0, investment: 0 };
    });

    transactions.forEach((tx) => {
      const monthStr = tx.date.substring(0, 7);
      if (monthlyData[monthStr]) {
        if (tx.type === 'income') monthlyData[monthStr].income += tx.amount;
        else if (tx.type === 'expense') monthlyData[monthStr].expense += tx.amount;
        else if (tx.type === 'investment') monthlyData[monthStr].investment += tx.amount;
      }
    });

    // Translate to visual trend array
    const monthNames: Record<string, string> = {
      '2026-02': 'Feb 26',
      '2026-03': 'Mar 26',
      '2026-04': 'Apr 26',
      '2026-05': 'May 26',
      '2026-06': 'Jun 26',
      '2026-07': 'Jul 26',
    };

    return trendMonths.map((m) => ({
      month: monthNames[m] || m,
      income: monthlyData[m].income,
      expense: monthlyData[m].expense,
      investment: monthlyData[m].investment,
    }));
  }, [transactions]);

  // --- Admin stats loader helper ---
  const fetchAdminData = async () => {
    if (!currentUser || userRole !== 'admin') return;
    setIsAdminLoading(true);
    try {
      const usersCol = collection(db, 'users');
      const usersSnap = await getDocs(usersCol);
      const usersList: any[] = [];
      usersSnap.forEach((docSnap) => {
        usersList.push({ id: docSnap.id, ...docSnap.data() });
      });

      const txCol = collection(db, 'transactions');
      const txSnap = await getDocs(txCol);
      let totalTxCount = 0;
      let totalVolume = 0;
      txSnap.forEach((docSnap) => {
        totalTxCount++;
        totalVolume += docSnap.data().amount || 0;
      });

      setAdminUsers(usersList);
      setAdminStats({
        totalUsers: usersList.length,
        totalTransactions: totalTxCount,
        totalVolume: totalVolume
      });
    } catch (err: any) {
      console.error(err);
      triggerToast(`Failed to load admin logs: ${err.message}`, 'error');
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    if (showAdminModal && userRole === 'admin') {
      fetchAdminData();
    }
  }, [showAdminModal, userRole]);

  // --- Sync offline logs to Cloud ---
  const syncGuestDataToCloud = async () => {
    if (!currentUser) return;
    setSyncInProgress(true);
    try {
      let syncCount = 0;
      // Sync transactions
      for (const tx of transactions) {
        if (!tx.userId) {
          const docRef = doc(db, 'transactions', tx.id);
          await setDoc(docRef, {
            ...tx,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
          });
          syncCount++;
        }
      }

      // Sync budgets
      for (const b of budgets) {
        if (!b.userId) {
          const budgetId = `${currentUser.uid}_${b.category.replace(/\//g, '_')}`;
          await setDoc(doc(db, 'budgets', budgetId), {
            ...b,
            userId: currentUser.uid,
            updatedAt: new Date().toISOString()
          });
        }
      }

      triggerToast(`Successfully synced ${syncCount} guest transactions to Cloud!`, 'success');
    } catch (err: any) {
      triggerToast(`Sync failed: ${err.message}`, 'error');
    } finally {
      setSyncInProgress(false);
    }
  };

  // --- Auth Submission Handler ---
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      triggerToast('Please provide email and password', 'error');
      return;
    }
    setIsAuthLoading(true);
    try {
      if (authMode === 'signup') {
        const user = await signUpWithEmail(authEmail, authPassword);
        triggerToast(`Account created for ${user.email}!`, 'success');
      } else {
        const user = await signInWithEmail(authEmail, authPassword);
        triggerToast(`Authenticated successfully as ${user.email}!`, 'success');
      }
      setShowAuthModal(false);
      setAuthPassword('');
    } catch (err: any) {
      console.error(err);
      triggerToast(`Authentication Error: ${err.message}`, 'error');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      const user = await signInWithGoogle();
      triggerToast(`Authenticated successfully as ${user.email || 'Google User'}!`, 'success');
      setShowAuthModal(false);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-blocked') {
        triggerToast('Sign-In popup was blocked. Please allow popups or Open the App in a New Tab!', 'error');
      } else if (err.code === 'auth/operation-not-supported-in-this-environment' || err.message?.includes('iframe')) {
        triggerToast('Google popup is restricted inside the preview. Please click "Open in new tab" at the top-right to sign in with Google!', 'error');
      } else {
        triggerToast(`Google Sign-In Error: ${err.message}`, 'error');
      }
    } finally {
      setIsAuthLoading(false);
    }
  };

  // --- Add / Edit Transaction Handlers ---
  const handleSaveTransaction = async (txData: Omit<Transaction, 'id'> & { id?: string }) => {
    if (currentUser) {
      try {
        if (txData.id) {
          // Edit existing in Firestore
          const docRef = doc(db, 'transactions', txData.id);
          await setDoc(docRef, {
            ...txData,
            userId: currentUser.uid,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          triggerToast('Transaction updated in Cloud', 'success');
        } else {
          // Add new in Firestore
          const newId = `tx-${Date.now()}`;
          const docRef = doc(db, 'transactions', newId);
          await setDoc(docRef, {
            ...txData,
            id: newId,
            userId: currentUser.uid,
            createdAt: new Date().toISOString()
          });
          triggerToast('Transaction recorded in Cloud', 'success');
        }
      } catch (err: any) {
        console.error(err);
        triggerToast(`Failed to sync to Cloud: ${err.message}`, 'error');
      }
    } else {
      if (txData.id) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === txData.id ? (txData as Transaction) : t))
        );
        triggerToast('Transaction updated locally', 'success');
      } else {
        const newTx: Transaction = {
          ...txData,
          id: `tx-${Date.now()}`,
        };
        setTransactions((prev) => [newTx, ...prev]);
        triggerToast('New transaction recorded locally', 'success');
      }
    }
    setIsAddOpen(false);
    setEditingTransaction(null);
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction record?')) {
      if (currentUser) {
        try {
          await deleteDoc(doc(db, 'transactions', id));
          triggerToast('Transaction deleted from Cloud', 'info');
        } catch (err: any) {
          triggerToast(`Failed to delete from Cloud: ${err.message}`, 'error');
        }
      } else {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
        triggerToast('Transaction record deleted locally', 'info');
      }
    }
  };

  const handleUpdateBudget = async (category: string, limit: number) => {
    if (currentUser) {
      try {
        const budgetId = `${currentUser.uid}_${category.replace(/\//g, '_')}`;
        await setDoc(doc(db, 'budgets', budgetId), {
          category,
          limit,
          userId: currentUser.uid,
          updatedAt: new Date().toISOString()
        });
        triggerToast(`Cloud Budget for ${category} set to ₹${limit}`, 'success');
      } catch (err: any) {
        triggerToast(`Cloud sync failed: ${err.message}`, 'error');
      }
    } else {
      setBudgets((prev) => {
        const exists = prev.find((b) => b.category === category);
        if (exists) {
          return prev.map((b) => (b.category === category ? { ...b, limit } : b));
        } else {
          return [...prev, { category, limit }];
        }
      });
      triggerToast(`Updated ${category} monthly budget to ₹${limit}`, 'success');
    }
  };

  // --- Data Settings Handlers ---
  const handleExportData = () => {
    const dataStr = JSON.stringify({ transactions, budgets }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerToast('Backup JSON exported successfully', 'success');
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.transactions && Array.isArray(data.transactions)) {
          setTransactions(data.transactions);
          if (data.budgets && Array.isArray(data.budgets)) {
            setBudgets(data.budgets);
          }
          setImportStatus({ type: 'success', message: 'Backup successfully restored!' });
          triggerToast('Financial data restored successfully', 'success');
        } else {
          setImportStatus({ type: 'error', message: 'Invalid file format. "transactions" array not found.' });
          triggerToast('Failed to parse backup file', 'error');
        }
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Failed to read file. Please ensure it is a valid JSON file.' });
        triggerToast('Failed to parse backup file', 'error');
      }
    };
    reader.readAsText(file);
    // Reset file input so same file can be re-selected
    e.target.value = '';
  };

  const handleResetToDemo = () => {
    if (confirm('Are you sure you want to restore the default 6-month demo dataset? This will overwrite your current logs.')) {
      setTransactions(INITIAL_TRANSACTIONS);
      setBudgets(INITIAL_BUDGETS);
      triggerToast('Restored default 6-month demo data', 'success');
    }
  };

  const handleWipeData = () => {
    if (confirm('WARNING: This will completely wipe all transaction logs and budgets from the system. Do you want to proceed?')) {
      setTransactions([]);
      setBudgets([]);
      triggerToast('All local logs and budgets cleared', 'info');
    }
  };

  // Format Month Strings for readable display
  const formatMonthName = (monthStr: string) => {
    if (monthStr === 'all') return 'All Time';
    const [year, month] = monthStr.split('-');
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
    return dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      
      {/* --- FLOATING TOAST SYSTEM --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold border transition-all ${
              toast.type === 'success'
                ? 'bg-emerald-500 text-white border-emerald-400'
                : toast.type === 'error'
                ? 'bg-rose-500 text-white border-rose-400'
                : 'bg-slate-800 text-white border-slate-700'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
            {toast.type === 'error' && <AlertTriangle className="w-4 h-4" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- MAIN HEADER NAV BAR --- */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800 shrink-0">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-16 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-8 h-full">
            {/* App Brand Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                <div className="w-4 h-4 border-2 border-white rounded-sm rotate-45"></div>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">FinTrack</span>
            </div>

            {/* Nav Tabs for Desktop */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium h-full">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'transactions', label: 'Transactions' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'budgets', label: 'Budgets' },
                { id: 'settings', label: 'Settings' },
              ].map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`h-full flex items-center transition-colors relative text-sm font-semibold border-b-2 px-1 cursor-pointer ${
                      isActive
                        ? 'text-indigo-600 border-indigo-600 dark:text-indigo-400 dark:border-indigo-400 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 border-transparent font-medium'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Action buttons (Quick Add, Profile details) */}
          <div className="flex items-center gap-4">
            {/* Quick Record Button */}
            <button
              onClick={() => {
                setEditingTransaction(null);
                setIsAddOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-sm shadow-md shadow-indigo-200 hover:bg-indigo-700 transition-all cursor-pointer"
            >
              <span>+ New Transaction</span>
            </button>

            {/* Auth Control Block */}
            <div className="flex items-center gap-2 relative" ref={profileMenuRef}>
              {currentUser ? (
                <div className="flex items-center">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center gap-2.5 p-1 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-all cursor-pointer text-left"
                  >
                    {/* Email & Role Label */}
                    <div className="hidden lg:flex flex-col text-right">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{currentUser.email}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                        {userRole === 'admin' ? '🛡️ Admin' : '👤 Synced'}
                      </span>
                    </div>

                    {/* Profile Initials Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-indigo-500/50 shadow-sm overflow-hidden dark:bg-slate-800 shrink-0">
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-extrabold dark:bg-indigo-950 dark:text-indigo-300 text-xs uppercase">
                        {currentUser.email ? currentUser.email.substring(0, 2) : 'US'}
                      </div>
                    </div>
                  </button>

                  {/* Profile Dropdown Overlay */}
                  <AnimatePresence>
                    {showProfileDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50 space-y-4 text-slate-700 dark:text-slate-300"
                      >
                        {/* User Header */}
                        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-950 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-extrabold text-xs uppercase shrink-0">
                            {currentUser.email ? currentUser.email.substring(0, 2) : 'US'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                              {currentUser.email}
                            </p>
                            <p className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5">
                              {userRole === 'admin' ? '🛡️ Global Admin' : '👤 Synced Account'}
                            </p>
                          </div>
                        </div>

                        {/* Status Grid */}
                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 text-[10px] space-y-2 border border-slate-100 dark:border-slate-800/40">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Sync Connection</span>
                            <span className="text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              <span>Live Synced</span>
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 font-bold uppercase tracking-wider">Local Offsets</span>
                            <span className="text-slate-500 dark:text-slate-300 font-mono font-bold">
                              {transactions.filter(t => !t.userId).length} cached logs
                            </span>
                          </div>
                        </div>

                        {/* Dropdown Options */}
                        <div className="space-y-1 pt-1">
                          {userRole === 'admin' && (
                            <button
                              onClick={() => {
                                setShowProfileDropdown(false);
                                setShowAdminModal(true);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 text-xs font-bold transition-all cursor-pointer text-left"
                            >
                              <ShieldAlert className="w-4 h-4 shrink-0" />
                              <span>Open Admin Console</span>
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setShowProfileDropdown(false);
                              if (confirm('Are you sure you want to log out?')) {
                                signOutUser();
                                triggerToast('Logged out successfully', 'info');
                                setActiveTab('dashboard');
                              }
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 text-xs font-bold transition-all cursor-pointer text-left"
                          >
                            <Unlock className="w-4 h-4 shrink-0" />
                            <span>Sign Out / Lock</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAuthMode('signin');
                    setShowAuthModal(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg font-semibold text-xs transition-all cursor-pointer border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Sync Account</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
 
      {/* --- RESPONSIVE BOTTOM NAVIGATION BAR FOR MOBILE --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/80 py-2.5 px-4 flex justify-around items-center shadow-lg dark:bg-slate-900 dark:border-slate-800">
        {[
          { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
          { id: 'transactions', label: 'History', icon: ReceiptText },
          { id: 'analytics', label: 'Wealth', icon: TrendingUp },
          { id: 'budgets', label: 'Budgets', icon: Clock },
          { id: 'settings', label: 'Settings', icon: Settings },
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 transition-all cursor-pointer ${
                isActive
                  ? 'text-indigo-600 dark:text-indigo-400 scale-105'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500'
              }`}
            >
              <IconComp className="w-4.5 h-4.5" />
              <span className="text-[9px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- OFFLINE/GUEST CLOUD SYNC BANNER --- */}
      {!currentUser && (
        <div className="bg-gradient-to-r from-indigo-50 to-sky-50 dark:from-indigo-950/20 dark:to-slate-900 border-b border-indigo-100 dark:border-indigo-950/40 text-[11px] text-slate-700 dark:text-slate-300 py-2.5 px-4 shrink-0">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="font-medium flex items-center gap-1.5 justify-center sm:justify-start">
              <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>You are using <strong>Guest Mode (Local Storage)</strong>. Sign up to backup your transaction logs permanently in the Cloud.</span>
            </span>
            <button
              onClick={() => {
                setAuthMode('signup');
                setShowAuthModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-3 py-1 rounded-md shadow-sm transition-all text-[10px] cursor-pointer"
            >
              Sign Up Now
            </button>
          </div>
        </div>
      )}

      {/* --- CLOUD DATA IMPORT OPPORTUNITY BANNER --- */}
      {currentUser && transactions.some(t => !t.userId) && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/40 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 py-2.5 px-4 shrink-0 animate-pulse">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <span className="font-medium flex items-center gap-1.5 justify-center sm:justify-start">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 animate-spin" />
              <span>You have <strong>{transactions.filter(t => !t.userId).length} offline logs</strong> saved on this browser. Click sync to back them up to your cloud account!</span>
            </span>
            <button
              disabled={syncInProgress}
              onClick={syncGuestDataToCloud}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1 rounded-md shadow-sm transition-all text-[10px] disabled:opacity-50 cursor-pointer"
            >
              {syncInProgress ? 'Syncing...' : 'Sync to Cloud'}
            </button>
          </div>
        </div>
      )}

      {/* --- DEMO WARNING BANNER --- */}
      {!currentUser && transactions.length === INITIAL_TRANSACTIONS.length &&
        transactions[0]?.id === INITIAL_TRANSACTIONS[0]?.id && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border-b border-amber-200/40 dark:border-amber-900/40 text-[11px] text-amber-700 dark:text-amber-400 py-2.5 px-4 shrink-0">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
              <span className="font-semibold flex items-center gap-1.5 justify-center sm:justify-start">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                You are exploring pre-seeded 6-month financial demo data. You can record custom logs or clear everything anytime.
              </span>
              <button
                onClick={handleWipeData}
                className="bg-amber-600/10 hover:bg-amber-600/20 dark:bg-amber-500/10 dark:hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold px-2.5 py-1 rounded-md transition-all text-[10px] cursor-pointer"
              >
                Clear Demo Data
              </button>
            </div>
          </div>
        )}

      {/* --- MAIN PAGE LAYOUT --- */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 pb-24 md:pb-12">
        
        {/* --- PAGE SUB-HEADER WITH TITLE & DYNAMIC FILTER --- */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
              Financial Overview
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 dark:text-white mt-0.5">
              {activeTab === 'dashboard' && 'Financial Dashboard'}
              {activeTab === 'transactions' && 'Transaction Ledger'}
              {activeTab === 'analytics' && 'Growth Analytics'}
              {activeTab === 'budgets' && 'Budgets & Limits'}
              {activeTab === 'settings' && 'System Settings'}
            </h2>
          </div>

          {/* Global Month Selector Filter */}
          {activeTab !== 'settings' && (
            <div className="flex items-center gap-2.5 bg-white dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 shadow-sm shrink-0">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent text-xs font-extrabold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-0 cursor-pointer"
              >
                <option value="all">All Time (Aggregated)</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthName(m)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* --- DYNAMIC RENDER OF CORE VIEWS --- */}
        <AnimatePresence mode="wait">
          
          {/* --- TAB 1: DASHBOARD VIEW --- */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Section: Analytics & Stats */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4 shrink-0">
                    {/* CARD 1: INCOME */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Income</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">₹{totals.income.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Inflow Active</span>
                      </div>
                    </div>

                    {/* CARD 2: EXPENSES */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Monthly Expenses</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white font-mono">₹{totals.expense.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <div className="mt-2 text-[10px] text-rose-500 dark:text-rose-400 font-medium flex items-center gap-0.5">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>Outlays</span>
                      </div>
                    </div>

                    {/* CARD 3: INVESTED */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Invested</p>
                      <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">₹{totals.investment.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <div className="mt-2 text-[10px] text-indigo-500 dark:text-indigo-300 font-medium flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Investments</span>
                      </div>
                    </div>

                    {/* CARD 4: LENT */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Lent</p>
                      <p className="text-xl font-bold text-amber-600 dark:text-amber-400 font-mono">₹{totals.lending.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <div className="mt-2 text-[10px] text-amber-500 dark:text-amber-400 font-medium flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Receivables</span>
                      </div>
                    </div>

                    {/* CARD 5: BORROWED */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Borrowed</p>
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400 font-mono">₹{totals.borrowed.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <div className="mt-2 text-[10px] text-purple-500 dark:text-purple-400 font-medium flex items-center gap-0.5">
                        <ArrowDownRight className="w-3 h-3" />
                        <span>Payables</span>
                      </div>
                    </div>

                    {/* CARD 6: NET SAVINGS */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-indigo-50/10 dark:bg-indigo-950/5 transition-all hover:shadow-md">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Net Balance</p>
                      <p className={`text-xl font-bold font-mono ${totals.netBalance >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>₹{totals.netBalance.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                      <div className="mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-0.5">
                        <span>Cash & Lending</span>
                      </div>
                    </div>
                  </div>

                  {/* Big Chart Area */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cash Flow Trend</h2>
                      <div className="flex gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Income
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <span className="w-3 h-3 rounded-full bg-rose-500"></span> Expense
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Investment
                        </span>
                      </div>
                    </div>
                    <TrendChart data={monthlyTrendData} />
                  </div>

                  {/* Expense Breakdown (Donut) */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                          Expense Breakdown
                        </h3>
                        <p className="text-xs text-slate-400">
                          Categorized expenditures for {formatMonthName(selectedPeriod)}
                        </p>
                      </div>
                    </div>
                    <DonutChart data={expenseBreakdown} totalLabel="Expense Total" />
                  </div>

                  {/* Wealth & Lifestyle Ratio */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                    <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                        Wealth & Lifestyle Ratio
                      </h3>
                      <p className="text-xs text-slate-400">
                        How your income is split for saving vs spending
                      </p>
                    </div>
                    <div className="py-4">
                      <WealthRatioBar
                        income={totals.income}
                        expense={totals.expense}
                        investment={totals.investment}
                      />
                    </div>
                    {/* Advice Card */}
                    <div className="bg-indigo-50/50 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100/50 dark:border-indigo-900/40 text-xs mt-4">
                      <span className="font-bold text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Active Financial Advice
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                        {totals.income === 0 ? (
                          'Log your monthly salary or freelancer earnings to compute your personal savings rates and investment health metrics.'
                        ) : totals.investment / totals.income >= 0.2 ? (
                          'Fantastic! You are investing over 20% of your total income. This aggressive wealth accumulation rate fast-tracks compound gains.'
                        ) : (
                          'Try to gradually optimize miscellaneous living expenditures to reach a benchmark target of 20% active monthly investments.'
                        )}
                      </p>
                    </div>
                  </div>

                </div>

                {/* Right Section: Recent & Breakdown */}
                <div className="lg:col-span-4 flex flex-col gap-6 w-full">
                  
                  {/* Wealth Progress */}
                  {(() => {
                    const wealthShieldRatio = totals.income > 0 ? Math.round(((totals.investment + Math.max(0, totals.netBalance)) / totals.income) * 100) : 0;
                    return (
                      <div className="bg-slate-900 dark:bg-slate-950 rounded-2xl p-5 text-white shadow-lg border border-slate-850">
                        <h3 className="text-sm font-semibold opacity-70 mb-4">Wealth Shield Ratio</h3>
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-3xl font-bold font-mono">{wealthShieldRatio}%</span>
                          <span className="text-xs text-emerald-400 font-semibold">Healthy Target</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, wealthShieldRatio))}%` }}
                          ></div>
                        </div>
                        <p className="mt-3 text-[11px] leading-relaxed opacity-60">
                          {totals.income === 0 ? (
                            "Please add income logs to calculate your active Wealth Shield Ratio."
                          ) : (
                            `Investment and savings represent ${wealthShieldRatio}% of your total inflow this month. Great job!`
                          )}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Recent Transactions List */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm">Recent Activity</h3>
                      <button onClick={() => setActiveTab('transactions')} className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">View All</button>
                    </div>
                    <div className="p-3 space-y-1">
                      {recentActivity.length === 0 ? (
                        <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No transactions recorded.</div>
                      ) : (
                        recentActivity.map((tx) => {
                          let icon = '🍔';
                          let bgClass = 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400';
                          
                          if (tx.type === 'income') {
                            icon = '💰';
                            bgClass = 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400';
                          } else if (tx.type === 'investment') {
                            icon = '📈';
                            bgClass = 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400';
                          } else if (tx.type === 'lending') {
                            icon = '🤝';
                            bgClass = 'bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400';
                          } else if (tx.type === 'borrowed') {
                            icon = '💸';
                            bgClass = 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400';
                          } else {
                            const cat = tx.category.toLowerCase();
                            if (cat.includes('food')) {
                              icon = '🍔';
                              bgClass = 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400';
                            } else if (cat.includes('util') || cat.includes('rent') || cat.includes('bill')) {
                              icon = '⚡';
                              bgClass = 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400';
                            } else if (cat.includes('shop')) {
                              icon = '🛍️';
                              bgClass = 'bg-pink-100 text-pink-600 dark:bg-pink-950/40 dark:text-pink-400';
                            } else if (cat.includes('trans')) {
                              icon = '🚗';
                              bgClass = 'bg-cyan-100 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400';
                            } else if (cat.includes('entertain')) {
                              icon = '🍿';
                              bgClass = 'bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400';
                            } else {
                              icon = '🏷️';
                              bgClass = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
                            }
                          }

                          const isIncome = tx.type === 'income';
                          const isInvestment = tx.type === 'investment';
                          const isLending = tx.type === 'lending';
                          const isBorrowed = tx.type === 'borrowed';

                          return (
                            <div key={tx.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${bgClass}`}>
                                  <span className="text-base">{icon}</span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{tx.note || tx.category}</p>
                                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{tx.category} • {tx.date}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-bold font-mono ${
                                isIncome ? 'text-emerald-600 dark:text-emerald-400' :
                                isInvestment ? 'text-indigo-600 dark:text-indigo-400' :
                                isLending ? 'text-amber-600 dark:text-amber-400' :
                                isBorrowed ? 'text-purple-600 dark:text-purple-400' :
                                'text-slate-700 dark:text-slate-300'
                              }`}>
                                {isIncome || isBorrowed ? '+' : isInvestment ? '▲' : '-'}₹{tx.amount.toLocaleString('en-IN')}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </motion.div>
          )}

          {/* --- TAB 2: TRANSACTIONS TABLE VIEW --- */}
          {activeTab === 'transactions' && (
            <motion.div
              key="transactions-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* ADVANCED MULTI-COLUMN FILTER BAR */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-4 md:p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Filter className="w-4.5 h-4.5 text-indigo-500 shrink-0" />
                    Filter & Search Records
                  </h3>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setTypeFilter('all');
                      setPaymentFilter('all');
                      setSortField('date');
                      setSortOrder('desc');
                      setSelectedPeriod('2026-07');
                    }}
                    className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 self-start md:self-auto"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset Filters
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search category or notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium transition-all"
                    />
                  </div>

                  {/* Type filter */}
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-semibold"
                  >
                    <option value="all">All Transaction Types</option>
                    <option value="income">Income Only</option>
                    <option value="expense">Expense Only</option>
                    <option value="investment">Investment Only</option>
                    <option value="lending">Lending Only</option>
                    <option value="borrowed">Borrowed Only</option>
                  </select>

                  {/* Payment method filter */}
                  <select
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-semibold"
                  >
                    <option value="all">All Payment Methods</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>

                  {/* Sorting dropdown */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={`${sortField}-${sortOrder}`}
                      onChange={(e) => {
                        const [field, order] = e.target.value.split('-');
                        setSortField(field as any);
                        setSortOrder(order as any);
                      }}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-semibold"
                    >
                      <option value="date-desc">Newest First</option>
                      <option value="date-asc">Oldest First</option>
                      <option value="amount-desc">Amount: High to Low</option>
                      <option value="amount-asc">Amount: Low to High</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* DATA TABLE LEDGER CONTAINER */}
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-50/70 border-b border-slate-100 dark:bg-slate-800/40 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                        <th className="px-5 py-3.5">Date</th>
                        <th className="px-5 py-3.5">Category</th>
                        <th className="px-5 py-3.5">Payment</th>
                        <th className="px-5 py-3.5">Note</th>
                        <th className="px-5 py-3.5 text-right">Amount</th>
                        <th className="px-5 py-3.5 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                      {sortedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <ReceiptText className="w-10 h-10 stroke-current opacity-30" />
                              <span>No financial records match your filters</span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        sortedTransactions.map((tx) => {
                          let typeBadge = '';
                          let amountColor = '';

                          if (tx.type === 'income') {
                            typeBadge = 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50';
                            amountColor = 'text-emerald-600 dark:text-emerald-400';
                          } else if (tx.type === 'investment') {
                            typeBadge = 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border-indigo-100/50';
                            amountColor = 'text-indigo-600 dark:text-indigo-400';
                          } else if (tx.type === 'lending') {
                            typeBadge = 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-100/50';
                            amountColor = 'text-amber-600 dark:text-amber-400';
                          } else if (tx.type === 'borrowed') {
                            typeBadge = 'bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 border-purple-100/50';
                            amountColor = 'text-purple-600 dark:text-purple-400';
                          } else {
                            typeBadge = 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border-rose-100/50';
                            amountColor = 'text-slate-800 dark:text-slate-200';
                          }

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                              {/* Date Column */}
                              <td className="px-5 py-4 font-mono font-semibold whitespace-nowrap text-slate-500 dark:text-slate-400">
                                {tx.date}
                              </td>

                              {/* Category Badge Column */}
                              <td className="px-5 py-4 whitespace-nowrap">
                                <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase tracking-wider ${typeBadge}`}>
                                  {tx.category}
                                </span>
                              </td>

                              {/* Payment Method Column */}
                              <td className="px-5 py-4 whitespace-nowrap text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>{tx.paymentMethod}</span>
                              </td>

                              {/* Note description Column */}
                              <td className="px-5 py-4 max-w-[200px] truncate text-slate-600 dark:text-slate-300">
                                {tx.note || <span className="text-slate-300 dark:text-slate-600 italic">No note added</span>}
                              </td>

                              {/* Amount Column */}
                              <td className={`px-5 py-4 text-right font-mono font-bold whitespace-nowrap text-sm ${amountColor}`}>
                                {tx.type === 'income' || tx.type === 'borrowed' ? '+' : tx.type === 'investment' ? '▲' : '-'}
                                ₹{tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </td>

                              {/* Form edit/delete button Actions Column */}
                              <td className="px-5 py-4 text-center whitespace-nowrap">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingTransaction(tx);
                                      setIsAddOpen(true);
                                    }}
                                    className="p-1.5 hover:bg-slate-100 hover:text-slate-900 rounded-lg text-slate-400 transition-colors"
                                    title="Edit transaction"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTransaction(tx.id)}
                                    className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg text-slate-400 transition-colors"
                                    title="Delete record"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Ledger Footer Metrics */}
                <div className="bg-slate-50/70 dark:bg-slate-800/30 px-5 py-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    Filtered Page Sum:{' '}
                    <span className="font-mono font-bold text-indigo-500">
                      ₹{filteredTransactions.reduce((acc, tx) => acc + tx.amount, 0).toLocaleString('en-IN')}
                    </span>
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- TAB 3: WEALTH FORECAST / DEEP ANALYTICS --- */}
          {activeTab === 'analytics' && (
            <motion.div
              key="analytics-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* COMPOUND GROWTH ESTIMATOR WIDGET */}
              <WealthForecaster currentMonthlyInvestment={totals.investment} />

              {/* COMPARATIVE ANALYTICS PANEL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* SAVINGS RATE METRICS GAUGE */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    Liquid Savings Rate
                  </h3>
                  
                  {/* Gauge Math */}
                  {(() => {
                    const savingsRate = totals.income > 0 ? ((totals.income - totals.expense) / totals.income) * 100 : 0;
                    
                    let rating = 'Poor';
                    let ratingColor = 'text-rose-500';
                    let description = 'Your expenses consume nearly all of your monthly income. Consider auditing entertainment or shopping categories.';

                    if (savingsRate >= 50) {
                      rating = 'Superb (F.I.R.E. Speed)';
                      ratingColor = 'text-emerald-500';
                      description = 'Incredible! You are saving half of your cash flow. This maximizes financial freedom timelines.';
                    } else if (savingsRate >= 30) {
                      rating = 'Very Healthy';
                      ratingColor = 'text-cyan-500';
                      description = 'Solid cash preservation rate! This easily safeguards emergency funds and feeds wealth pools.';
                    } else if (savingsRate >= 15) {
                      rating = 'Balanced';
                      ratingColor = 'text-indigo-500';
                      description = 'Standard healthy rate. Try setting minor budget limits to nudge this past the 20% mark.';
                    }

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                             Preserved Cash-flow Rate
                          </span>
                          <span className={`text-xl font-black font-mono ${ratingColor}`}>
                            {savingsRate.toFixed(1)}%
                          </span>
                        </div>

                        {/* Visual percentage slider background */}
                        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              savingsRate >= 30
                                ? 'bg-emerald-500'
                                : savingsRate >= 15
                                ? 'bg-indigo-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                          />
                        </div>

                        <div className="bg-slate-50/50 dark:bg-slate-800/10 p-4 border border-slate-100/50 dark:border-slate-800/40 rounded-xl space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Rating Verdict
                          </span>
                          <span className={`text-sm font-extrabold ${ratingColor}`}>
                            {rating}
                          </span>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium pt-1">
                            {description}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* TRANSACTION FREQUENCY STATS */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                    Activity Diagnostics
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 dark:bg-slate-800/10 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Record Count
                      </span>
                      <span className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
                        {filteredTransactions.length}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Active in selected month
                      </p>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-800/10 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Average Ticket
                      </span>
                      <span className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
                        ₹
                        {filteredTransactions.length > 0
                          ? Math.round(
                              filteredTransactions.reduce((acc, t) => acc + t.amount, 0) /
                                filteredTransactions.length
                            ).toLocaleString('en-IN')
                          : 0}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Mean transaction volume
                      </p>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-800/10 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        Card vs Cash Ratio
                      </span>
                      <span className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
                        {(() => {
                          const cards = filteredTransactions.filter((t) => t.paymentMethod === 'Card').length;
                          const totalTx = filteredTransactions.length;
                          return totalTx > 0 ? `${Math.round((cards / totalTx) * 100)}%` : '0%';
                        })()}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Payments done via cards
                      </p>
                    </div>

                    <div className="bg-slate-50/50 dark:bg-slate-800/10 rounded-xl p-3 border border-slate-100 dark:border-slate-800/40">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        UPI/Instant Volume
                      </span>
                      <span className="text-lg font-black text-slate-700 dark:text-slate-300 font-mono">
                        {(() => {
                          const upiAmount = filteredTransactions
                            .filter((t) => t.paymentMethod === 'UPI')
                            .reduce((acc, t) => acc + t.amount, 0);
                          return `₹${Math.round(upiAmount).toLocaleString('en-IN')}`;
                        })()}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Total spent via QR/UPI apps
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* --- TAB 4: BUDGET MONITOR & CATEGORY LIMITS --- */}
          {activeTab === 'budgets' && (
            <motion.div
              key="budgets-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      Monthly Spending Budgets
                    </h3>
                    <p className="text-xs text-slate-400">
                      Setting limit safeguards for categories. View is synchronized for: {formatMonthName(selectedPeriod === 'all' ? '2026-07' : selectedPeriod)}
                    </p>
                  </div>
                </div>

                <BudgetMonitor
                  budgets={budgets}
                  onUpdateBudget={handleUpdateBudget}
                  categorySpending={categorySpendingMap}
                />
              </div>
            </motion.div>
          )}

          {/* --- TAB 5: SYSTEM DATA SETTINGS & BACKUPS --- */}
          {activeTab === 'settings' && (
            <motion.div
              key="settings-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto">
                <div className="pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    System Data & Backup Center
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manage your financial logs, perform backups, or wipe offline stores
                  </p>
                </div>

                {/* Import Status Alert banner */}
                {importStatus && (
                  <div className={`p-4 rounded-xl text-xs mb-6 border ${
                    importStatus.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    <p className="font-bold uppercase tracking-wider mb-1">
                      {importStatus.type === 'success' ? 'Success' : 'Import Error'}
                    </p>
                    <p>{importStatus.message}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Action 1: Export */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/10">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Export Backup File
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        Export your logged transactions and budgets as a portable `.json` file.
                      </p>
                    </div>
                    <button
                      onClick={handleExportData}
                      className="flex items-center gap-1.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export JSON</span>
                    </button>
                  </div>

                  {/* Action 2: Import */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/10">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Restore Backup File
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        Restore your financial ledger from a previously exported database JSON backup.
                      </p>
                    </div>
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportFileChange}
                        accept=".json"
                        className="hidden"
                      />
                      <button
                        onClick={handleImportClick}
                        className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Restore Backup</span>
                      </button>
                    </div>
                  </div>

                  {/* Action 3: Seed demo data */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/10">
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                        Seed 6-Month Demo Data
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        Overwrite the workspace with our curated 6-month transaction dataset to explore features instantly.
                      </p>
                    </div>
                    <button
                      onClick={handleResetToDemo}
                      className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Seed Demo Data</span>
                    </button>
                  </div>

                  {/* Action 4: Wipe completely */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-100 dark:border-rose-900/30 bg-rose-50/10">
                    <div>
                      <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Wipe Database Clean
                      </h4>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 leading-relaxed">
                        Completely wipe all stored transactions and custom category limits from the local cache.
                      </p>
                    </div>
                    <button
                      onClick={handleWipeData}
                      className="flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-sm transition-all shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Clear All Stores</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}



        </AnimatePresence>

      </main>

      {/* --- BOTTOM FOOTER INFO --- */}
      <footer className="px-8 py-4 bg-white border-t border-slate-200/60 text-[11px] text-slate-400 dark:bg-slate-900 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-2 shrink-0">
        <div>Financial Snapshot as of {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
        <div className="flex gap-4">
          <span>Local Persistence: <span className="text-emerald-500 font-bold uppercase">Active</span></span>
          <span>Cloud Sync: <span className={`font-bold uppercase ${currentUser ? 'text-emerald-500' : 'text-slate-400'}`}>{currentUser ? 'Enabled' : 'Disabled'}</span></span>
        </div>
      </footer>

      {/* --- ADD / EDIT TRANSACTION MODAL DIALOG --- */}
      <AnimatePresence>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Mask */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10"
            >
              {/* Floating Close Button */}
              <button
                onClick={() => setIsAddOpen(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6">
                <h3 className="text-lg font-black text-slate-800 dark:text-white">
                  {editingTransaction ? 'Edit Transaction Details' : 'Record New Transaction'}
                </h3>
                <p className="text-xs text-slate-400">
                  {editingTransaction ? 'Amend details for this logged entry' : 'Record an income, expense, or portfolio addition in seconds'}
                </p>
              </div>

              <TransactionForm
                onSave={handleSaveTransaction}
                onClose={() => setIsAddOpen(false)}
                editingTransaction={editingTransaction}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- FIREBASE AUTHENTICATION DIALOG (SIGNUP / SIGNIN) --- */}
      <AnimatePresence>
        {showAuthModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAuthModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mb-6 text-center">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-950/60 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  {authMode === 'signup' ? 'Create FinTrack Account' : 'Welcome Back to FinTrack'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {authMode === 'signup' 
                    ? 'Synchronize and backup your financial logs safely to Cloud Firestore' 
                    : 'Access your cloud-synced financial ledger from any device'}
                </p>
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-100 dark:shadow-none flex items-center justify-center gap-2 text-sm text-center"
                >
                  {isAuthLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                  ) : authMode === 'signup' ? (
                    'Register & Synchronize'
                  ) : (
                    'Authenticate Account'
                  )}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold text-[10px] tracking-wider">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isAuthLoading}
                onClick={handleGoogleSignIn}
                className="w-full border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-semibold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2.5 text-sm text-center shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                <span>Google Sign In</span>
              </button>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-400 font-medium">
                {authMode === 'signup' ? (
                  <p>
                    Already have an account?{' '}
                    <button
                      onClick={() => setAuthMode('signin')}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Sign In here
                    </button>
                  </p>
                ) : (
                  <p>
                    Don't have an account yet?{' '}
                    <button
                      onClick={() => setAuthMode('signup')}
                      className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                    >
                      Sign Up here (Safe & Secure)
                    </button>
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- ADMIN CONSOLE DIALOG --- */}
      <AnimatePresence>
        {showAdminModal && userRole === 'admin' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowAdminModal(false)}
                className="absolute top-5 right-5 p-1 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <ShieldAlert className="w-5.5 h-5.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Admin Management Dashboard</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    View system-wide telemetry, user accounts list, and active databases.
                  </p>
                </div>
                <button
                  onClick={fetchAdminData}
                  disabled={isAdminLoading}
                  className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-all shrink-0"
                >
                  <span>{isAdminLoading ? 'Refreshing...' : 'Refresh Logs'}</span>
                </button>
              </div>

              {isAdminLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-xs font-bold">Querying system records securely...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Visual stats bento boxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/10">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Registered Users</span>
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">{adminStats.totalUsers}</span>
                      <p className="text-[10px] text-slate-400 mt-1">Authenticated Firebase accounts</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/10">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Sync Transactions</span>
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">{adminStats.totalTransactions}</span>
                      <p className="text-[10px] text-slate-400 mt-1">Cloud stored logs</p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-indigo-50/20 dark:bg-indigo-950/10">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Stored Wealth Volume</span>
                      <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono mt-1 block">₹{adminStats.totalVolume.toLocaleString('en-IN')}</span>
                      <p className="text-[10px] text-slate-400 mt-1">Sum volume in database</p>
                    </div>
                  </div>

                  {/* Table of Users */}
                  <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                      <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">Registered System Accounts</h4>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
                        <thead className="bg-slate-50/70 dark:bg-slate-800/10 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800 text-[10px] uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3">User Email</th>
                            <th className="px-5 py-3">Account ID</th>
                            <th className="px-5 py-3">Access Role</th>
                            <th className="px-5 py-3">Created On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {adminUsers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center py-8 text-slate-400">No users found in database snapshot.</td>
                            </tr>
                          ) : (
                            adminUsers.map((usr) => (
                              <tr key={usr.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all">
                                <td className="px-5 py-4 font-semibold text-slate-700 dark:text-slate-300">{usr.email}</td>
                                <td className="px-5 py-4 font-mono text-[10px] text-slate-400">{usr.id}</td>
                                <td className="px-5 py-4">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${usr.role === 'admin' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    {usr.role || 'user'}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-slate-400 font-mono text-[10px]">{usr.createdAt ? new Date(usr.createdAt).toLocaleDateString() : 'N/A'}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
