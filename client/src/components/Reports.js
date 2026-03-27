import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { API } from '../config';
import { ThemeContext } from './ThemeContext';

const Reports = () => {
    const [expenses, setExpenses] = useState([]);
    const [filter, setFilter] = useState('All'); 
    const [isExporting, setIsExporting] = useState(false);
    
    // --- NEW MODAL STATES ---
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [isEmailing, setIsEmailing] = useState(false);

    const { theme } = useContext(ThemeContext);
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') || 'employee';

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(API.EXPENSES, { headers: { 'x-auth-token': token } });
            setExpenses(res.data);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const filteredExpenses = expenses.filter(expense => {
        if (filter === 'All') return true;
        if (filter === 'Flagged') return expense.isFlagged === true;
        return expense.status === filter;
    });

    const generateCSVString = () => {
        const headers = ['Date', 'Employee', 'Department', 'Merchant/Description', 'Category', 'Original Amount', 'Currency', 'Base Amount (INR)', 'Status', 'AI Flagged', 'Flag Reason'];
        const csvData = filteredExpenses.map(e => [
            new Date(e.date).toLocaleDateString('en-GB'),
            e.requestedBy?.username || 'Unknown',
            e.requestedBy?.department || 'N/A',
            e.title, e.category, e.originalAmount, e.currency, e.amount, e.status,
            e.isFlagged ? 'YES' : 'NO', e.flagReason || ''
        ]);
        return [headers.join(','), ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    };

    const handleDownloadCSV = () => {
        setIsExporting(true);
        const csvContent = generateCSVString();
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `CROPSPEND_Report_${filter}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setIsExporting(false);
    };

    // --- UPDATED: Email Report Function ---
    const handleEmailReport = async (e) => {
        e.preventDefault();
        if (!recipientEmail) return;
        
        setIsEmailing(true);
        try {
            const csvContent = generateCSVString();
            await axios.post(`${API.EXPENSES}/email-report`, {
                csvData: csvContent,
                filterName: filter,
                recipientEmail: recipientEmail // Pass the destination address
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setShowEmailModal(false);
            setRecipientEmail('');
            alert(`Report successfully sent to ${recipientEmail}!`);
        } catch (err) {
            console.error(err);
            alert('Failed to send email report. Please try again.');
        } finally {
            setIsEmailing(false);
        }
    };

    const formatINR = (amount) => new Intl.NumberFormat('en-IN').format(amount);
    const formatDate = (date) => date ? new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

    const FilterButton = ({ label }) => {
        const isActive = filter === label;
        return (
            <button onClick={() => setFilter(label)} className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${isActive ? 'bg-[#5B58FF] text-white shadow-sm' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                {label}
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-[#F8F9FA] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
            <Sidebar page="reports" />
            
            <div className="flex-1 overflow-auto flex flex-col">
                <div className="px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reports & Analytics</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">Review transaction history and export compliance data.</p>
                    </div>

                    <div className="flex gap-3">
                        {/* Changed this button to open the modal instead of instantly firing */}
                        <button onClick={() => setShowEmailModal(true)} disabled={filteredExpenses.length === 0} className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-[#5B58FF] dark:hover:border-[#5B58FF] text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group">
                            <svg className="w-4 h-4 text-slate-400 group-hover:text-[#5B58FF] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                            Email Report
                        </button>
                        
                        <button onClick={handleDownloadCSV} disabled={isExporting || filteredExpenses.length === 0} className="px-4 py-2.5 bg-[#5B58FF] hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            {isExporting ? 'Downloading...' : 'Download CSV'}
                        </button>
                    </div>
                </div>

                <main className="px-8 pb-8 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-2 mb-6">
                        <FilterButton label="All" />
                        <FilterButton label="Pending" />
                        <FilterButton label="Approved" />
                        <FilterButton label="Rejected" />
                        {(role === 'manager' || role === 'admin') && <FilterButton label="Flagged" />}
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 overflow-hidden transition-colors flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Transaction Data <span className="text-slate-400 font-normal ml-2">({filteredExpenses.length} records)</span></h2>
                        </div>
                        
                        <div className="overflow-x-auto flex-1">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50/50 dark:bg-slate-900 sticky top-0">
                                    <tr className="text-slate-500 dark:text-slate-400">
                                        <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Date</th>
                                        <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Employee</th>
                                        <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Merchant</th>
                                        <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Category</th>
                                        <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Amount</th>
                                        <th className="px-6 py-4 font-semibold border-b border-slate-100 dark:border-slate-800">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredExpenses.length === 0 && <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400">No records found for this filter.</td></tr>}
                                    {filteredExpenses.map((expense) => (
                                        <tr key={expense._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">{formatDate(expense.date)}</td>
                                            <td className="px-6 py-4 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                                                <div className="text-slate-700 dark:text-slate-300 font-medium">{expense.requestedBy?.username?.toUpperCase() || 'UNKNOWN'}</div>
                                                <div className="text-xs text-slate-400">{expense.requestedBy?.department || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">{expense.title}</td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">{expense.category}</td>
                                            <td className="px-6 py-4 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">₹ {formatINR(expense.amount)}</span>
                                                    {expense.currency !== 'INR' && <span className="text-[10px] text-slate-400 font-semibold mt-0.5">({expense.originalAmount} {expense.currency})</span>}
                                                    {expense.isFlagged && (role === 'manager' || role === 'admin') && <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded border border-red-200 dark:border-red-800/50 w-max" title={expense.flagReason}>⚠️ ANOMALY</div>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4"><span className={`inline-flex px-3 py-1 rounded text-xs font-bold ${expense.status === 'Approved' ? 'bg-[#E6F4EA] dark:bg-green-900/30 text-[#1E8E3E] dark:text-green-400' : expense.status === 'Pending' ? 'bg-[#FFF8E1] dark:bg-yellow-900/30 text-[#F9A825] dark:text-yellow-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>{expense.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </main>
            </div>

            {/* --- NEW EMAIL MODAL --- */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowEmailModal(false)}>
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 transition-colors" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">Send Report via Email</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">This will generate a CSV file for the "{filter}" filter and send it to the address below.</p>
                        
                        <form onSubmit={handleEmailReport}>
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Recipient Email Address</label>
                                <input 
                                    type="email" 
                                    required 
                                    value={recipientEmail} 
                                    onChange={e => setRecipientEmail(e.target.value)} 
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#5B58FF] outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
                                    placeholder="e.g. accounting@company.com" 
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setShowEmailModal(false)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button>
                                <button type="submit" disabled={isEmailing} className="flex-1 py-2.5 bg-[#5B58FF] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                                    {isEmailing ? 'Sending...' : 'Send Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;