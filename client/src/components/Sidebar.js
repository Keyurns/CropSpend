import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = ({ page = 'dashboard' }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const linkClass = (p) =>
        `block px-4 py-3 rounded-lg text-sm font-medium transition ${page === p ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`;

    return (
        <div className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0">
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-xl font-bold text-white tracking-tight">CorpSpend</h1>
                <p className="text-xs text-slate-400 mt-0.5">Expense Management</p>
            </div>
            <nav className="flex-1 p-4 space-y-1">
                <Link to="/dashboard" className={linkClass('dashboard')}>Dashboard</Link>
                <Link to="/reports" className={linkClass('reports')}>Reports</Link>
                <Link to="/team" className={linkClass('team')}>Team</Link>
            </nav>
            <div className="p-4 border-t border-slate-800">
                <button onClick={handleLogout} className="w-full text-left px-4 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white text-sm font-medium transition">
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
