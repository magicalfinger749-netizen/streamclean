import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import pkg from 'pg';
const { Pool } = pkg;
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

// --------------------------
// Database Connection
// --------------------------
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  ssl: { rejectUnauthorized: false }
});

// --------------------------
// Cloudflare R2 Setup
// --------------------------
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
  }
});
const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const MEDIA_DOMAIN = process.env.MEDIA_DOMAIN;

// --------------------------
// Rules & Limits
// --------------------------
const FREE_STORAGE_LIMIT = 100 * 1024 * 1024; // 100MB TOTAL for Free
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB PER FILE for ALL

// --------------------------
// 1. Get Upload URL Route
// --------------------------
app.post('/api/get-upload-url', async (req, res) => {
  try {
    const { userId, fileName, fileType, fileSize } = req.body;

    // Get user from DB
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(403).json({error:'User not found'});
    const user = userRes.rows[0];
    const isPremium = (user.is_subscribed === true || user.plan === 'premium');

    // Anti-abuse: 2GB max for everyone
    if (fileSize > MAX_FILE_SIZE) {
      return res.status(413).json({message:'Maximum file size is 2 GB'});
    }

    // Calculate storage used
    const usedRes = await pool.query('SELECT COALESCE(SUM(file_size),0) as total FROM user_files WHERE user_id = $1', [userId]);
    const totalUsed = parseInt(usedRes.rows[0].total);

    // 🟢 FREE TIER RULES
    if (!isPremium) {
      const allowedTypes = ['image/jpeg','image/png','image/gif','image/webp'];
      if (!allowedTypes.includes(fileType)) {
        return res.status(403).json({message:'Free accounts: images only. Upgrade to £10.99/month for videos.'});
      }
      if (totalUsed + fileSize > FREE_STORAGE_LIMIT) {
        return res.status(403).json({message:`Free limit 100MB used. Delete files or upgrade.`});
      }
    }

    // 🔴 PREMIUM TIER = NO LIMITS

    // Create safe filename
    const ext = fileName.split('.').pop() || 'bin';
    const fileKey = `user-uploads/${userId}/${crypto.randomUUID()}_${Date.now()}.${ext}`;

    // Generate signed upload URL
    const command = new PutObjectCommand({Bucket: BUCKET_NAME, Key: fileKey, ContentType: fileType});
    const uploadUrl = await getSignedUrl(R2, command, {expiresIn: 300});

    // Save file record to DB
    await pool.query(
      'INSERT INTO user_files (user_id, file_key, file_name, file_type, file_size) VALUES ($1,$2,$3,$4,$5)',
      [userId, fileKey, fileName, fileType, fileSize]
    );

    res.json({uploadUrl, fileKey, publicUrl: `https://${MEDIA_DOMAIN}/${fileKey}`});

  } catch (err) {
    console.error(err);
    res.status(500).json({error:'Server error'});
  }
});

// --------------------------
// 2. List User Files
// --------------------------
app.get('/api/list-files', async (req, res) => {
  try {
    const {userId} = req.query;
    const result = await pool.query('SELECT * FROM user_files WHERE user_id = $1 ORDER BY uploaded_at DESC', [userId]);
    const files = result.rows.map(f => ({
      fileKey: f.file_key,
      fileName: f.file_name,
      fileType: f.file_type,
      publicUrl: `https://${MEDIA_DOMAIN}/${f.file_key}`
    }));
    res.json(files);
  } catch (err) {
    res.status(500).json([]);
  }
});

// --------------------------
// 3. Delete File
// --------------------------
app.post('/api/delete-file', async (req, res) => {
  try {
    const {userId, fileKey} = req.body;
    await R2.send(new DeleteObjectCommand({Bucket: BUCKET_NAME, Key: fileKey}));
    await pool.query('DELETE FROM user_files WHERE user_id=$1 AND file_key=$2', [userId, fileKey]);
    res.json({success:true});
  } catch (err) {
    res.status(500).json({error:'Delete failed'});
  }
});

// --------------------------
// 4. Serve Media
// --------------------------
app.get('/media/*', async (req, res) => {
  try {
    const key = req.params[0];
    const command = new GetObjectCommand({Bucket: BUCKET_NAME, Key: key});
    const {Body, ContentType} = await R2.send(command);
    res.setHeader('Content-Type', ContentType);
    res.setHeader('Accept-Ranges', 'bytes');
    Body.pipe(res);
  } catch (err) {
    res.status(404).send('File not found');
  }
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`✅ Backend running on port ${PORT}`));