import { useEffect, useMemo, useState } from "react";
import { type TransactionUI } from "@app/types";
import { filterTransactions, upsertTransaction } from "../utils/dashboard";

const normalizeBaseUrl = (baseUrl: string) => baseUrl.replace(/\/$/, "");

const getApiUrl = (path: string) => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    if (import.meta.env.DEV) {
      return path;
    }

    return `${window.location.protocol}//${window.location.hostname}:3000${path}`;
  }

  return `${normalizeBaseUrl(configuredBaseUrl)}${path}`;
};

const TRANSACTIONS_API_URL = getApiUrl("/api/transactions");
const TRANSACTIONS_STREAM_URL = getApiUrl("/api/transactions/stream");

const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";

export const useDashboardTransactions = () => {
  const [transactions, setTransactions] = useState<TransactionUI[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [hasEverConnected, setHasEverConnected] = useState<boolean>(false);
  const [lastUpdateAt, setLastUpdateAt] = useState<Date | null>(null);
  const [selectedTx, setSelectedTx] = useState<TransactionUI | null>(null);

  useEffect(() => {
    const abortController = new AbortController();

    fetch(TRANSACTIONS_API_URL, { signal: abortController.signal })
      .then((response) => response.json() as Promise<TransactionUI[]>)
      .then((data) => setTransactions(data))
      .catch((error: unknown) => {
        if (!isAbortError(error)) {
          console.error("Failed to fetch transactions", error);
        }
      });

    const eventSource = new EventSource(TRANSACTIONS_STREAM_URL);

    eventSource.onopen = () => {
      setIsConnected(true);
      setHasEverConnected(true);
    };
    eventSource.onerror = () => setIsConnected(false);

    eventSource.onmessage = (event) => {
      try {
        const updatedTx = JSON.parse(event.data) as TransactionUI;

        setTransactions((previousTransactions) =>
          upsertTransaction(previousTransactions, updatedTx),
        );
        setLastUpdateAt(new Date());

        setSelectedTx((currentTx) =>
          currentTx?.checkout_id === updatedTx.checkout_id
            ? updatedTx
            : currentTx,
        );
      } catch (error) {
        console.error("Failed to parse transaction update", error);
      }
    };

    return () => {
      abortController.abort();
      eventSource.close();
    };
  }, []);

  console.log(transactions);

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, statusFilter, searchQuery),
    [transactions, statusFilter, searchQuery],
  );

  return {
    transactions,
    filteredTransactions,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    isConnected,
    isReconnecting: !isConnected && hasEverConnected,
    lastUpdateAt,
    selectedTx,
    setSelectedTx,
  };
};
