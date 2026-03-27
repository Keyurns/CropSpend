import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import Sidebar from './Sidebar';
import { API } from '../config';
import { ThemeContext } from './ThemeContext';

const Profile = () => {
    const { theme } = useContext(ThemeContext);
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null); // 👈 For the real-time preview
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    // Create a preview URL whenever the file changes
    useEffect(() => {
        if (!file) {
            setPreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        // Clean up memory when component unmounts or file changes
        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData();
        formData.append('username', username);
        if (file) formData.append('profilePic', file);

        try {
            const res = await axios.put(API.PROFILE, formData, {
                headers: { 'x-auth-token': token, 'Content-Type': 'multipart/form-data' }
            });
            localStorage.setItem('username', res.data.username);
            localStorage.setItem('profilePic', res.data.profilePicUrl);
            setMessage("Profile updated successfully! ✅");
        } catch (err) {
            setMessage("Error updating profile. ❌");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-screen bg-[#F8F9FA] dark:bg-slate-950 transition-colors">
            <Sidebar page="profile" />
            <div className="flex-1 p-8 flex flex-col items-center justify-center">
                <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                    <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Profile Settings</h2>
                    <p className="text-sm text-slate-500 mb-6">Manage your public identity and account details.</p>
                    
                    {message && <p className="mb-4 p-3 bg-[#5B58FF]/10 text-[#5B58FF] rounded-lg text-sm font-bold text-center">{message}</p>}

                    <form onSubmit={handleUpdate} className="space-y-6">
                        {/* --- IMAGE PREVIEW SECTION --- */}
                        <div className="flex flex-col items-center justify-center mb-2">
                            <div className="relative w-24 h-24 mb-4">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-24 h-24 rounded-full object-cover border-4 border-[#5B58FF]/20" />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-300 dark:border-slate-700">
                                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                )}
                            </div>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={(e) => setFile(e.target.files[0])}
                                className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#5B58FF]/10 file:text-[#5B58FF] hover:file:bg-[#5B58FF]/20 transition-colors cursor-pointer"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Username</label>
                            <input 
                                type="text" 
                                value={username} 
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-[#5B58FF]/50 transition-all"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Account Role</label>
                                <div className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 text-slate-400 text-xs font-bold uppercase tracking-widest">{role}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Verification</label>
                                <div className="px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-bold uppercase tracking-widest">Verified ✅</div>
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full py-3 bg-[#5B58FF] text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all disabled:opacity-50"
                        >
                            {loading ? "Saving Changes..." : "Save Profile"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Profile;