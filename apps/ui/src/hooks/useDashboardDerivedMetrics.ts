import { useMemo } from "react";
import { type TransactionUI } from "@app/types";

export const useDashboardDerivedMetrics = (transactions: TransactionUI[]) => {
  const todaysTransactions = useMemo(() => {
    const now = new Date();

    return transactions.filter((transaction) => {
      const createdAt = new Date(transaction.created_at);

      return (
        !Number.isNaN(createdAt.getTime()) &&
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth() &&
        createdAt.getDate() === now.getDate()
      );
    });
  }, [transactions]);

  const totalToday = todaysTransactions.length;
  const successToday = todaysTransactions.filter(
    (transaction) => transaction.status === "SUCCESS",
  ).length;
  const failedToday = todaysTransactions.filter(
    (transaction) => transaction.status === "FAILED",
  ).length;
  const successRate =
    totalToday === 0 ? 0 : Math.round((successToday / totalToday) * 100);

  const latestTransaction = transactions[0] ?? null;
  const merchantBalance = latestTransaction?.merchant_balance;
  const userBalance = latestTransaction?.user_balance;
  const userStatus = latestTransaction?.user_status ?? "UNKNOWN";

  return {
    totalToday,
    successToday,
    failedToday,
    successRate,
    latestTransaction,
    merchantBalance,
    userBalance,
    userStatus,
  };
};
