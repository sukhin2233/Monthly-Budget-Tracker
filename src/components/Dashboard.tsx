import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, PieChart, AlertCircle, CheckCircle2, Lightbulb, Target, Plus, Trash2, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_DATA } from '@/src/constants';
import { BudgetEntry } from '@/src/types';

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
  const [entries, setEntries] = useState<BudgetEntry[]>(INITIAL_DATA);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    productName: '',
    amount: '',
    teamMember: 'Sukhin',
    type: 'Total' as 'Advanced' | 'Total'
  });

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

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName || !formData.amount) return;

    const newEntry: BudgetEntry = {
      id: Math.random().toString(36).substr(2, 9),
      date: formData.date,
      productName: formData.productName,
      amount: parseFloat(formData.amount),
      teamMember: formData.teamMember,
      type: formData.type
    };

    setEntries([newEntry, ...entries]);
    setFormData({
      ...formData,
      productName: '',
      amount: ''
    });
  };

  const removeEntry = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
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
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                Add New Budget Entry
              </CardTitle>
              <CardDescription>Enter the details of the new marketing expenditure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddEntry} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
                      Add
                    </Button>
                  </div>
                </div>
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
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeEntry(entry.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
                      <Tooltip 
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
                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                          <div 
                            className="h-full bg-slate-400" 
                            style={{ width: `${(prev.total / Math.max(prev.total, currentTotal)) * 100}%` }} 
                          />
                          <div 
                            className={`h-full ${isIncrease ? 'bg-indigo-500' : 'bg-emerald-500'}`} 
                            style={{ width: `${(Math.abs(diff) / Math.max(prev.total, currentTotal)) * 100}%` }} 
                          />
                        </div>
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

