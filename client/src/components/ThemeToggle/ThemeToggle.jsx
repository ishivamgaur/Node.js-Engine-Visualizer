export default function ThemeToggle({ theme, toggleTheme }) {
  const isLight = theme === 'light';
  
  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary border border-border-subtle hover:border-neon-cyan/50 hover:bg-bg-panel-hover transition-all duration-300 group"
      aria-label="Toggle Theme"
      title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      <div className="relative w-4 h-4 overflow-hidden">
        {/* Sun Icon (slides up and in when light mode) */}
        <span 
          className="absolute inset-0 flex items-center justify-center text-[12px] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{ 
            transform: isLight ? 'translateY(0) scale(1)' : 'translateY(150%) scale(0.5)',
            opacity: isLight ? 1 : 0 
          }}
        >
          ☀️
        </span>
        
        {/* Moon Icon (slides down and out when light mode) */}
        <span 
          className="absolute inset-0 flex items-center justify-center text-[12px] transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] text-neon-cyan"
          style={{ 
            transform: isLight ? 'translateY(-150%) scale(0.5)' : 'translateY(0) scale(1)',
            opacity: isLight ? 0 : 1 
          }}
        >
          🌙
        </span>
      </div>
      
      {/* Background glow effect on hover */}
      <div 
        className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          boxShadow: isLight ? '0 0 12px rgba(234, 179, 8, 0.3)' : '0 0 12px rgba(0, 212, 255, 0.3)'
        }}
      />
    </button>
  );
}
