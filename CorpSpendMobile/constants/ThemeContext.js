import React, { createContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const colorScheme = Appearance.getColorScheme(); // Detects phone system setting
    const [theme, setTheme] = useState(colorScheme || 'light');

    const toggleTheme = () => {
        setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
    };

    const colors = {
        primary: '#5B58FF',
        bg: theme === 'light' ? '#F8F9FA' : '#020617',
        card: theme === 'light' ? '#FFFFFF' : '#0F172A',
        text: theme === 'light' ? '#0F172A' : '#F8F9FA',
        subtext: theme === 'light' ? '#64748B' : '#94A3B8',
        border: theme === 'light' ? '#F1F5F9' : '#1E293B',
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
            {children}
        </ThemeContext.Provider>
    );
};