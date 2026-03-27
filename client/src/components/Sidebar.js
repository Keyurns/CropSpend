import React, { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

const Sidebar = ({ page }) => {
    const { theme, toggleTheme } = useContext(ThemeContext);
    
    // Grab the user's role to determine if we show the Audit Logs link
    const role = localStorage.getItem('role'); 

    // Styles the active/inactive tabs based on the current page prop
    const navItemClass = (itemPage) => {
        const baseClass = "flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors mb-1 ";
        const activeClass = "bg-[#5B58FF]/10 text-[#5B58FF] dark:bg-[#5B58FF]/20 dark:text-blue-400";
        const inactiveClass = "text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white";
        return baseClass + (page === itemPage ? activeClass : inactiveClass);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('username'); // Clear username on logout too
        window.location.href = '/login';
    };

    return (
        <aside className="w-64 bg-white dark:bg-slate-900 flex flex-col border-r border-slate-100 dark:border-slate-800 z-10 transition-colors duration-200">
            <div className="px-6 py-8 flex items-center border-b border-transparent">
                <div className="flex items-center gap-2">
                    <svg className="w-8 h-8 text-[#5B58FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    <div>
                        <span className="text-xl font-extrabold text-[#1E1E2F] dark:text-white tracking-tight block leading-none">CROPSPEND</span>
                        <span className="text-[0.55rem] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Enterprise Expense</span>
                    </div>
                </div>
            </div>
            
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
                <p className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Menu</p>
                
                <a href="/dashboard" className={navItemClass('dashboard')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                    Dashboard
                </a>

                {/* --- NEW PROFILE LINK --- */}
                <a href="/profile" className={navItemClass('profile')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Profile
                </a>
                
                <a href="/reports" className={navItemClass('reports')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    Reports
                </a>
                
                <a href="/team" className={navItemClass('team')}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    Team
                </a>

                {/* Only Admin gets to see the Audit Logs */}
                {role === 'admin' && (
                    <a href="/audit" className={navItemClass('audit')}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        Audit Logs
                    </a>
                )}
            </nav>

            <div className="p-4 border-t border-slate-50 dark:border-slate-800 space-y-2">
                <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors font-medium">
                    {theme === 'light' ? (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg> Dark Mode</>
                    ) : (
                        <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg> Light Mode</>
                    )}
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;