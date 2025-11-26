import http from 'http';
import { URL } from 'url';
import crypto from 'crypto';
import pool from '../database/db.js';

const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_SIZE = 1024 * 1024; // 1MB

const setCommonHeaders = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
};

const sendJSON = (res, statusCode, payload) => {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
};

const parseJSONBody = (req) =>
  new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
      if (Buffer.byteLength(data) > MAX_BODY_SIZE) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });

    req.on('error', (err) => reject(err));
  });

const hashPassword = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

const validateRegistrationPayload = ({ username, email, phone, password, confirmPassword }) => {
  if (!username || !email || !password || !confirmPassword) {
    return 'All fields are required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email address';
  }

  if (phone && !/^[0-9()+\-\s]{7,20}$/.test(phone)) {
    return 'Invalid phone number';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters long';
  }

  return null;
};

const handleHealthCheck = async (_req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    sendJSON(res, 200, { status: 'ok' });
  } catch (err) {
    console.error('Health check failed:', err);
    sendJSON(res, 500, { status: 'error', message: 'Database connection failed' });
  }
};

const handleRegistration = async (req, res) => {
  let payload;
  try {
    payload = await parseJSONBody(req);
  } catch (err) {
    sendJSON(res, 400, { success: false, message: err.message });
    return;
  }

  const validationMessage = validateRegistrationPayload(payload);
  if (validationMessage) {
    sendJSON(res, 400, { success: false, message: validationMessage });
    return;
  }

  const { username, email, phone, password } = payload;
  const sanitizedPhone =
    typeof phone === 'string' ? phone.trim() : null;
  const normalizedPhone = sanitizedPhone && sanitizedPhone.length > 0 ? sanitizedPhone : null;

  try {
    const [existing] = await pool.execute(
      'SELECT user_id FROM users WHERE email = ? OR username = ? LIMIT 1',
      [email, username]
    );

    if (existing.length > 0) {
      sendJSON(res, 409, { success: false, message: 'User already exists' });
      return;
    }

    const passwordHash = hashPassword(password);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password, phone, email ) VALUES (?, ?, ?, ?)',
      [username, passwordHash, normalizedPhone, email]
    );

    sendJSON(res, 201, {
      success: true,
      message: 'Registration successful',
      data: {
        userId: result.insertId,
        username,
        email,
        phone: normalizedPhone,
        createdAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('Registration failed:', err);
    sendJSON(res, 500, { success: false, message: 'Failed to register user' });
  }
};

const router = new Map();
router.set('GET /health', handleHealthCheck);
router.set('POST /api/v1/user/registration', handleRegistration);

const server = http.createServer(async (req, res) => {
  setCommonHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const routeKey = `${req.method} ${requestUrl.pathname}`;
  const handler = router.get(routeKey);

  if (!handler) {
    sendJSON(res, 404, { success: false, message: 'Route not found' });
    return;
  }

  try {
    await handler(req, res, requestUrl);
  } catch (err) {
    console.error('Unexpected error:', err);
    sendJSON(res, 500, { success: false, message: 'Internal server error' });
  }
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
