import { type TransactionUI } from "@app/types";

export const dashboardStatusOptions = [
  { value: "", label: "All Statuses" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
] as const;

export const filterTransactions = (
  transactions: TransactionUI[],
  statusFilter: string,
  searchQuery: string,
) => {
  const normalizedSearch = searchQuery.trim();

  return transactions.filter((transaction) => {
    const matchesStatus =
      statusFilter === "" || transaction.status === statusFilter;

    const matchesSearch =
      normalizedSearch === "" ||
      transaction.phone_number.includes(normalizedSearch) ||
      transaction.checkout_id.includes(normalizedSearch) ||
      transaction.external_reference.includes(normalizedSearch);

    return matchesStatus && matchesSearch;
  });
};

export const upsertTransaction = (
  transactions: TransactionUI[],
  updatedTransaction: TransactionUI,
) => {
  const index = transactions.findIndex(
    (transaction) => transaction.checkout_id === updatedTransaction.checkout_id,
  );

  if (index === -1) {
    return [updatedTransaction, ...transactions];
  }

  const nextTransactions = [...transactions];
  nextTransactions[index] = updatedTransaction;

  return nextTransactions;
};

export const formatTransactionAmount = (amount: string) => {
  const parsedAmount = Number.parseFloat(amount);

  if (!Number.isFinite(parsedAmount)) {
    return "0.00";
  }

  return parsedAmount.toFixed(2);
};

export const formatTransactionDate = (dateStr: string) => {
  if (!dateStr) return "N/A";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "Invalid Date";

  return `${date.toLocaleTimeString()} ${date.toLocaleDateString()}`;
};

export const formatTransactionDateShort = (dateStr: string) => {
  if (!dateStr) return "N/A";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "Invalid Date";

  return date.toLocaleDateString();
};

export const formatTransactionCheckoutPreview = (checkoutId: string) => {
  const [preview] = checkoutId.split("-");

  return `${preview}...`;
};
