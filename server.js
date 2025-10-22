const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(express.json());

// Vercel uses a serverless model, so no app.listen()
// We'll export app at the end instead.

// Use path relative to project root
const BOOKS_FILE = path.join(process.cwd(), 'books.json');

// Helper: Read books
async function readBooks() {
  try {
    const data = await fs.readFile(BOOKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading books file:', error);
    return [];
  }
}

// Helper: Write books
async function writeBooks(books) {
  try {
    await fs.writeFile(BOOKS_FILE, JSON.stringify(books, null, 2));
  } catch (error) {
    console.error('Error writing books file:', error);
    throw error;
  }
}

// Routes
app.get('/api/books', async (req, res) => {
  try {
    const books = await readBooks();
    res.json(books);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/books/available', async (req, res) => {
  try {
    const books = await readBooks();
    const availableBooks = books.filter(book => book.available);
    res.json(availableBooks);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    const { title, author, available } = req.body;
    if (!title || !author || available === undefined) {
      return res.status(400).json({ error: 'Title, author, and available are required' });
    }

    const books = await readBooks();
    const newId = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
    const newBook = { id: newId, title, author, available };
    books.push(newBook);
    await writeBooks(books);
    res.status(201).json(newBook);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/books/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, author, available } = req.body;

    const books = await readBooks();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'Book not found' });

    if (title !== undefined) books[index].title = title;
    if (author !== undefined) books[index].author = author;
    if (available !== undefined) books[index].available = available;

    await writeBooks(books);
    res.json(books[index]);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const books = await readBooks();
    const index = books.findIndex(b => b.id === id);
    if (index === -1) return res.status(404).json({ error: 'Book not found' });

    const deleted = books.splice(index, 1)[0];
    await writeBooks(books);
    res.json(deleted);
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Export app for Vercel
module.exports = app;
