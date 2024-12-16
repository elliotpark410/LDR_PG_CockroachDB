import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

const dbURL = process.env.NEON_DATABASE_URL;
const sql = neon(dbURL);
const database = process.env.NEON_DATABASE;
const tableName = process.env.NEON_TABLE;
const publication = process.env.NEON_PUBLICATION;

async function getPgVersion() {
  const result = await sql`SELECT version()`;
  console.log("result");
  console.log(result);
}

async function checkLogicalReplcation() {
  const result = await sql`SHOW wal_level;`;
  console.log("result");
  console.log(result);
}

// need replication slot for publisher (neon db)
async function checkReplicationSlot() {
  const result = await sql`SELECT * FROM pg_replication_slots;`;
  console.log("result");
  console.log(result);
}

async function createPublication() {
  const query = `CREATE PUBLICATION ${publication} FOR TABLE ${tableName};`;
  const result = await sql(query);
  console.log("result");
  console.log(result);
}

async function checkPublication() {
  const result = await sql`SELECT * FROM pg_publication;`;
  console.log("result");
  console.log(result);
}

async function listDatabases() {
  const result = await sql`SELECT datname FROM pg_database WHERE datistemplate = false`;
  console.log("Databases:");
  console.log(result);
}

async function listTables() {
  const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  const result = await sql(query);
  console.log(`Tables in database ${database}:`);
  console.log(result);
}

async function getTableData() {
  try {
    const query = `SELECT * FROM ${tableName}`;
    const result = await sql(query);
    console.log(`Data in table ${tableName} in database ${database}:`);
    console.log(result);
  } catch (error) {
    console.error("Error fetching table data:", error);
  }
}

async function addData(name, value) {
  try {
    const query = `INSERT INTO ${tableName} (name, value) VALUES ($1, $2) RETURNING *`;
    const result = await sql(query, [name, value]);
    console.log(`New data added to table ${tableName} in database ${database}:`);
    console.log(result);
  } catch (error) {
    console.error("Error adding data:", error);
  }
}

// async function main() {
//   try {
    // await getPgVersion();
    // await checkLogicalReplcation();
    // await checkReplicationSlot();
    // await createPublication();
    // await checkPublication();
    // await listDatabases();
    // await listTables();
    // await getTableData();
    // await addData('17d2481932', 0.333356)
    // await getTableData();
//   } catch (error) {
//     console.error(error);
//   }
// }

// main();