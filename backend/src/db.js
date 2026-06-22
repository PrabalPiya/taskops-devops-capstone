const mysql = require("mysql2/promise");

const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "taskops",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }

  return pool;
}

async function waitForDatabase(maxAttempts = 20) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const connection = await getPool().getConnection();
      await connection.ping();
      connection.release();

      console.log("Database connected successfully");
      return;
    } catch (error) {
      console.log(`Database not ready yet. Attempt ${attempt}/${maxAttempts}`);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Could not connect to database after multiple attempts");
}

async function initDatabase() {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      status ENUM('todo', 'in_progress', 'done') DEFAULT 'todo',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const [rows] = await pool.query("SELECT COUNT(*) AS count FROM tasks");

  if (rows[0].count === 0) {
    await pool.query(
      `
      INSERT INTO tasks (title, description, status)
      VALUES
      (?, ?, ?),
      (?, ?, ?),
      (?, ?, ?)
      `,
      [
        "Dockerize the backend",
        "Create a Dockerfile for the Node.js API",
        "done",

        "Deploy app with Kubernetes",
        "Create Deployment, Service, ConfigMap, and Secret manifests",
        "in_progress",

        "Add monitoring",
        "Expose metrics and connect Prometheus with Grafana",
        "todo"
      ]
    );

    console.log("Sample tasks inserted");
  }
}

async function query(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = {
  getPool,
  waitForDatabase,
  initDatabase,
  query
};
