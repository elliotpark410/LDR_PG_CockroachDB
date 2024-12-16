import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

async function setupDatabase() {
    const pool = new Pool({
        connectionString: process.env.NEON_DATABASE_URL,
        ssl: {
            require: true,
        }
    });

    try {
        // Start a transaction
        const client = await pool.connect();
        console.log('Connected to database successfully');

        try {
            await client.query('BEGIN');

            // Create databases table
            await client.query(`
                CREATE TABLE IF NOT EXISTS databases (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    version VARCHAR(20),
                    is_active BOOLEAN DEFAULT true,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    description TEXT
                );
            `);
            console.log('Created databases table');

            // Create users table
            await client.query(`
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
            console.log('Created users table');

            // Insert sample databases
            await client.query(`
                INSERT INTO databases (name, type, version, description) VALUES
                    ('ProductionDB', 'PostgreSQL', '14.2', 'Main production database for e-commerce platform'),
                    ('AnalyticsDB', 'CockroachDB', '22.1', 'Distributed analytics database for reporting'),
                    ('CacheDB', 'Redis', '6.2', 'In-memory caching layer for high-performance queries'),
                    ('DocumentDB', 'MongoDB', '5.0', 'Document storage for user-generated content'),
                    ('SearchDB', 'Elasticsearch', '8.1', 'Full-text search engine for product catalog')
                ON CONFLICT DO NOTHING;
            `);
            console.log('Inserted sample databases');

            // Insert sample users
            await client.query(`
                INSERT INTO users (username, email, database_id, role, last_login) VALUES
                    ('admin_user', 'admin@company.com', 1, 'Administrator', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
                    ('analyst_jane', 'jane@company.com', 2, 'Analyst', CURRENT_TIMESTAMP - INTERVAL '2 days'),
                    ('dev_john', 'john@company.com', 1, 'Developer', CURRENT_TIMESTAMP - INTERVAL '12 hours'),
                    ('dba_sarah', 'sarah@company.com', 1, 'DBA', CURRENT_TIMESTAMP - INTERVAL '30 minutes'),
                    ('readonly_bob', 'bob@company.com', 3, 'ReadOnly', CURRENT_TIMESTAMP - INTERVAL '5 days')
                ON CONFLICT DO NOTHING;
            `);
            console.log('Inserted sample users');

            // Verify the data
            const dbResult = await client.query('SELECT COUNT(*) FROM databases');
            const userResult = await client.query('SELECT COUNT(*) FROM users');

            console.log(`Verification: ${dbResult.rows[0].count} databases and ${userResult.rows[0].count} users created`);

            await client.query('COMMIT');
            console.log('Database setup completed successfully');

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Database setup failed:', err);
        throw err;
    } finally {
        await pool.end();
    }
}

// Execute the setup if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    setupDatabase()
        .then(() => console.log('Setup complete'))
        .catch(err => {
            console.error('Setup failed:', err);
            process.exit(1);
        });
}

export default setupDatabase;