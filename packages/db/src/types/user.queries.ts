import { loadQueries } from "../query-loader.js";

// Load use related SQL queries
export const userQueries = loadQueries<UserQueries>("users.sql");

interface UserQueries {
  [key: string]: string;
  createUser: string;
  lockUserByPhoneNumber: string;
  debitUser: string;
  findUserByPhoneNumber: string;
}
