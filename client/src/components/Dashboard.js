import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { API } from '../config';
import Tesseract from 'tesseract.js';
import { ThemeContext } from './ThemeContext'; 

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const Dashboard = () => {
    const [expenses, setExpenses] = useState([]);
    const [role, setRole] = useState('employee');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ title: '', originalAmount: '', currency: 'INR', category: 'Travel', date: '' });
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());
    const [receiptFile, setReceiptFile] = useState(null);
    const CATEGORIES = ['Travel', 'Food', 'Software', 'Equipment', 'Marketing', 'Other'];
    
    const { theme } = useContext(ThemeContext);
    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role') || 'employee';
    const storedUsername = localStorage.getItem('username') || 'User';
    const storedProfilePic = localStorage.getItem('profilePic');

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(API.EXPENSES, { headers: { 'x-auth-token': token } });
            setExpenses(res.data);
            setRole(storedRole);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const handleReceiptUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setReceiptFile(file); 

        const extractData = (text) => {
            const amountMatch = text.match(/[\d,]+\.\d{2}/);
            const dateMatch = text.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/);
            const formatScannedDate = (raw) => { try { return new Date(raw).toISOString().split('T')[0]; } catch { return ''; } };

            setNewExpense(prev => ({
                ...prev, 
                title: 'Uploaded Receipt',
                originalAmount: amountMatch ? amountMatch[0].replace(/,/g, '') : prev.originalAmount,
                date: dateMatch ? formatScannedDate(dateMatch[0]) : prev.date
            }));
            alert("File Processed! Please verify the details.");
        };

        if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                extractData(event.target.result); 
            };
            reader.readAsText(file);
            return; 
        }

        setIsScanning(true);
        try {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => { if (m.status === 'recognizing text') setScanProgress(Math.round(m.progress * 100)); }
            });
            extractData(result.data.text); 
        } catch (error) {
            console.error(error);
            alert("Could not read receipt image. Please check the image clarity.");
        } finally { 
            setIsScanning(false); 
            setScanProgress(0); 
        }
    };

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.title || !newExpense.originalAmount) return;
        
        const formData = new FormData();
        formData.append('title', newExpense.title);
        formData.append('originalAmount', Number(newExpense.originalAmount));
        formData.append('currency', newExpense.currency);
        formData.append('category', newExpense.category);
        formData.append('date', newExpense.date || new Date().toISOString());
        
        if (receiptFile) {
            formData.append('receipt', receiptFile);
        }
    
        try {
            await axios.post(API.EXPENSES, formData, { 
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'x-auth-token': token 
                } 
            });

            setShowAddModal(false);
            setNewExpense({ title: '', originalAmount: '', currency: 'INR', category: 'Travel', date: '' });
            setReceiptFile(null);
            fetchExpenses();
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to add expense');
        }
    };

    const handleApprove = async (id) => {
        try { 
            await axios.put(`${API.EXPENSES}/approve/${id}`, { status: 'Approved' }, { headers: { 'x-auth-token': token } }); 
            fetchExpenses(); 
        } catch (err) { alert('Failed to approve'); }
    };

    const handleReject = async () => {
        try { 
            await axios.put(`${API.EXPENSES}/approve/${rejectModal}`, { status: 'Rejected', rejectionReason: rejectReason }, { headers: { 'x-auth-token': token } }); 
            setRejectModal(null); 
            setRejectReason(''); 
            fetchExpenses(); 
        } catch (err) { alert('Failed to reject'); }
    };

    const currentFormattedDate = currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const currentFormattedTime = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const isManagerOrAdmin = storedRole === 'manager' || storedRole === 'admin';
    const validExpenses = expenses.filter(e => e.status !== 'Rejected');
    const totalSpend = validExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const pendingCount = expenses.filter(e => e.status === 'Pending').length;
    const totalBudget = 11110865; 
    const remainingBudget = totalBudget > totalSpend ? totalBudget - totalSpend : 0;

    const getBarChartData = () => {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const last6Months = []; const dataMap = new Map();
        const d = new Date(); d.setDate(1);
        for (let i = 5; i >= 0; i--) {
            const pastDate = new Date(d.getFullYear(), d.getMonth() - i, 1);
            const key = `${pastDate.getFullYear()}-${pastDate.getMonth()}`;
            last6Months.push({ key, label: monthNames[pastDate.getMonth()] });
            dataMap.set(key, 0);
        }
        validExpenses.forEach(e => {
            const eDate = new Date(e.date);
            const key = `${eDate.getFullYear()}-${eDate.getMonth()}`;
            if (dataMap.has(key)) dataMap.set(key, dataMap.get(key) + (e.amount || 0));
        });
        return {
            labels: last6Months.map(m => m.label),
            datasets: [{
                label: 'Spending', data: last6Months.map(m => dataMap.get(m.key)),
                backgroundColor: (c) => c.dataIndex === 5 ? '#5B58FF' : (theme === 'dark' ? '#334155' : '#CBD5E1'),
                borderRadius: 4, barThickness: 30,
            }]
        };
    };

    const getDoughnutData = () => {
        const categoryTotals = {}; CATEGORIES.forEach(c => categoryTotals[c] = 0);
        validExpenses.forEach(e => { categoryTotals[e.category] !== undefined ? categoryTotals[e.category] += (e.amount || 0) : categoryTotals['Other'] += (e.amount || 0); });
        return {
            labels: CATEGORIES,
            datasets: [{
                data: CATEGORIES.map(c => categoryTotals[c]),
                backgroundColor: ['#5B58FF', '#818CF8', '#A5B4FC', '#C7D2FE', '#E0E7FF', theme === 'dark' ? '#334155' : '#F1F5F9'],
                borderWidth: 0, hoverOffset: 4
            }]
        };
    };

    const formatINR = (amount) => new Intl.NumberFormat('en-IN').format(amount);
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="flex h-screen bg-[#F8F9FA] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
            <Sidebar page="dashboard" />
            <div className="flex-1 overflow-auto flex flex-col">
                
                {/* --- REFINED STICKY HEADER --- */}
                <div className="px-8 py-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-20 transition-colors">
                    <div className="flex items-center gap-4">
                        {/* PROFILE PICTURE WITH FALLBACK */}
                        <div className="relative group">
                            {storedProfilePic ? (
                                <img 
                                    src={storedProfilePic} 
                                    alt="Profile" 
                                    className="w-12 h-12 rounded-full object-cover border-2 border-[#5B58FF]/20 group-hover:border-[#5B58FF] transition-all cursor-pointer shadow-sm" 
                                    onClick={() => window.location.href = '/profile'}
                                />
                            ) : (
                                <div 
                                    className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 border-2 border-transparent group-hover:border-[#5B58FF] transition-all cursor-pointer shadow-sm"
                                    onClick={() => window.location.href = '/profile'}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                </div>
                            )}
                            {/* Online Status Dot */}
                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
                        </div>

                        <div>
                            <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                                Welcome back, {storedUsername} 
                            </h1>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${
                                    storedRole === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 
                                    storedRole === 'manager' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 
                                    'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-500'
                                }`}>
                                    {storedRole}
                                </span>
                                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">• {currentFormattedDate} • {currentFormattedTime}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setShowAddModal(true)} className="px-5 py-2.5 bg-[#5B58FF] hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                        + New Expense
                    </button>
                </div>

                <main className="px-8 pb-8 flex-1 mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center transition-colors">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">Total Spent (All Time)</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">₹ {formatINR(totalSpend)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center transition-colors">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">Remaining Budget</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">₹ {formatINR(remainingBudget)}</p>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col justify-center transition-colors">
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mb-2">Pending Approvals</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">{pendingCount} Expenses</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 h-80">
                        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col transition-colors">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-6">Spending Trends (Last 6 Months)</h2>
                            <div className="flex-1 w-full"><Bar data={getBarChartData()} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, border: { display: false }, ticks: { color: theme === 'dark' ? '#94A3B8' : '#64748B' } }, y: { display: false, grid: { display: false } } } }} /></div>
                        </div>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center relative transition-colors">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white absolute top-6 left-6 w-full">Spending by Category</h2>
                            <div className="relative w-48 h-48 mt-8">
                                <Doughnut data={getDoughnutData()} options={{ responsive: true, maintainAspectRatio: false, cutout: '75%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` ₹ ${formatINR(c.raw)}` } } } }} />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><span className="font-bold text-slate-900 dark:text-white text-sm">₹ {(totalSpend / 10000000).toFixed(2)} Cr</span></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden mb-8 transition-colors">
                        <div className="px-6 py-5 border-b border-slate-50 dark:border-slate-800/50"><h2 className="text-sm font-semibold text-slate-900 dark:text-white">Recent Transactions</h2></div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="text-slate-500 dark:text-slate-400">
                                        <th className="px-6 py-4 font-semibold border-r border-slate-200 dark:border-slate-800">Date</th>
                                        <th className="px-6 py-4 font-semibold border-r border-slate-200 dark:border-slate-800">Employee</th>
                                        <th className="px-6 py-4 font-semibold border-r border-slate-200 dark:border-slate-800">Merchant</th>
                                        <th className="px-6 py-4 font-semibold border-r border-slate-200 dark:border-slate-800">Amount</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        {isManagerOrAdmin && <th className="px-6 py-4 font-semibold text-center">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.length === 0 && <tr><td colSpan={isManagerOrAdmin ? 6 : 5} className="px-6 py-8 text-center text-slate-400">No recent transactions.</td></tr>}
                                    {expenses.map((expense) => (
                                        <tr key={expense._id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">{formatDate(expense.date)}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">{expense.requestedBy?.username?.toUpperCase() || 'UNKNOWN'}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 border-r border-slate-200 dark:border-slate-800">{expense.title}</td>
                                            <td className="px-6 py-4 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">₹ {formatINR(expense.amount)}</span>
                                                    {expense.currency !== 'INR' && <span className="text-[10px] text-slate-400 font-semibold mt-0.5">({expense.originalAmount} {expense.currency})</span>}
                                                    {expense.isFlagged && isManagerOrAdmin && <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/50 w-max" title={expense.flagReason}>⚠️ ANOMALY</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded text-xs font-bold ${expense.status === 'Approved' ? 'bg-[#E6F4EA] dark:bg-green-900/30 text-[#1E8E3E] dark:text-green-400' : expense.status === 'Pending' ? 'bg-[#FFF8E1] dark:bg-yellow-900/30 text-[#F9A825] dark:text-yellow-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>{expense.status}</span></td>
                                            {isManagerOrAdmin && (
                                                <td className="px-6 py-4 flex justify-center gap-4">
                                                    {expense.status === 'Pending' ? (
                                                        <><button onClick={() => handleApprove(expense._id)} className="text-xs text-green-600 dark:text-green-400 font-semibold hover:underline">Approve</button><button onClick={() => setRejectModal(expense._id)} className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline">Reject</button></>
                                                    ) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>
            
            {showAddModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 transition-colors" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Add New Expense</h3>
                        
                        <div className="mb-4 p-4 border-2 border-dashed border-[#5B58FF]/30 rounded-xl bg-[#5B58FF]/5 text-center hover:bg-[#5B58FF]/10 transition">
                            <label className="cursor-pointer flex flex-col items-center">
                                <span className="text-sm font-medium text-[#5B58FF]">
                                    {isScanning ? `Scanning Receipt... ${scanProgress}%` : "Smart Scan Receipt (OCR & TXT)"}
                                </span>
                                <input 
                                    type="file" 
                                    accept="image/*,.txt" 
                                    className="hidden" 
                                    onChange={handleReceiptUpload} 
                                    disabled={isScanning} 
                                />
                            </label>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Merchant</label>
                                <input type="text" value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg outline-none" required />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount</label><input type="number" step="any" value={newExpense.originalAmount} onChange={e => setNewExpense({ ...newExpense, originalAmount: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg outline-none" required /></div>
                                <div className="w-1/3"><label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label><select value={newExpense.currency} onChange={e => setNewExpense({ ...newExpense, currency: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg outline-none"><option value="INR">₹ INR</option><option value="USD">$ USD</option><option value="EUR">€ EUR</option></select></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date</label>
                                <input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg outline-none">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 py-2 bg-[#5B58FF] hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50" disabled={isScanning}>Submit</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {rejectModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 transition-colors">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Reject expense</h3>
                        <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg mb-6 outline-none" placeholder="Reason for rejection..." />
                        <div className="flex gap-3">
                            <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium rounded-lg">Cancel</button>
                            <button onClick={handleReject} className="flex-1 py-2 bg-red-600 text-white font-medium rounded-lg">Confirm</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;