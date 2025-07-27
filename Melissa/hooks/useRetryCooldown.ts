import { Dispatch, SetStateAction, useEffect } from 'react';

export const useRetryCooldown = (
  retryCooldown: number | null,
  setRetryCooldown: Dispatch<SetStateAction<number | null>>,
  setQuotaMessage: (msg: string | null) => void
) => {
  useEffect(() => {
    if (retryCooldown === null) return;
    const interval = setInterval(() => {
      setRetryCooldown((prev: number | null) => {
        if (prev && prev > 1) return prev - 1;
        setQuotaMessage(null);
        return null;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [retryCooldown, setRetryCooldown, setQuotaMessage]);
};