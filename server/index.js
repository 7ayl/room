const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure your MySQL connection here
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'magical_room',
  waitForConnections: true,
  connectionLimit: 10
});

app.get('/api/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const size = parseInt(req.query.size || '10');
    const offset = (page - 1) * size;
    const [rows] = await pool.query('SELECT id, title, content, created_at FROM posts ORDER BY created_at DESC LIMIT ? OFFSET ?', [size, offset]);
    res.json({ posts: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const [rows] = await pool.query('SELECT id, author, text, created_at FROM comments WHERE post_id = ? ORDER BY created_at ASC', [postId]);
    res.json({ comments: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const postId = req.params.id;
    const { author, text } = req.body;
    await pool.query('INSERT INTO comments (post_id, author, text, created_at) VALUES (?, ?, ?, NOW())', [postId, author || '访客', text]);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db error' });
  }
});

app.listen(3000, () => console.log('API server listening on 3000'));
