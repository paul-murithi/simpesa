import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  // Default DB
  connectionString: process.env.DATABASE_URL,
  // For testing purposes
  // connectionString: process.env.TEST_DATABASE_URL,
});

pool.on("error", (err) => {
  console.error("Unexpected DB error:", err);
});

export default pool;

// Wrapper with logging
export const Query = async (text: string, params?: any[]) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error("Query error:", { text, params, err });
    throw err;
  }
};
