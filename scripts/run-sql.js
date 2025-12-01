// scripts/run-sql.js
require("dotenv").config();
const fs = require("fs");
const { Client } = require("pg");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/run-sql.js <sql-file>");
    process.exit(1);
  }
  const sql = fs.readFileSync(file, "utf8");
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(sql);
    console.log("SQL executed successfully:", file);
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
