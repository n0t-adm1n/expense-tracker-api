require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

// middle ware
app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.connect()
    .then(() => console.log('Successfully connected to your local PostgreSQL database.'))
    .catch((err) => console.error('Database connection error:', err.stack));

// Create a Transaction (POST)
app.post('/api/transactions', async (req, res) => {
    try {
        const { amount, type, category, description, transaction_date } = req.body;
        
        const newTransaction = await pool.query(
            `INSERT INTO transactions (amount, type, category, description, transaction_date) 
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [amount, type, category, description, transaction_date || new Date()]
        );

        res.status(201).json(newTransaction.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while saving transaction.' });
    }
});

// Get All Transactions (GET)
app.get('/api/transactions', async (req, res) => {
    try {
        const allTransactions = await pool.query(
            'SELECT * FROM transactions ORDER BY transaction_date DESC'
        );
        res.status(200).json(allTransactions.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching transactions.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});