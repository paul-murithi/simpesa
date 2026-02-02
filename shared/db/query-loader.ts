import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type QueryMap = Record<string, string>;

/**
 * Parse SQL file with named queries
 * Format: -- name: QueryName
 */
function parseNamedQueries(content: string): QueryMap {
  const queries: QueryMap = {};
  const sections = content.split(/--\s*name:\s*/);

  for (const section of sections) {
    if (!section.trim()) continue;

    const lines = section.split("\n");
    if (lines.length === 0) continue;

    const name = lines[0]?.trim();
    const query = lines
      .slice(1)
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n")
      .trim();

    if (name && query) {
      queries[name] = query;
    }
  }

  return queries;
}

/**
 * Load all SQL queries from a file
 */
export function loadQueries<T extends QueryMap>(filename: string): T {
  const filePath = join(__dirname, "queries", filename);
  const content = readFileSync(filePath, "utf-8");
  return parseNamedQueries(content) as T;
}
