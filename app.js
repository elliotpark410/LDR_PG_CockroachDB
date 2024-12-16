import express from "express";
import { pool } from "./cockroach/sync.js";
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// get current file name
const __filename = fileURLToPath(import.meta.url);
// get directory path
const __dirname = path.dirname(__filename);

// initialize Express app
const app = express();

const tableName = process.env.NEON_TABLE;

async function getTableData() {
  try {
    const query = `SELECT * FROM ${tableName}`;
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching data from table ${tableName}:`, error);
    throw error;
  }
}

// route to serve HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// route to fetch table data
app.get('/api/tableData', async (req, res) => {
  try {
    const result = await getTableData();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching data' });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;