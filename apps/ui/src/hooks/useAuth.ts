import { useState, useEffect, useCallback } from "react";
import { getApiUrl } from "./useDashboardTransactions";

const AUTH_GENERATE_URL = getApiUrl("/oauth/v1/generate");

// Default dev credentials from seed-dev-data.sql
const DEFAULT_CREDENTIALS = {
  short_code: "174379",
  passkey: "pass_key123",
};

export const useAuth = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    setIsLoading(true);
    // Don't clear error here to avoid UI flicker if it's already showing an error
    try {
      const response = await fetch(AUTH_GENERATE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(DEFAULT_CREDENTIALS),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate token: ${response.statusText}`);
      }

      const data = await response.json();
      setToken((prev) => {
        // Only update if it actually changed to prevent unnecessary re-renders
        if (prev === data.token) return prev;
        return data.token;
      });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("OAuth renewal failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshToken();

    // Check/Refresh every 5 minutes to stay "tight" with API state
    // Since it's idempotent, this is cheap and ensures sync if API restarts
    const interval = setInterval(refreshToken, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshToken]);

  return { token, isLoading, error, refreshToken };
};
