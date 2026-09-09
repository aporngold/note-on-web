import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ViewportPortalProps {
  children: React.ReactNode;
}

export default function ViewportPortal({ children }: ViewportPortalProps) {
  // Check if we are already in the browser DOM environment
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined' && typeof document !== 'undefined');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined' || !document.body) {
    return null;
  }

  return createPortal(children, document.body);
}

