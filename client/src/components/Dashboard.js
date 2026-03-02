import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { API } from '../config';
import Tesseract from 'tesseract.js'; 

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CATEGORIES = ['Travel', 'Food', 'Software', 'Equipment', 'Marketing', 'Other'];

const Dashboard = () => {
    const [expenses, setExpenses] = useState([]);
    const [role, setRole] = useState('employee');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newExpense, setNewExpense] = useState({ 
        title: '', 
        originalAmount: '', 
        currency: 'INR', 
        category: 'Travel',
        date: '' 
    });
    
    const [isScanning, setIsScanning] = useState(false);
    const [scanProgress, setScanProgress] = useState(0);

    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const token = localStorage.getItem('token');
    const storedRole = localStorage.getItem('role');

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(API.EXPENSES, {
                headers: { 'x-auth-token': token }
            });
            setExpenses(res.data);
            setRole(storedRole || 'employee');
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    // NEW: The OCR Scan Function
    const handleReceiptUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsScanning(true);

        try {
            const result = await Tesseract.recognize(file, 'eng', {
                logger: m => {
                    if (m.status === 'recognizing text') {
                        setScanProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const scannedText = result.data.text;
            
            // Regex to find price and date
            const amountRegex = /[\d,]+\.\d{2}/; 
            const amountMatch = scannedText.match(amountRegex);
            const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/;
            const dateMatch = scannedText.match(dateRegex);

            const formatScannedDate = (rawDate) => {
                try {
                    return new Date(rawDate).toISOString().split('T')[0];
                } catch { return ''; }
            };

            setNewExpense(prev => ({
                ...prev,
                title: 'Scanned Receipt',
                originalAmount: amountMatch ? amountMatch[0].replace(/,/g, '') : prev.originalAmount,
                date: dateMatch ? formatScannedDate(dateMatch[0]) : prev.date
            }));

            alert("Scan Complete! Please verify the extracted amounts.");
        } catch (error) {
            console.error("OCR Error:", error);
            alert("Could not read receipt. Please enter manually.");
        } finally {
            setIsScanning(false);
            setScanProgress(0);
        }
    };

    // UPDATED: Sending originalAmount and currency to backend
    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!newExpense.title || !newExpense.originalAmount) return;
        try {
            await axios.post(API.EXPENSES, {
                title: newExpense.title,
                originalAmount: Number(newExpense.originalAmount),
                currency: newExpense.currency,
                category: newExpense.category,
                date: newExpense.date || new Date()
            }, { headers: { 'x-auth-token': token } });
            
            setShowAddModal(false);
            setNewExpense({ title: '', originalAmount: '', currency: 'INR', category: 'Travel', date: '' });
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
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to approve');
        }
    };

    const handleReject = async () => {
        if (!rejectModal) return;
        try {
            await axios.put(`${API.EXPENSES}/approve/${rejectModal}`, { status: 'Rejected', rejectionReason: rejectReason }, { headers: { 'x-auth-token': token } });
            setRejectModal(null);
            setRejectReason('');
            fetchExpenses();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to reject');
        }
    };

    const totalSpend = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
    const pendingCount = expenses.filter(e => e.status === 'Pending').length;
    const approvedCount = expenses.filter(e => e.status === 'Approved').length;

    const chartData = {
        labels: expenses.slice(0, 8).map(e => e.title?.slice(0, 12) || 'Expense'),
        datasets: [{
            label: 'Amount (₹)',
            data: expenses.slice(0, 8).map(e => e.amount),
            backgroundColor: 'rgba(99, 102, 241, 0.7)',
            borderColor: 'rgb(99, 102, 241)',
            borderWidth: 1
        }]
    };

    const isManagerOrAdmin = role === 'manager' || role === 'admin';

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar page="dashboard" />
            <div className="flex-1 overflow-auto">
                {/* Header Section */}
                <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                            <p className="text-slate-500 mt-0.5">Overview of expenses and requests</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 capitalize">{role}</span>
                            <button onClick={() => setShowAddModal(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition">
                                + Add Expense
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats & Charts */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium">Total Spend (INR Base)</p>
                            <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalSpend.toLocaleString()}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium">Pending</p>
                            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <p className="text-slate-500 text-sm font-medium">Approved</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">{approvedCount}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Expenses by request</h2>
                        </div>
                        <div className="h-72 p-4">
                            <Bar data={chartData} options={{ maintainAspectRatio: false, responsive: true }} />
                        </div>
                    </div>

                    {/* Expenses Table */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900">Expense Requests</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="px-6 py-3 font-semibold text-slate-700">Description</th>
                                        {isManagerOrAdmin && <th className="px-6 py-3 font-semibold text-slate-700">Requested by</th>}
                                        <th className="px-6 py-3 font-semibold text-slate-700">Category</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700">Amount (Converted)</th>
                                        <th className="px-6 py-3 font-semibold text-slate-700">Status</th>
                                        {isManagerOrAdmin && <th className="px-6 py-3 font-semibold text-slate-700">Actions</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {expenses.length === 0 && (
                                        <tr><td colSpan={isManagerOrAdmin ? 6 : 4} className="px-6 py-8 text-center text-slate-500">No expenses yet. Add one with the button above.</td></tr>
                                    )}
                                    {expenses.map((expense) => (
                                        <tr key={expense._id} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 font-medium text-slate-900">
                                                {expense.title}
                                                {/* NEW: Display original currency context if it exists */}
                                                {expense.currency && expense.currency !== 'INR' && (
                                                    <div className="text-xs text-slate-500 font-normal">
                                                        Originally {expense.originalAmount} {expense.currency}
                                                    </div>
                                                )}
                                            </td>
                                            {isManagerOrAdmin && (
                                                <td className="px-6 py-4 text-slate-600">
                                                    {expense.requestedBy?.username || '—'} {expense.requestedBy?.department && <span className="text-slate-400">({expense.requestedBy.department})</span>}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 text-slate-600">{expense.category}</td>
                                            
                                            <td className="px-6 py-4 font-medium text-slate-900 flex flex-col items-start">
                                                ₹{Number(expense.amount).toLocaleString()}
                                                {/* NEW: AI Fraud Flag Badge */}
                                                {expense.isFlagged && isManagerOrAdmin && (
                                                    <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200" title={expense.flagReason}>
                                                        ⚠️ FLAG: ANOMALY
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold
                                                    ${expense.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                                                      expense.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                                                    {expense.status}
                                                </span>
                                                {expense.status === 'Rejected' && expense.rejectionReason && (
                                                    <p className="text-xs text-slate-500 mt-1">{expense.rejectionReason}</p>
                                                )}
                                            </td>
                                            {isManagerOrAdmin && expense.status === 'Pending' && (
                                                <td className="px-6 py-4 flex gap-2">
                                                    <button onClick={() => handleApprove(expense._id)} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg">Approve</button>
                                                    <button onClick={() => setRejectModal(expense._id)} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg">Reject</button>
                                                </td>
                                            )}
                                            {isManagerOrAdmin && expense.status !== 'Pending' && <td className="px-6 py-4">—</td>}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ADD EXPENSE MODAL - UPDATED WITH OCR & CURRENCY */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 mb-4">Add New Expense</h3>
                        
                        {/* NEW: Smart Scan UI */}
                        <div className="mb-4 p-4 border-2 border-dashed border-indigo-200 rounded-lg bg-indigo-50 text-center hover:bg-indigo-100 transition">
                            <label className="cursor-pointer flex flex-col items-center">
                                <svg className="w-8 h-8 text-indigo-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                <span className="text-sm font-medium text-indigo-700">
                                    {isScanning ? `Scanning Receipt... ${scanProgress}%` : "Smart Scan Receipt (OCR)"}
                                </span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} disabled={isScanning} />
                            </label>
                        </div>

                        <form onSubmit={handleAddExpense} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <input type="text" value={newExpense.title} onChange={e => setNewExpense({ ...newExpense, title: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="e.g. Client Dinner" required />
                            </div>
                            
                            {/* UPDATED: Currency & Amount Flexbox */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Amount</label>
                                    <input type="number" min="1" step="any" value={newExpense.originalAmount} onChange={e => setNewExpense({ ...newExpense, originalAmount: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="0.00" required />
                                </div>
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                                    <select value={newExpense.currency} onChange={e => setNewExpense({ ...newExpense, currency: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50">
                                        <option value="INR">₹ INR</option>
                                        <option value="USD">$ USD</option>
                                        <option value="EUR">€ EUR</option>
                                        <option value="GBP">£ GBP</option>
                                        <option value="AED">د.إ AED</option>
                                    </select>
                                </div>
                            </div>

                            {/* NEW: Date input for OCR to fill */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                                <input type="date" value={newExpense.date} onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                <select value={newExpense.category} onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg disabled:opacity-50" disabled={isScanning}>Submit</button>
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Reject expense</h3>
                        <p className="text-sm text-slate-500 mb-4">Optionally add a reason (visible to the employee).</p>
                        <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4" placeholder="Reason for rejection" />
                        <div className="flex gap-2">
                            <button onClick={handleReject} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg">Reject</button>
                            <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="px-4 py-2 border border-slate-300 rounded-lg">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;