import React, { useState, useContext } from 'react';
import axios from 'axios';
import { API } from '../config';
import { ThemeContext } from './ThemeContext';

// Define the standard departments for the dropdown
const DEPARTMENTS = [
    'Employee',
    'Human Resources',
    'Finance & Accounting',
    'Marketing',
    'Sales',
    'Operations',
    'Legal',
    'Other'
];

const Register = () => {
    // Note: department now defaults to the first item in the array
    const [formData, setFormData] = useState({ username: '', email: '', password: '', department: DEPARTMENTS[0] });
    const [idProofFile, setIdProofFile] = useState(null); 
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { theme, toggleTheme } = useContext(ThemeContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        
        if (!idProofFile) {
            return setError("You must upload an ID proof to request an account.");
        }

        setIsLoading(true);

        const submitData = new FormData();
        submitData.append('username', formData.username);
        submitData.append('email', formData.email);
        submitData.append('password', formData.password);
        submitData.append('department', formData.department);
        submitData.append('idProof', idProofFile); 

        try {
            const res = await axios.post(API.REGISTER, submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSuccess(res.data.msg || 'Request submitted! Please wait for Admin approval.');
            // Reset form back to default
            setFormData({ username: '', email: '', password: '', department: DEPARTMENTS[0] });
            setIdProofFile(null);
        } catch (err) {
            setError(err.response?.data?.msg || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-slate-950 flex flex-col justify-center items-center p-4 font-sans transition-colors duration-200">
            
            <button onClick={toggleTheme} className="absolute top-6 right-6 p-2 rounded-full bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
                {theme === 'light' ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>}
            </button>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 max-w-md w-full p-8 transition-colors">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Access</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Submit your details and ID proof for admin verification.</p>

                {error && <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 text-red-600 dark:text-red-400 text-sm rounded-lg text-center font-medium">{error}</div>}
                {success && <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/50 text-green-600 dark:text-green-400 text-sm rounded-lg text-center font-medium">{success}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                        <input type="text" required value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Email</label>
                        <input type="email" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Password</label>
                        <input type="password" required value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500" />
                    </div>
                    
                    {/* --- UPDATED DEPARTMENT DROPDOWN --- */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                        <select 
                            required 
                            value={formData.department} 
                            onChange={e => setFormData({ ...formData, department: e.target.value })} 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-slate-900 dark:text-white"
                        >
                            {DEPARTMENTS.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Upload ID Proof (Company ID / Govt ID)</label>
                        <input 
                            type="file" 
                            required 
                            accept="image/*,.pdf" 
                            onChange={e => setIdProofFile(e.target.files[0])} 
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#5B58FF]/10 file:text-[#5B58FF] hover:file:bg-[#5B58FF]/20" 
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="w-full py-2.5 mt-4 bg-[#5B58FF] hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-70">
                        {isLoading ? 'Submitting Request...' : 'Request Account'}
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    Already have an active account? <a href="/login" className="font-semibold text-[#5B58FF] hover:underline">Sign In</a>
                </p>
            </div>
        </div>
    );
};

export default Register;