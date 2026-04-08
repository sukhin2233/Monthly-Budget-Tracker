import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, PieChart, AlertCircle, CheckCircle2, Lightbulb, Target, Plus, Trash2, Download, Pencil, X, LogOut, LogIn, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_DATA } from '@/src/constants';
import { BudgetEntry } from '@/src/types';
import { useAuth } from '../lib/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-xl border border-slate-100 min-w-[200px]">
        <p className="text-sm font-bold text-slate-900 mb-3 border-b border-slate-50 pb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500" />
              <span className="text-xs text-slate-500">Total Spent</span>
            </div>
            <span className="text-sm font-bold text-indigo-600">{data.totalSpent.toLocaleString()} Tk</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300" />
              <span className="text-xs text-slate-500">Entry Count</span>
            </div>
            <span className="text-sm font-bold text-slate-700">{data.entryCount} items</span>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-slate-50 pt-2 mt-1">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Avg. per Item</span>
            <span className="text-xs font-bold text-slate-900">
              {(data.totalSpent / data.entryCount).toFixed(0)} Tk
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const PREVIOUS_MONTH_DATA = [
  { name: 'Sukhin', total: 250 },
  { name: 'Supon', total: 310 },
];

export default function Dashboard() {
  const { user, login, loginWithPhone, logout, loading, isAdmin } = useAuth();
  const [entries, setEntries] = useState<BudgetEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productName: '',
    amount: '',
    teamMember: 'Sukhin',
    type: 'Total' as 'Advanced' | 'Total'
  });

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const path = 'budgetEntries';
    const q = isAdmin 
      ? query(collection(db, path), orderBy('date', 'desc'))
      : query(collection(db, path), where('userId', '==', user.uid), orderBy('date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedEntries = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BudgetEntry[];
      setEntries(fetchedEntries);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    return unsubscribe;
  }, [user, isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    const handlePhoneSignIn = async () => {
      if (!phoneNumber) return;
      setIsVerifying(true);
      setError(null);
      try {
        const result = await loginWithPhone(phoneNumber, 'recaptcha-container');
        setConfirmationResult(result);
      } catch (err: any) {
        console.error("Phone sign-in failed", err);
        setError(err.message || "Failed to send verification code. Make sure the phone number is correct and includes country code (e.g., +1).");
      } finally {
        setIsVerifying(false);
      }
    };

    const handleVerifyCode = async () => {
      if (!verificationCode || !confirmationResult) return;
      setIsVerifying(true);
      setError(null);
      try {
        await confirmationResult.confirm(verificationCode);
      } catch (err: any) {
        console.error("Code verification failed", err);
        setError(err.message || "Invalid verification code.");
      } finally {
        setIsVerifying(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <Card className="max-w-md w-full border-none shadow-xl bg-white">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
              <DollarSign className="w-8 h-8 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Market Budget Tracker</CardTitle>
            <CardDescription>Sign in to manage and track your marketing expenditures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={login} className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-lg">
              <LogIn className="w-5 h-5 mr-2" />
              Sign in with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with phone</span>
              </div>
            </div>

            {!confirmationResult ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="+1234567890" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handlePhoneSignIn} 
                  disabled={!phoneNumber || isVerifying}
                  variant="outline"
                  className="w-full h-12"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  {isVerifying ? 'Sending...' : 'Send Verification Code'}
                </Button>
                <div id="recaptcha-container"></div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input 
                    id="code" 
                    type="text" 
                    placeholder="123456" 
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                  />
                </div>
                <Button 
                  onClick={handleVerifyCode} 
                  disabled={!verificationCode || isVerifying}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isVerifying ? 'Verifying...' : 'Verify Code'}
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setConfirmationResult(null)}
                  className="w-full text-xs text-slate-500"
                >
                  Change phone number
                </Button>
              </div>
            )}
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalSpent = entries.reduce((acc, curr) => acc + curr.amount, 0);
  
  const teamStats: Record<string, { total: number, count: number }> = {};
  entries.forEach(curr => {
    if (!teamStats[curr.teamMember]) {
      teamStats[curr.teamMember] = { total: 0, count: 0 };
    }
    teamStats[curr.teamMember].total += curr.amount;
    teamStats[curr.teamMember].count += 1;
  });

  const teamNames = Object.keys(teamStats);
  const chartData = teamNames.map(name => ({
    name,
    totalSpent: teamStats[name].total,
    entryCount: teamStats[name].count,
  }));

  let highestSpenderName = 'N/A';
  let highestSpenderAmount = 0;

  if (teamNames.length > 0) {
    const highest = teamNames.reduce((a, b) => teamStats[a].total > teamStats[b].total ? a : b);
    highestSpenderName = highest;
    highestSpenderAmount = teamStats[highest].total;
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    const amount = parseFloat(formData.amount);

    if (!formData.productName.trim()) {
      setError('Product name is required');
      return;
    }
    if (!formData.teamMember) {
      setError('Team member is required');
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      setError('Amount must be a positive number');
      return;
    }

    const path = 'budgetEntries';
    try {
      if (editingId) {
        const docRef = doc(db, path, editingId);
        await updateDoc(docRef, {
          ...formData,
          productName: formData.productName.trim(),
          amount
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, path), {
          ...formData,
          productName: formData.productName.trim(),
          amount,
          userId: user.uid,
          createdAt: serverTimestamp()
        });
      }

      setFormData({
        ...formData,
        productName: '',
        amount: ''
      });
    } catch (err) {
      handleFirestoreError(err, editingId ? OperationType.UPDATE : OperationType.CREATE, path);
    }
  };

  const editEntry = (entry: BudgetEntry) => {
    setFormData({
      date: entry.date,
      productName: entry.productName,
      amount: entry.amount.toString(),
      teamMember: entry.teamMember,
      type: entry.type
    });
    setEditingId(entry.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      ...formData,
      productName: '',
      amount: ''
    });
  };

  const removeEntry = async (id: string) => {
    const path = 'budgetEntries';
    try {
      await deleteDoc(doc(db, path, id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Product Name', 'Team Member', 'Type', 'Amount (Tk)'];
    const csvRows = entries.map(entry => [
      entry.date,
      `"${entry.productName.replace(/"/g, '""')}"`,
      entry.teamMember,
      entry.type,
      entry.amount
    ].join(','));

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `market_budget_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-6 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tight text-slate-900"
            >
              Monthly Market Budget Report
            </motion.h1>
            <p className="text-slate-500 mt-1">Financial Analysis & Performance Dashboard • April 2026</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 mr-4 px-3 py-1.5 bg-white rounded-full shadow-sm border border-slate-100">
              <img src={user.photoURL || ''} alt="" className="w-6 h-6 rounded-full" />
              <span className="text-sm font-medium text-slate-700">{user.displayName}</span>
              <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-slate-400 hover:text-red-500">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              className="flex items-center gap-2 border-slate-200 bg-white shadow-sm hover:bg-slate-50"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Badge variant="outline" className="px-3 py-1 text-sm font-medium border-slate-200 bg-white shadow-sm">
              Status: Active
            </Badge>
            <Badge className="px-3 py-1 text-sm font-medium bg-indigo-600 hover:bg-indigo-700">
              Q2 FY26
            </Badge>
          </div>
        </header>

        {/* Entry Form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className={`border-none shadow-sm transition-colors duration-300 ${editingId ? 'bg-indigo-50/50 ring-2 ring-indigo-500/20' : 'bg-white'}`}>
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editingId ? <Pencil className="w-5 h-5 text-indigo-500" /> : <Plus className="w-5 h-5 text-indigo-500" />}
                  {editingId ? 'Edit Budget Entry' : 'Add New Budget Entry'}
                </div>
                {editingId && (
                  <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-slate-500 hover:text-slate-900">
                    <X className="w-4 h-4 mr-1" /> Cancel Edit
                  </Button>
                )}
              </CardTitle>
              <CardDescription>
                {editingId ? 'Modify the details of the selected expenditure.' : 'Enter the details of the new marketing expenditure.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEntry} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product">Product Name</Label>
                    <Input 
                      id="product" 
                      placeholder="e.g. Facebook Ads" 
                      value={formData.productName}
                      onChange={(e) => setFormData({...formData, productName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount (Tk)</Label>
                    <Input 
                      id="amount" 
                      type="number" 
                      placeholder="0.00" 
                      step="0.01"
                      min="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Team Member</Label>
                    <Select 
                      value={formData.teamMember} 
                      onValueChange={(value) => setFormData({...formData, teamMember: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sukhin">Sukhin</SelectItem>
                        <SelectItem value="Supon">Supon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <div className="flex gap-2">
                      <Select 
                        value={formData.type} 
                        onValueChange={(value: 'Advanced' | 'Total') => setFormData({...formData, type: value})}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Total">Total</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                        {editingId ? 'Update' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <AnimatePresence>
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 text-red-500 text-sm font-medium bg-red-50 p-2 rounded-lg border border-red-100"
                    >
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Executive Summary */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="border-none shadow-sm bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                  <DollarSign className="w-4 h-4" /> Total Expenditure
                </CardDescription>
                <CardTitle className="text-3xl font-bold">{totalSpent.toLocaleString()} Tk</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium">
                  <TrendingUp className="w-4 h-4" />
                  <span>Real-time tracking active</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card className="border-none shadow-sm bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                  <Users className="w-4 h-4" /> Active Members
                </CardDescription>
                <CardTitle className="text-3xl font-bold">{Object.keys(teamStats).length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-slate-400 text-sm">
                  {Object.keys(teamStats).join(', ') || 'No active members'}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <Card className="border-none shadow-sm bg-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-amber-500" />
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                  <PieChart className="w-4 h-4" /> Highest Spender
                </CardDescription>
                <CardTitle className="text-3xl font-bold">{highestSpenderName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-slate-400 text-sm">{highestSpenderAmount.toLocaleString()} Tk total contribution</div>
              </CardContent>
            </Card>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Spending Breakdown Table */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  Spending Breakdown
                </CardTitle>
                <CardDescription>Detailed list of all marketing expenditures for the current period.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="font-semibold text-slate-700">Date</TableHead>
                        <TableHead className="font-semibold text-slate-700">Product Name</TableHead>
                        <TableHead className="font-semibold text-slate-700">Team Member</TableHead>
                        <TableHead className="font-semibold text-slate-700">Type</TableHead>
                        <TableHead className="text-right font-semibold text-slate-700">Amount (Tk)</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence mode="popLayout">
                        {entries.map((entry) => (
                          <motion.tr 
                            key={entry.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="border-slate-50 hover:bg-slate-50/50 transition-colors group"
                          >
                            <TableCell className="font-mono text-sm text-slate-500">{entry.date}</TableCell>
                            <TableCell className="font-medium">{entry.productName}</TableCell>
                            <TableCell>{entry.teamMember}</TableCell>
                            <TableCell>
                              <Badge variant={entry.type === 'Advanced' ? 'secondary' : 'outline'} className="text-[10px] uppercase font-bold tracking-wider">
                                {entry.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-slate-900">{entry.amount.toLocaleString()} Tk</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => editEntry(entry)}
                                  className="text-slate-400 hover:text-indigo-500"
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => removeEntry(entry.id)}
                                  className="text-slate-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                      {entries.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                            No entries found. Add your first budget entry above.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Team Performance Chart */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ delay: 0.6 }}
          >
            <Card className="border-none shadow-sm bg-white h-full">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Team Performance
                </CardTitle>
                <CardDescription>Comparison of total spending by team member.</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748B', fontSize: 12 }}
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748B', fontSize: 12 }}
                      />
                      <RechartsTooltip 
                        cursor={{ fill: '#F8FAFC' }}
                        content={<CustomTooltip />}
                      />
                      <Bar dataKey="totalSpent" radius={[4, 4, 0, 0]} barSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === 0 ? '#6366F1' : '#818CF8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 italic">
                    No data to visualize
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Month-over-Month Comparison */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.65 }}
        >
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                Month-over-Month Comparison
              </CardTitle>
              <CardDescription>Comparing April 2026 performance against March 2026 benchmarks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {PREVIOUS_MONTH_DATA.map((prev) => {
                  const currentTotal = teamStats[prev.name]?.total || 0;
                  const diff = currentTotal - prev.total;
                  const percentChange = ((diff / prev.total) * 100).toFixed(1);
                  const isIncrease = diff > 0;

                  return (
                    <div key={prev.name} className="p-4 rounded-xl border border-slate-50 bg-slate-50/30 space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-slate-900">{prev.name}</h3>
                        <Badge variant={isIncrease ? "destructive" : "secondary"} className="font-mono">
                          {isIncrease ? '+' : ''}{percentChange}%
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">March (Prev)</p>
                          <p className="text-lg font-bold text-slate-600">{prev.total.toLocaleString()} Tk</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">April (Curr)</p>
                          <p className="text-lg font-bold text-slate-900">{currentTotal.toLocaleString()} Tk</p>
                        </div>
                      </div>

                      <div className="pt-2">
                        <Tooltip>
                          <TooltipTrigger>
                            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex cursor-help">
                              <div 
                                className="h-full bg-slate-400" 
                                style={{ width: `${(prev.total / Math.max(prev.total, currentTotal)) * 100}%` }} 
                              />
                              <div 
                                className={`h-full ${isIncrease ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${(Math.abs(diff) / Math.max(prev.total, currentTotal)) * 100}%` }} 
                              />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs font-bold">
                              {isIncrease ? '+' : ''}{percentChange}% variance
                            </p>
                          </TooltipContent>
                        </Tooltip>
                        <p className="text-[10px] mt-2 text-slate-500 italic">
                          {isIncrease 
                            ? `Spending increased by ${diff.toLocaleString()} Tk this month.` 
                            : `Spending decreased by ${Math.abs(diff).toLocaleString()} Tk this month.`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Insights Section - AIDA Framework */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.7 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold text-slate-900">Strategic Insights & AIDA Analysis</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Attention */}
            <Card className="border-none shadow-sm bg-indigo-50/50">
              <CardHeader className="pb-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mb-2">
                  <AlertCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <CardTitle className="text-lg font-bold text-indigo-900 uppercase tracking-tight">Attention</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-indigo-800/80 leading-relaxed">
                  Total spending has reached <span className="font-bold">{totalSpent.toLocaleString()} Tk</span>. {highestSpenderName !== 'N/A' ? `${highestSpenderName} currently leads expenditure at ${highestSpenderAmount.toLocaleString()} Tk.` : 'No expenditure data available yet.'}
                </p>
              </CardContent>
            </Card>

            {/* Interest */}
            <Card className="border-none shadow-sm bg-emerald-50/50">
              <CardHeader className="pb-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <CardTitle className="text-lg font-bold text-emerald-900 uppercase tracking-tight">Interest</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-emerald-800/80 leading-relaxed">
                  {entries.some(e => e.type === 'Advanced') 
                    ? `Advanced products account for ${Math.round((entries.filter(e => e.type === 'Advanced').length / entries.length) * 100)}% of total entries, indicating a strategic focus on high-tier resources.`
                    : "Currently, all spending is focused on 'Total' products. Consider diversifying into 'Advanced' categories for better strategic positioning."}
                </p>
              </CardContent>
            </Card>

            {/* Desire */}
            <Card className="border-none shadow-sm bg-amber-50/50">
              <CardHeader className="pb-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                  <Target className="w-5 h-5 text-amber-600" />
                </div>
                <CardTitle className="text-lg font-bold text-amber-900 uppercase tracking-tight">Desire</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-800/80 leading-relaxed">
                  To optimize ROI, we aim to balance spending across the team. Encouraging all members to utilize "Advanced" strategic products will mirror high-impact industry patterns.
                </p>
              </CardContent>
            </Card>

            {/* Action */}
            <Card className="border-none shadow-sm bg-slate-900">
              <CardHeader className="pb-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-lg font-bold text-white uppercase tracking-tight">Action</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Implement a <span className="font-bold text-white">15% budget buffer</span> for next month. Schedule a review meeting to align on "Advanced" product procurement strategies.
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Footer */}
        <footer className="pt-10 pb-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-400 text-sm">
          <p>© 2026 Financial Data Analysis Unit. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-indigo-500 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-500 transition-colors">Contact Support</a>
          </div>
        </footer>
      </div>
    </div>
  );
}

