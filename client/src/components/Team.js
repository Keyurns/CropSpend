import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { API } from '../config';

const Team = () => {
    const [users, setUsers] = useState([]);
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await axios.get(`${API.AUTH}/users`, {
                    headers: { 'x-auth-token': token }
                });
                setUsers(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchUsers();
    }, []);

    const byRole = (role) => users.filter(u => u.role === role);
    const roles = [
        { key: 'admin', label: 'Admins', color: 'bg-violet-100 text-violet-800' },
        { key: 'manager', label: 'Managers', color: 'bg-indigo-100 text-indigo-800' },
        { key: 'employee', label: 'Employees', color: 'bg-slate-100 text-slate-800' }
    ];

    return (
        <div className="flex h-screen bg-slate-100">
            <Sidebar page="team" />
            <div className="flex-1 overflow-auto">
                <div className="bg-white border-b border-slate-200 px-8 py-6 shadow-sm">
                    <h1 className="text-2xl font-bold text-slate-900">Team</h1>
                    <p className="text-slate-500 mt-0.5">View your organization members and roles</p>
                </div>
                <div className="p-8">
                    <div className="grid gap-8">
                        {roles.map(({ key, label, color }) => (
                            <div key={key} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
                                    <h2 className="text-lg font-semibold text-slate-900">{label}</h2>
                                    <p className="text-sm text-slate-500 mt-0.5">{byRole(key).length} member(s)</p>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {byRole(key).length === 0 && (
                                        <div className="px-6 py-8 text-center text-slate-500 text-sm">No members in this role</div>
                                    )}
                                    {byRole(key).map((user) => (
                                        <div key={user._id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                                                    {(user.username || user.email || '?').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-900">{user.username || '—'}</p>
                                                    <p className="text-sm text-slate-500">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${color}`}>{user.role}</span>
                                                <span className="text-sm text-slate-500">{user.department || '—'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Team;
