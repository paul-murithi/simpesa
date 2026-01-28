export interface Migration {
  version: number;
  name: string;
  filename: string;
  sql: string;
}
