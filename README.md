# Personal Expense API & AI Engine (Backend)

A robust Node.js and Express REST API that powers the Personal Finance Dashboard. It handles database operations, bulk data inserts from parsed bank statements, and integrates with the Google Gemini API for data analysis.

This repository contains the server-side code. The frontend React repository can be found [expense-tracker-client](https://github.com/n0t-adm1n/expense-tracker-client).

## 🚀 Features
* **RESTful Architecture:** Clean endpoints for CRUD operations on financial transactions.
* **Bulk Processing:** Dedicated endpoints engineered to handle multi-row SQL inserts from large Excel uploads.
* **AI Integration:** Securely communicates with the Google Gemini (`gemini-3.5-flash`) API, passing aggregated database context to generate financial insights.
* **Relational Database:** Uses PostgreSQL for secure, structured data persistence.

## 🛠️ Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL (`pg` library)
* **AI Integration:** `@google/generative-ai` SDK

## 💻 Local Setup Instructions

1. Clone the repository:
```bash
   git clone https://github.com/n0t-adm1n/expense-tracker-api.git
   ```
2. Navigate into the directory and install dependencies:
```bash
   cd expense-tracker-api
   npm install
   ```
3. Set up your environment variables. Create a `.env` file in the root directory and add:
```text
   PORT=5000
   DATABASE_URL=postgresql://<username>:<password>@127.0.0.1:5432/expense_tracker_local
   GEMINI_API_KEY=your_google_ai_key
   ```
4. Start dev server:
```bash
   npm run dev
   ```