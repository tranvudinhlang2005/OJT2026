import { useState, useCallback, useMemo } from 'react';

/**
 * Custom hook to manage modal open/close states and payload.
 * Helps prevent having dozens of separate useState calls for modals in page components.
 */
export function useModal<T = unknown>() {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | null>(null);

  const open = useCallback((payload?: T) => {
    if (payload !== undefined) {
      setData(payload);
    }
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return useMemo(
    () => ({
      isOpen,
      data,
      open,
      close,
      setData,
    }),
    [isOpen, data, open, close]
  );
}
