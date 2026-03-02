import { loadQueries } from "../query-loader.js";

// Load use related SQL queries
export const userQueries = loadQueries<UserQueries>("users.sql");

interface UserQueries {
  [key: string]: string;
  GetUserById: string;
  CreateUser: string;
  DeleteUser: string;
  lockUserByPhoneNumber: string;
  debitUser: string;
}
