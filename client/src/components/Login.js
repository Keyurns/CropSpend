import React, { useState, useContext } from 'react';
import axios from 'axios';
import { API } from '../config';
import { ThemeContext } from './ThemeContext';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { theme, toggleTheme } = useContext(ThemeContext);

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(API.LOGIN, { email, password });
            
            
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role); 
            localStorage.setItem('username', res.data.username); 
            localStorage.setItem('profilePic', res.data.profilePicUrl || '');
    
            
            window.location.href = '/dashboard';
        } catch (err) {
            alert("Invalid credentials");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const res = await axios.post(API.LOGIN, formData); 
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('role', res.data.role || 'employee');
            localStorage.setItem('username', res.data.username);
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 flex flex-col justify-center items-center p-4 font-sans text-slate-800 transition-colors duration-200 relative">
            <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                {theme === 'light' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
            </button>

            <div className="mb-8 flex items-center gap-2">
                <svg className="w-10 h-10 text-[#5B58FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                <div>
                    <span className="text-3xl font-extrabold text-[#1E1E2F] dark:text-white tracking-tight block leading-none">CROPSPEND</span>
                    <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Enterprise Expense</span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-md w-full p-8 transition-colors duration-200">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome back</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Please enter your details to sign in.</p>

                {error && <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm rounded-lg font-medium text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Work Email</label>
                        <input 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={e => setFormData({ ...formData, email: e.target.value })} 
                            /* ADDED: text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 */
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#5B58FF] outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
                            placeholder="name@company.com" 
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                            <a href="#" className="text-xs font-semibold text-[#5B58FF] hover:underline">Forgot password?</a>
                        </div>
                        <input 
                            type="password" 
                            required 
                            value={formData.password} 
                            onChange={e => setFormData({ ...formData, password: e.target.value })} 
                            /* ADDED: text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 */
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#5B58FF] outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" 
                            placeholder="••••••••" 
                        />
                    </div>
                    <button type="submit" disabled={isLoading} className="w-full py-2.5 mt-2 bg-[#5B58FF] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70">
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
                    Don't have an account? <a href="/register" className="font-semibold text-[#5B58FF] hover:underline">Request access</a>
                </p>
            </div>
        </div>
    );
};
export default Login;