const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// PostgreSQL connection setup
const pool = new Pool({
  user: 'your_db_user',
  host: 'localhost',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
});

app.use(bodyParser.json()); // for parsing application/json

app.post('/data', async (req, res) => {
  const { name, age } = req.body; // Assume you're getting name and age from the frontend

  try {
    const query = 'INSERT INTO your_table_name (name, age) VALUES ($1, $2)';
    const values = [name, age];

    await pool.query(query, values);
    res.status(201).send('Data inserted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error inserting data');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});q
