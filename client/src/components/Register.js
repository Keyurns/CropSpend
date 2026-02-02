import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API } from '../config';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        department: 'General',
        role: 'employee'
    });
    const navigate = useNavigate();

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API.AUTH}/register`, formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role || 'employee');
            navigate('/dashboard');
        } catch (err) {
            console.error('Registration error', err);
            let msg = err.response?.data?.msg || err.response?.data?.message;
            if (!msg) {
                if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
                    msg = 'Cannot reach server. Make sure the backend is running.';
                } else {
                    msg = err.response?.status === 400
                        ? 'This email is already registered. Try logging in or use a different email.'
                        : 'Registration failed. Please try again.';
                }
            }
            alert(msg);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white tracking-tight">CorpSpend</h1>
                    <p className="text-slate-400 mt-1">Expense Management for Teams</p>
                </div>
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Create Account</h2>
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Username</label>
                            <input type="text" name="username" value={formData.username} onChange={onChange}
                                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Your name" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                            <input type="email" name="email" value={formData.email} onChange={onChange}
                                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="you@company.com" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
                            <select name="role" value={formData.role} onChange={onChange}
                                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                <option value="employee" className="bg-slate-800 text-white">Employee</option>
                                <option value="manager" className="bg-slate-800 text-white">Manager</option>
                                <option value="admin" className="bg-slate-800 text-white">Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                            <select name="department" value={formData.department} onChange={onChange}
                                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                                <option value="General" className="bg-slate-800">General</option>
                                <option value="IT" className="bg-slate-800">IT</option>
                                <option value="Sales" className="bg-slate-800">Sales</option>
                                <option value="Marketing" className="bg-slate-800">Marketing</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                            <input type="password" name="password" value={formData.password} onChange={onChange}
                                className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="••••••••" required />
                        </div>
                        <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition shadow-lg shadow-indigo-500/25">
                            Register
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-slate-400">
                        Already have an account? <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Login here</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
