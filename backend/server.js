import express from 'express';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import axios from 'axios';
import cors from 'cors';
import bodyParser from 'body-parser';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ DATABASE — EXACTLY YOURS
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✅ CLOUDFLARE R2 — EXACTLY YOURS
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// ✅ CREATE TABLE
app.post('/api/init-db', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        file_key TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        public_url TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// ✅ ORIGINAL UPLOAD — WORKS SAME
app.post('/api/get-upload-url', async (req, res) => {
  try {
    const { userId, fileName, fileType, fileSize } = req.body;
    const fileKey = `${userId}/${Date.now()}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
      ACL: 'public-read',
      ContentLength: fileSize
    }));

    const uploadUrl = `${PUBLIC_URL}/${fileKey}`;

    await pool.query(
      'INSERT INTO files (user_id, file_key, file_name, file_type, file_size, public_url) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, fileKey, fileName, fileType, fileSize, uploadUrl]
    );

    res.json({ uploadUrl, fileKey });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload error' });
  }
});

// ✅ LIST FILES — SAME
app.post('/api/list-files', async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await pool.query('SELECT * FROM files WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

// ✅ DELETE FILE — SAME
app.post('/api/delete-file', async (req, res) => {
  try {
    const { userId, fileKey } = req.body;
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: fileKey }));
    await pool.query('DELETE FROM files WHERE user_id = $1 AND file_key = $2', [userId, fileKey]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

// ✅ NEW: FETCH LINK UPLOAD — NOW WORKS
app.post('/api/fetch-url', async (req, res) => {
  try {
    const { userId, fileUrl, isPremium } = req.body;
    if (!userId || !fileUrl) return res.status(400).json({ message: 'Missing data' });

    const response = await axios.get(fileUrl, {
      responseType: 'arraybuffer',
      maxRedirects: 5,
      timeout: 15000
    });
    if (response.status !== 200) return res.status(400).json({ message: 'Could not load link' });

    const buffer = Buffer.from(response.data);
    const fileSize = buffer.length;
    const contentType = response.headers['content-type'] || 'application/octet-stream';

    if (!isPremium) {
      if (!contentType.startsWith('image/')) return res.status(403).json({ message: 'Free: only images' });
      if (fileSize > 100 * 1024 * 1024) return res.status(403).json({ message: 'Free: max 100MB' });
    }

    let fileName = fileUrl.split('/').pop().split('?')[0] || 'file';
    fileName = decodeURIComponent(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileKey = `${userId}/${Date.now()}_${fileName}`;
    const publicUrl = `${PUBLIC_URL}/${fileKey}`;

    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: contentType,
      ACL: 'public-read'
    }));

    await pool.query(
      'INSERT INTO files (user_id, file_key, file_name, file_type, file_size, public_url) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, fileKey, fileName, contentType, fileSize, publicUrl]
    );

    res.json({ success: true, publicUrl });
  } catch (err) {
    console.error('Fetch error:', err.message);
    res.status(500).json({ message: 'Failed to save link' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));
