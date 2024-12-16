import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const cockroachdb_url = process.env.COCKROACHDB_URL;
const neondb_url = process.env.NEON_DATABASE_URL;

// Create pools once, not for every query
const neonPool = new Pool({
    connectionString: neondb_url,
    ssl: { require: true }
});

const cockroachPool = new Pool({
    connectionString: cockroachdb_url,
    ssl: { require: true }
});

async function syncData() {
    console.log('Starting sync process...', new Date().toISOString());
    const syncInterval = 5 * 60 * 1000; // Default 5 minutes

    try {
        // Sync databases table
        console.log('Fetching data from Neon databases table...');
        const databasesData = await getNeonData('databases');
        console.log(`Found ${databasesData.rows.length} records in databases table`);

        console.log('Updating CockroachDB databases table...');
        await updateCockroachDB('databases', databasesData.rows);
        console.log('Databases table sync completed');

        // Sync users table
        console.log('Fetching data from Neon users table...');
        const usersData = await getNeonData('users');
        console.log(`Found ${usersData.rows.length} records in users table`);

        console.log('Updating CockroachDB users table...');
        await updateCockroachDB('users', usersData.rows);
        console.log('Users table sync completed');

        console.log('Sync completed successfully', new Date().toISOString());
    } catch (error) {
        console.error('Sync failed:', error);
    }

    // Schedule next sync
    setTimeout(syncData, syncInterval);
}

async function getNeonData(tableName) {
    try {
        const client = await neonPool.connect();
        const startTime = Date.now();
        const result = await client.query(`SELECT * FROM ${tableName} ORDER BY id`);
        console.log(`Neon query took ${Date.now() - startTime}ms`);
        client.release();
        return result;
    } catch (error) {
        console.error(`Error getting data from Neon ${tableName}:`, error);
        throw error;
    }
}

async function updateCockroachDB(tableName, rows) {
    if (rows.length === 0) {
        console.log(`No rows to update for ${tableName}`);
        return;
    }

    try {
        const client = await cockroachPool.connect();
        const startTime = Date.now();

        // Use a transaction for better performance
        await client.query('BEGIN');

        for (const row of rows) {
            const columns = Object.keys(row);
            const values = Object.values(row);
            const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
            const updateSet = columns
                .map((col) => `${col} = EXCLUDED.${col}`)
                .join(', ');

            const query = `
                INSERT INTO ${tableName} (${columns.join(', ')})
                VALUES (${placeholders})
                ON CONFLICT (id) DO UPDATE
                SET ${updateSet}
            `;

            await client.query(query, values);
        }

        await client.query('COMMIT');
        console.log(`CockroachDB update for ${tableName} took ${Date.now() - startTime}ms`);
        client.release();
    } catch (error) {
        console.error(`Error updating CockroachDB ${tableName}:`, error);
        throw error;
    }
}

// Cleanup function for pools
async function cleanup() {
    console.log('Cleaning up connection pools...');
    await neonPool.end();
    await cockroachPool.end();
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('Received SIGINT. Cleaning up...');
    await cleanup();
    process.exit(0);
});

// Execute if running directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    syncData()
        .catch(err => {
            console.error('Sync process failed:', err);
            cleanup().then(() => process.exit(1));
        });
}

export { syncData };