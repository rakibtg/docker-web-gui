import { useState, useEffect } from "react";

interface IPAccessResult {
  ip: string;
  allowed: boolean;
}

interface UseIPAccessReturn {
  error: string | null;
  userIP: string | null;
  isAllowed: boolean | null; // null = checking, true = allowed, false = denied
  checkAccess: () => Promise<void>;
}

export function useIPAccess(): UseIPAccessReturn {
  const [error, setError] = useState<string | null>(null);
  const [userIP, setUserIP] = useState<string | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean | null>(null);

  const checkAccess = async (): Promise<void> => {
    try {
      setError(null);
      
      const response = await fetch('/api/ip-access', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 403) {
        // IP not allowed
        const errorData = await response.json();
        setIsAllowed(false);
        setError(errorData.message || 'Access denied from your IP address');
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: IPAccessResult = await response.json();
      setIsAllowed(data.allowed);
      setUserIP(data.ip);
      
      if (!data.allowed) {
        setError('Access denied from your IP address');
      }
    } catch (err) {
      console.error('Failed to check IP access:', err);
      setError(err instanceof Error ? err.message : 'Failed to check IP access');
      // On network error, assume allowed to prevent blocking legitimate users
      // The WebSocket connection will handle the actual restriction
      setIsAllowed(true);
    }
  };

  useEffect(() => {
    checkAccess();
  }, []);

  return {
    isAllowed,
    userIP,
    error,
    checkAccess,
  };
}