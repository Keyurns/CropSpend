import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { API } from '../config';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const EXPENSES_API = API.EXPENSES;

const Reports = () => {
    const [expenses, setExpenses] = useState([]);
    const [emailModal, setEmailModal] = useState(false);
    const [emailTo, setEmailTo] = useState('');
    const [emailSending, setEmailSending] = useState(false);
    const [emailMessage, setEmailMessage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const token = localStorage.getItem('token');
    const headers = { 'x-auth-token': token };

    const fetchExpenses = async () => {
        try {
            const res = await axios.get(EXPENSES_API, { headers });
            setExpenses(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleDownloadCsv = async () => {
        try {
            const res = await axios.get(`${EXPENSES_API}/export/csv`, { headers, responseType: 'blob' });
            const url = window.URL.createObjectURL(res.data);
            const link = document.createElement('a');
            link.href = url;
            const disposition = res.headers['content-disposition'];
            const match = disposition && disposition.match(/filename="?([^"]+)"?/);
            link.setAttribute('download', match ? match[1].trim() : `expense-report-${new Date().toISOString().slice(0, 10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            const msg = err.response?.data instanceof Blob ? 'Failed to download CSV' : (err.response?.data?.msg || 'Failed to download CSV');
            alert(msg);
        }
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!emailTo.trim()) return;
        setEmailSending(true);
        setEmailMessage(null);
        setPreviewUrl(null);
        try {
            const res = await axios.post(`${EXPENSES_API}/send-report`, { email: emailTo.trim() }, { headers });
            setEmailMessage({ type: 'success', text: res.data.msg });
            if (res.data.previewUrl) {
                setPreviewUrl(res.data.previewUrl);
            } else {
                setEmailTo('');
                setTimeout(() => { setEmailModal(false); setEmailMessage(null); }, 2000);
            }
        } catch (err) {
            setEmailMessage({ type: 'error', text: err.response?.data?.msg || 'Failed to send email' });
        } finally {
            setEmailSending(false);
        }
    };

    const byCategory = expenses.reduce((acc, e) => {
        const c = e.category || 'Other';
        acc[c] = (acc[c] || 0) + Number(e.amount);
        return acc;
    }, {});

    const byStatus = expenses.reduce((acc, e) => {
        const s = e.status || 'Pending';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const total = expenses.reduce((acc, e) => acc + Number(e.amount || 0), 0);
    const categoryLabels = Object.keys(byCategory);
    const categoryValues = Object.values(byCategory);
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

    const doughnutData = {
        labels: categoryLabels,
        datasets: [{
            data: categoryValues,
            backgroundColor: colors.slice(0, categoryLabels.length),
            borderWidth: 0
        }]
    };

    const statusData = {
        labels: ['Pending', 'Approved', 'Rejected'],
        datasets: [{
            label: 'Count',
            data: [byStatus.Pending || 0, byStatus.Approved || 0, byStatus.Rejected || 0],
            backgroundColor: ['#f59e0b', '#10b981', '#ef4444']
        }]
    };

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar page="reports" />
            <div className="flex-1 overflow-auto">
                <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
                            <p className="text-slate-500 mt-0.5">Expense analytics and summaries</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleDownloadCsv} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg shadow-sm transition flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Download CSV
                            </button>
                            <button onClick={() => { setEmailModal(true); setEmailMessage(null); setEmailTo(''); setPreviewUrl(null); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm transition flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Email report
                            </button>
                        </div>
                    </div>
                </div>
                <div className="p-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Spend by category</h2>
                            <div className="h-64 flex items-center justify-center">
                                {categoryLabels.length > 0 ? (
                                    <Doughnut data={doughnutData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                                ) : (
                                    <p className="text-slate-500">No expense data yet</p>
                                )}
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-slate-900 mb-4">Requests by status</h2>
                            <div className="h-64 flex items-center justify-center">
                                {expenses.length > 0 ? (
                                    <Bar data={statusData} options={{ indexAxis: 'y', maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }} />
                                ) : (
                                    <p className="text-slate-500">No expense data yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200">
                            <h2 className="text-lg font-semibold text-slate-900">Summary</h2>
                        </div>
                        <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-slate-50 rounded-lg">
                                <p className="text-sm text-slate-500">Total amount</p>
                                <p className="text-xl font-bold text-slate-900">₹{total.toLocaleString()}</p>
                            </div>
                            <div className="p-4 bg-amber-50 rounded-lg">
                                <p className="text-sm text-slate-500">Pending</p>
                                <p className="text-xl font-bold text-amber-700">{byStatus.Pending || 0}</p>
                            </div>
                            <div className="p-4 bg-emerald-50 rounded-lg">
                                <p className="text-sm text-slate-500">Approved</p>
                                <p className="text-xl font-bold text-emerald-700">{byStatus.Approved || 0}</p>
                            </div>
                            <div className="p-4 bg-red-50 rounded-lg">
                                <p className="text-sm text-slate-500">Rejected</p>
                                <p className="text-xl font-bold text-red-700">{byStatus.Rejected || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {emailModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !emailSending && setEmailModal(false)}>
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Email expense report</h3>
                        <p className="text-sm text-slate-500 mb-4">Send the current expense report as a formatted email to the address below.</p>
                        <form onSubmit={handleSendEmail} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Recipient email</label>
                                <input type="email" value={emailTo} onChange={e => setEmailTo(e.target.value)} placeholder="colleague@company.com"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent" required disabled={emailSending} />
                            </div>
                            {emailMessage && (
                                <div className={`text-sm ${emailMessage.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                                    <p>{emailMessage.text}</p>
                                    {previewUrl && (
                                        <a href={previewUrl} target="_blank" rel="noopener noreferrer" 
                                           className="inline-block mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
                                            View Email Preview →
                                        </a>
                                    )}
                                </div>
                            )}
                            <div className="flex gap-2">
                                <button type="submit" disabled={emailSending} className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium rounded-lg">
                                    {emailSending ? 'Sending…' : 'Send'}
                                </button>
                                <button type="button" onClick={() => !emailSending && setEmailModal(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50" disabled={emailSending}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
