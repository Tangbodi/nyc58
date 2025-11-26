import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'db-mysql-nyc3-05415-do-user-14241718-0.c.db.ondigitalocean.com',
  user: 'doadmin',
  password: '',
  database: 'nyc58',
  port: 25060,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test
try {
  const connection = await pool.getConnection();
  console.log('Database connected successfully!');
  connection.release();
} catch (err) {
  console.error('Database connection failed:', err);
}

export default pool;
