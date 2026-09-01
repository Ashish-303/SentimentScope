import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function PageTransition({ children }) {
  const location = useLocation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(false);
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (noMotion) {
      setShow(true);
      return;
    }
    const t = setTimeout(() => setShow(true), 20);
    return () => clearTimeout(t);
  }, [location.pathname]);

  return (
    <div
      style={{
        opacity: show ? 1 : 0,
        transform: show ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 250ms ease-out, transform 250ms ease-out',
        minHeight: '100%',
      }}
    >
      {children}
    </div>
  );
}
