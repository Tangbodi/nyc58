import http from 'http';
import { URL } from 'url';
import { createAuthHandlers } from './handlers/auth.js';
import pool from '../database/db.js';

const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_SIZE = 1024 * 1024; // 1MB

const setCommonHeaders = (req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

const sessionStore = new Map();

const { handleRegistration, handleLogin, handleGetUserInfo } = createAuthHandlers({
  parseJSONBody,
  sendJSON,
  pool,
  sessionStore
});

const router = new Map();
router.set('GET /health', handleHealthCheck);
router.set('POST /api/v1/user/registration', handleRegistration);
router.set('POST /api/v1/user/login', handleLogin);
router.set('GET /api/v1/user-info', handleGetUserInfo);

const server = http.createServer(async (req, res) => {
  setCommonHeaders(req, res);

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
