import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const tableName = process.env.NEON_TABLE;
const subscription = process.env.AWS_SUBSCRIPTION;
const neonHost = process.env.NEON_HOST;
const neonDb = process.env.NEON_DATABASE;
const neonUser = process.env.NEON_USER;
const neonPassword = process.env.NEON_PASSWORD;
const neonPublication = process.env.NEON_PUBLICATION;

export const pool = new Pool({
  host: process.env.AWS_PG_HOST,
  user: process.env.AWS_PG_USER,
  password: process.env.AWS_PG_PASSWORD,
  database: process.env.AWS_PG_DB_NAME,
  port: process.env.AWS_PG_DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  }
});

async function getPgVersion() {
  const result = await pool.query('SELECT version()');
  console.log("PostgreSQL Version:");
  console.log(result.rows[0].version);
}

async function listDatabases() {
  const result = await pool.query('SELECT datname FROM pg_database WHERE datistemplate = false');
  console.log("Databases:");
  console.log(result.rows.map(row => row.datname));
}

async function listTables() {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
  `;
  const result = await pool.query(query);
  console.log(`Tables in database ${process.env.AWS_PG_DB_NAME}:`);
  console.log(result.rows.map(row => row.table_name));
}

async function createTable() {
  const query = `
      CREATE TABLE IF NOT EXISTS ${tableName} (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        value REAL
      );
    `;
    await pool.query(query);
    console.log(`Table '${tableName}' created or already exists.`);
}

async function getTableData() {
  try {
    const query = `SELECT * FROM ${tableName}`;
    const result = await pool.query(query);
    console.log(`Data in AWS RDS PG table ${tableName}: `);
    console.log(result.rows);
  } catch (error) {
    console.error(`Error fetching data from table ${tableName}:`, error);
  }
}

async function createSubscription() {
  try {
    const query = `
      CREATE SUBSCRIPTION ${subscription}
      CONNECTION 'host=${neonHost} port=5432 dbname=${neonDb} user=${neonUser} password=${neonPassword}'
      PUBLICATION ${neonPublication};
    `;
    const result = await pool.query(query);
    console.log(`Subscription '${subscription}' created successfully.`);
    console.log('Query result:', result);
  } catch (error) {
    console.error('Error setting up subscription:', error);
  }
}

async function checkSubscription() {
  const query = `SELECT * FROM pg_stat_subscription;`;
    const result = await pool.query(query);
    console.log("Checking subscription")
    console.log(result)
}

// async function main() {
//   try {
//     await getPgVersion();
//     await listDatabases();
//     await createTable();
//     await listTables();
//     await createSubscription();
//     await checkSubscription();
//     await getTableData();
//   } catch (error) {
//     console.error("Error:", error);
//   } finally {
//     await pool.end();
//   }
// }

// main();