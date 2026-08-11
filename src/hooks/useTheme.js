import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState('dark'); // Default to dark initially before effect runs

  useEffect(() => {
    // 1. Check localStorage first
    const savedTheme = localStorage.getItem('visualizer-theme');
    
    // 2. Check system preference if nothing saved
    const prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
    
    // 3. Determine initial theme
    const initialTheme = savedTheme ? savedTheme : (prefersLight ? 'light' : 'dark');
    
    setTheme(initialTheme);
  }, []);

  // Sync theme changes to the DOM and localStorage
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    
    localStorage.setItem('visualizer-theme', theme);
  }, [theme]);

  // Listen for system theme changes if user hasn't explicitly set a preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    
    const handleChange = (e) => {
      // Only auto-switch if the user hasn't manually overridden it in localStorage recently
      // For simplicity, we just sync if it changes, but a more robust app might check localStorage timestamp
      setTheme(e.matches ? 'light' : 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, toggleTheme };
}

