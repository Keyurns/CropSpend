import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { API } from '../config';
import { ThemeContext } from './ThemeContext';

const Team = () => {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const { theme } = useContext(ThemeContext);
    const token = localStorage.getItem('token');
    const currentUserRole = localStorage.getItem('role') || 'employee';
    const isAdmin = currentUserRole === 'admin';

    const fetchUsers = async () => {
        try {
            // If admin, hit the secure admin route to see EVERYONE (including pending)
            // If normal user, you would hit a standard directory route (assuming you have one, or just hide the table)
            if (isAdmin) {
                const res = await axios.get(API.ADMIN_USERS, { headers: { 'x-auth-token': token } });
                setUsers(res.data);
            }
        } catch (err) { console.error(err); } 
        finally { setIsLoading(false); }
    };

    useEffect(() => { fetchUsers(); }, []);

    // --- ADMIN ACTIONS ---
    const handleStatusChange = async (userId, newStatus) => {
        if (!window.confirm(`Are you sure you want to mark this account as ${newStatus}?`)) return;
        try {
            await axios.put(`${API.ADMIN_USERS}/${userId}/status`, { status: newStatus }, { headers: { 'x-auth-token': token } });
            fetchUsers(); // Refresh list
        } catch (err) { alert(err.response?.data?.msg || "Failed to update status"); }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (!window.confirm(`Change this user's role to ${newRole.toUpperCase()}?`)) return;
        try {
            await axios.put(`${API.ADMIN_USERS}/${userId}/role`, { role: newRole }, { headers: { 'x-auth-token': token } });
            fetchUsers();
        } catch (err) { alert(err.response?.data?.msg || "Failed to change role"); }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm("WARNING: This will permanently delete this user. Proceed?")) return;
        try {
            await axios.delete(`${API.ADMIN_USERS}/${userId}`, { headers: { 'x-auth-token': token } });
            fetchUsers();
        } catch (err) { alert(err.response?.data?.msg || "Failed to delete user"); }
    };

    return (
        <div className="flex h-screen bg-[#F8F9FA] dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-200">
            <Sidebar page="team" />
            
            <div className="flex-1 overflow-auto flex flex-col">
                <div className="px-8 py-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Team Management</h1>
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                            {isAdmin ? "Manage user access, verify identities, and assign system roles." : "Company directory."}
                        </p>
                    </div>
                </div>

                <main className="px-8 pb-8 flex-1 flex flex-col">
                    {!isAdmin ? (
                        <div className="p-12 text-center text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                            You must be an Administrator to view or manage the team directory.
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 overflow-hidden transition-colors flex flex-col">
                            <div className="overflow-x-auto flex-1">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50/50 dark:bg-slate-900 sticky top-0">
                                        <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                            <th className="px-6 py-4 font-semibold">Employee</th>
                                            <th className="px-6 py-4 font-semibold">Department</th>
                                            <th className="px-6 py-4 font-semibold">ID Proof</th>
                                            <th className="px-6 py-4 font-semibold">Account Status</th>
                                            <th className="px-6 py-4 font-semibold">System Role</th>
                                            <th className="px-6 py-4 font-semibold text-right">Admin Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading && <tr><td colSpan="6" className="px-6 py-12 text-center">Loading users...</td></tr>}
                                        {users.map((user) => (
                                            <tr key={user._id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-900 dark:text-white">{user.username}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{user.department}</td>
                                                <td className="px-6 py-4">
                                                    {user.idProofUrl ? (
                                                        <a href={user.idProofUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#5B58FF] hover:underline flex items-center gap-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                                            View ID
                                                        </a>
                                                    ) : <span className="text-xs text-slate-400">No File</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'Active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : user.status === 'Pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select 
                                                        value={user.role} 
                                                        onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                                        className="text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded px-2 py-1 outline-none font-semibold"
                                                    >
                                                        <option value="employee">Employee</option>
                                                        <option value="manager">Manager</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                                    {user.status === 'Pending' && (
                                                        <>
                                                            <button onClick={() => handleStatusChange(user._id, 'Active')} className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded transition-colors">Approve</button>
                                                            <button onClick={() => handleStatusChange(user._id, 'Rejected')} className="px-3 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs font-semibold rounded transition-colors">Reject</button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleDelete(user._id)} className="px-2 py-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" title="Delete User">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
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

export default Team;