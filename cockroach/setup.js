import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const cockroachdb_url = process.env.COCKROACHDB_URL;


const { Pool } = pg;

async function setupCockroachDB() {
    const pool = new Pool({
        connectionString: cockroachdb_url,
        ssl: {
            require: true,
        }
    });

    try {
        const client = await pool.connect();
        console.log('Connected to CockroachDB successfully');

        try {
            await client.query('BEGIN');

            // Create the same tables as in Neon
            console.log('Creating tables...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS databases (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    version VARCHAR(20),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    description TEXT
                );

                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    database_id INTEGER REFERENCES databases(id),
                    role VARCHAR(30) NOT NULL,
                    last_login TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_active BOOLEAN DEFAULT true
                );
            `);

            await client.query('COMMIT');
            console.log('Tables created successfully');

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Setup failed:', err);
        throw err;
    } finally {
        await pool.end();
    }
}

// Execute if running directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    setupCockroachDB()
        .then(() => console.log('Setup completed'))
        .catch(err => {
            console.error('Setup failed:', err);
            process.exit(1);
        });
}

export { setupCockroachDB };