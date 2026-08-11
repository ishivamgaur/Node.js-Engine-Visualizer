import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

export default function Tooltip({ text, children, icon = true, content, className = '' }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef(null);

  const handleEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ x: rect.left + rect.width / 2, y: rect.bottom + 8 });
    }
    setShow(true);
  };

  return (
    <div className={`relative flex items-center ${className}`} ref={ref} onMouseEnter={handleEnter} onMouseLeave={() => setShow(false)}>
      {children}
      {icon && <HelpCircle size={14} className="ml-1 text-text-muted hover:text-text-main cursor-help transition-colors" />}
      
      {show && createPortal(
        <div 
          className="fixed z-[99999] w-[240px] p-3 bg-bg-secondary border border-border-light shadow-2xl rounded-md text-[12px] leading-relaxed font-sans text-text-main pointer-events-none transform -translate-x-1/2 animate-fade-up"
          style={{ top: pos.y, left: pos.x }}
        >
          {content ? content : text}
        </div>,
        document.body
      )}
    </div>
  );
}
