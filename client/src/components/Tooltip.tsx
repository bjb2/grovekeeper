import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  content: React.ReactNode;
  children: React.ReactElement;
}

const isTouchDevice = () =>
  typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

export function Tooltip({ content, children }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [touchVisible, setTouchVisible] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Dismiss touch tooltip when tapping outside
  useEffect(() => {
    if (!touchVisible) return;
    const dismiss = (e: TouchEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setTouchVisible(false);
      }
    };
    document.addEventListener('touchstart', dismiss, { passive: true });
    return () => document.removeEventListener('touchstart', dismiss);
  }, [touchVisible]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isTouchDevice()) return;
    e.stopPropagation();
    const touch = e.changedTouches[0];
    if (touch) {
      setPos({ x: touch.clientX, y: touch.clientY });
    }
    setTouchVisible(v => !v);
  }, []);

  const showTooltip = pos != null || touchVisible;
  const tooltipPos = pos ?? { x: 0, y: 0 };

  return (
    <div
      ref={wrapperRef}
      style={{ display: 'contents' }}
      onMouseEnter={(e) => { if (!isTouchDevice()) setPos({ x: e.clientX, y: e.clientY }); }}
      onMouseMove={(e) => { if (!isTouchDevice()) setPos({ x: e.clientX, y: e.clientY }); }}
      onMouseLeave={() => { if (!isTouchDevice()) setPos(null); }}
      onTouchEnd={handleTouchEnd}
    >
      {children}
      {showTooltip && createPortal(
        <div style={{
          position: 'fixed',
          left: tooltipPos.x > window.innerWidth - 310 ? tooltipPos.x - 14 : tooltipPos.x + 14,
          top: Math.min(tooltipPos.y - 8, window.innerHeight - 300),
          transform: tooltipPos.x > window.innerWidth - 310 ? 'translateX(-100%)' : 'none',
          zIndex: 9999,
          background: '#0a1a0a',
          border: '1px solid #2d4a2d',
          borderRadius: 8,
          padding: '10px 14px',
          maxWidth: 290,
          pointerEvents: 'none',
          fontFamily: 'Crimson Text, serif',
          boxShadow: '0 4px 24px #00000099',
          fontSize: 13,
          color: '#c4e8c4',
          lineHeight: 1.5,
        }}>
          {content}
        </div>,
        document.body
      )}
    </div>
  );
}
