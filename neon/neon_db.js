import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const dbURL = process.env.NEON_DATABASE_URL;
const sql = neon(dbURL);
const table1 = process.env.NEON_TABLE_1;
const table2 = process.env.NEON_TABLE_2;
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

async function checkReplicationConnections() {
  const connections = await sql`
    SELECT * FROM pg_stat_replication;
  `;
  console.log("Replication connections:", connections);
}

async function createLogicalReplicationSlot() {
  try {
    const result = await sql`
      SELECT pg_create_logical_replication_slot(
        'cockroachdb_slot',
        'pgoutput'
      );
    `;
    console.log("Logical replication slot created:", result);
  } catch (error) {
    console.error("Error creating logical replication slot:", error);
  }
}

async function createPublication() {
  const query = `CREATE PUBLICATION ${publication} FOR TABLE ${table1}, ${table2};`;
  const result = await sql(query);
  console.log("result");
  console.log(result);
}

async function checkPublication() {
  // Check publication details
  const pub = await sql`
    SELECT * FROM pg_publication
    WHERE pubname = 'ldr_demo_neon_publication';
  `;
  console.log("Publication details:", pub);

  // Check which tables are in the publication
  const pubTables = await sql`
    SELECT schemaname, tablename
    FROM pg_publication_tables
    WHERE pubname = 'ldr_demo_neon_publication';
  `;
  console.log("Publication tables:", pubTables);
}

async function listDatabases() {
  const result = await sql`SELECT datname FROM pg_database WHERE datistemplate = false`;
  console.log("Databases:");
  console.log(result);
}

async function listTables() {
  const query = `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  const result = await sql(query);
  console.log(result);
}

async function getTableData(tableName) {
  try {
    const query = `SELECT * FROM ${tableName}`;
    const result = await sql(query);
    console.log(result);
  } catch (error) {
    console.error("Error fetching table data:", error);
  }
}

async function addData(tableName, name, version, description) {
  try {
    const result = await sql`
      INSERT INTO databases (name, version, description)
      VALUES (${name}, ${version}, ${description})
      RETURNING *
    `;
    console.log(`New data added to table ${tableName}`);
    console.log(result);
  } catch (error) {
    console.error("Error adding data:", error);
  }
}

async function main() {
  try {
    // await getPgVersion();
    // await checkLogicalReplcation();
    // await createLogicalReplicationSlot();
    // await checkReplicationSlot();
    // await checkReplicationConnections();
    // await createPublication();
    // await checkPublication();
    // await listDatabases();
    // await listTables();
    // await getTableData();
    // await addData("databases", "NeonDB", "17.2", "Development database for small projects")
    // await getTableData("databases");
  } catch (error) {
    console.error(error);
  }
}

main();