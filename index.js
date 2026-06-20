require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {GoogleGenerativeAI} = require("@google/generative-ai")
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Delete a transaction with given id
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const {id} = req.params;

        const deletedTransaction = await pool.query('DELETE FROM transactions WHERE id = $1 RETURNING *', [id]);

        // if transaction with id does not exists
        if(deletedTransaction.rows.length == 0) {
            return res.status(404).json({error: 'Transaction not found'});
        }

        res.status(200).json({message: 'Transaction deleted.'});

    } catch (err) {
        console.error(err.message);
        res.status(500).json({error: 'Server error while deleting transactions.'});
    }
})

// Update a transaction with given id
app.put('/api/transactions/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {amount, type, category, description, transaction_date} = req.body;

        const updatedTransaction = await pool.query(
            `UPDATE transactions 
            SET amount = $1, type = $2, category = $3, description = $4, transaction_date = $5
            WHERE id = $6 RETURNING *`, [amount, type, category, description, transaction_date || new Date(), id]
        );

        if(updatedTransaction.rowCount == 0) {
            return res.status(404).json({error : 'Transaction not found.'});
        }

        res.status(200).json(updatedTransaction.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({error : 'Server error while updating transaction.'})
    }
})

// POST a bulk array of transactions (For CSV Uploads)
app.post("/api/transactions/bulk", async (req, res) => {
  try {
    const transactions = req.body;

    // Validate that the request is an array
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: "Request body must be a non-empty array of transactions" });
    }

    // Build the SQL query for multiple inserts
    const values = [];
    const queryParameters = [];
    let paramIndex = 1;

    transactions.forEach((t) => {
      values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`);
      queryParameters.push(t.amount, t.description, t.category, t.type);
      paramIndex += 4;
    });

    const insertQuery = `
      INSERT INTO transactions (amount, description, category, type)
      VALUES ${values.join(", ")}
      RETURNING *;
    `;

    const result = await pool.query(insertQuery, queryParameters);
    res.json(result.rows);
  } catch (err) {
    console.error("Error during bulk insert:", err.message);
    res.status(500).send("Server Error");
  }
});

// GET for AI insight
app.get("/api/insight", async (req, res) => {
    try {
        const result = await pool.query("SELECT amount, category, type, description FROM transactions");

        const transactions = result.rows;

        if(transactions.length === 0) {
            return res.json({insight : "You don't have any transactions yet. Add some data to get personalized advice."});
        }

        const dataString = JSON.stringify(transactions);

        const prompt = `
            You are an expert financial consultant. Analyze this user's transaction data: ${dataString}. 
            Give me exactly 3 short, punchy bullet points of advice on how they can save money or optimize their spending based on these specific habits. 
            Do not use introductory greetings, just give the 3 bullet points.
        `;

        const model = genAI.getGenerativeModel({model: "gemini-1.5-flash"});
        const aiResponse = await model.generateContent(prompt);

        res.json({insight: aiResponse.response.text() });

    } catch (err) {
        console.error("AI error:", err.message);
        res.status(500).json({error:"Error occured while generating AI insight"})
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});