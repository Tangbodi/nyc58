import crypto from 'crypto';

const hashPassword = (value) => crypto.createHash('sha256').update(value).digest('hex');

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

/**
 * Factory to create auth handlers with shared utilities injected.
 * @param {{ parseJSONBody: Function, sendJSON: Function, pool: any, sessionStore: Map<string, any> }} deps
 */
export const createAuthHandlers = ({ parseJSONBody, sendJSON, pool, sessionStore }) => {
  const createSession = (userId) => {
    const sessionId = crypto.randomUUID();
    sessionStore.set(sessionId, { userId, createdAt: Date.now() });
    return sessionId;
  };

  const getSessionUserId = (sessionId) => {
    const session = sessionStore.get(sessionId);
    return session ? session.userId : null;
  };

  const parseCookies = (req) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return {};
    return cookieHeader.split(';').reduce((acc, pair) => {
      const [rawKey, rawVal] = pair.split('=');
      if (!rawKey) return acc;
      const key = rawKey.trim();
      const val = (rawVal || '').trim();
      acc[key] = decodeURIComponent(val);
      return acc;
    }, {});
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
    const sanitizedPhone = typeof phone === 'string' ? phone.trim() : null;
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
        'INSERT INTO users (username, password, phone, email) VALUES (?, ?, ?, ?)',
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

  const handleLogin = async (req, res) => {
    let payload;
    try {
      payload = await parseJSONBody(req);
    } catch (err) {
      sendJSON(res, 400, { success: false, message: err.message });
      return;
    }

    const { email, password } = payload || {};

    if (!email || !password) {
      sendJSON(res, 400, { success: false, message: 'Email and password are required' });
      return;
    }

    try {
      const [rows] = await pool.execute(
        'SELECT user_id, username, email, phone, password FROM users WHERE email = ? LIMIT 1',
        [email]
      );

      if (rows.length === 0) {
        sendJSON(res, 401, { success: false, message: 'Invalid credentials' });
        return;
      }

      const user = rows[0];
      const incomingHash = hashPassword(password);

      if (incomingHash !== user.password) {
        sendJSON(res, 401, { success: false, message: 'Invalid credentials' });
        return;
      }

      const sessionId = createSession(user.user_id);
      res.setHeader(
        'Set-Cookie',
        `sessionId=${sessionId}; HttpOnly; Path=/; SameSite=Lax`
      );

      sendJSON(res, 200, {
        success: true,
        message: 'Login successful',
        data: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          phone: user.phone ?? null
        }
      });
    } catch (err) {
      console.error('Login failed:', err);
      sendJSON(res, 500, { success: false, message: 'Failed to login' });
    }
  };

  const handleGetUserInfo = async (req, res) => {
    const cookies = parseCookies(req);
    const sessionId = cookies.sessionId;

    if (!sessionId) {
      sendJSON(res, 401, { success: false, message: 'Not authenticated' });
      return;
    }

    const userId = getSessionUserId(sessionId);
    if (!userId) {
      sendJSON(res, 401, { success: false, message: 'Invalid session' });
      return;
    }

    try {
      const [rows] = await pool.execute(
        'SELECT user_id, username, email, phone FROM users WHERE user_id = ? LIMIT 1',
        [userId]
      );

      if (rows.length === 0) {
        sendJSON(res, 404, { success: false, message: 'User not found' });
        return;
      }

      const user = rows[0];
      sendJSON(res, 200, {
        success: true,
        message: 'User info fetched',
        data: {
          userId: user.user_id,
          username: user.username,
          email: user.email,
          phone: user.phone ?? null
        }
      });
    } catch (err) {
      console.error('Fetch user info failed:', err);
      sendJSON(res, 500, { success: false, message: 'Failed to fetch user info' });
    }
  };

  return { handleRegistration, handleLogin, handleGetUserInfo };
};
