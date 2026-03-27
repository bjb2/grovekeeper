import { useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  content: React.ReactNode;
  children: React.ReactElement;
}

export function Tooltip({ content, children }: Props) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  return (
    <div
      style={{ display: 'contents' }}
      onMouseEnter={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setPos(null)}
    >
      {children}
      {pos && createPortal(
        <div style={{
          position: 'fixed',
          left: pos.x > window.innerWidth - 310 ? pos.x - 14 : pos.x + 14,
          top: Math.min(pos.y - 8, window.innerHeight - 300),
          transform: pos.x > window.innerWidth - 310 ? 'translateX(-100%)' : 'none',
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
