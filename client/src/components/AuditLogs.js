import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { API } from '../config';
import { ThemeContext } from './ThemeContext';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const { theme } = useContext(ThemeContext);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await axios.get(API.AUDIT_LOGS, {
                    headers: { 'x-auth-token': token }
                });
                setLogs(res.data);
            } catch (err) {
                console.error(err);
                setError('Failed to load audit logs or unauthorized access.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchLogs();
    }, [token]);

    const formatDateTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="flex h-screen bg-[#F8F9FA] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
            <Sidebar page="audit" />
            
            <div className="flex-1 overflow-auto flex flex-col">
                <div className="px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">System Audit Logs</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                            Immutable record of all critical administrative actions. (Admin Only)
                        </p>
                    </div>
                </div>

                <main className="px-8 pb-8 flex-1 flex flex-col">
                    {error ? (
                        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800/50">
                            {error}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 overflow-hidden transition-colors flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800/50 flex justify-between items-center">
                                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Action History <span className="text-slate-400 font-normal ml-2">({logs.length} events)</span></h2>
                            </div>
                            
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/50 dark:bg-slate-900 sticky top-0">
                                        <tr className="text-slate-500 dark:text-slate-400">
                                            <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Timestamp</th>
                                            <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Action Taken</th>
                                            <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Performed By</th>
                                            <th className="px-6 py-4 font-semibold border-b border-r border-slate-100 dark:border-slate-800">Target Record ID</th>
                                            <th className="px-6 py-4 font-semibold border-b border-slate-100 dark:border-slate-800">System Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading && <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">Loading secure logs...</td></tr>}
                                        {!isLoading && logs.length === 0 && <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400">No system actions recorded yet.</td></tr>}
                                        {logs.map((log) => (
                                            <tr key={log._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                                                    {formatDateTime(log.createdAt)}
                                                </td>
                                                <td className="px-6 py-4 border-r border-slate-100 dark:border-slate-800 whitespace-nowrap">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${log.action.includes('APPROVED') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 border-r border-slate-100 dark:border-slate-800">
                                                    <div className="font-semibold text-slate-900 dark:text-white">{log.performedBy?.username || 'System Admin'}</div>
                                                    <div className="text-xs text-slate-500">{log.performedBy?.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400 border-r border-slate-100 dark:border-slate-800">
                                                    {log.targetEntityId}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap">
                                                    {JSON.stringify(log.details, null, 2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AuditLogs;