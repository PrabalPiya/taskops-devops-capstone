require("dotenv").config();

const express = require("express");
const cors = require("cors");
const client = require("prom-client");

const {
  waitForDatabase,
  initDatabase,
  query
} = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

client.collectDefaultMetrics();

const httpRequestCounter = new client.Counter({
  name: "taskops_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"]
});

app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status: res.statusCode
    });
  });

  next();
});

app.get("/", (req, res) => {
  res.json({
    app: "TaskOps Backend API",
    message: "Backend is running",
    endpoints: ["/health", "/ready", "/metrics", "/api/tasks"]
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "taskops-backend",
    uptime: process.uptime()
  });
});

app.get("/ready", async (req, res) => {
  try {
    await query("SELECT 1");
    res.status(200).json({
      status: "ready",
      database: "connected"
    });
  } catch (error) {
    res.status(503).json({
      status: "not_ready",
      database: "disconnected"
    });
  }
});

app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await query(
      "SELECT id, title, description, status, created_at FROM tasks ORDER BY created_at DESC"
    );

    res.status(200).json({
      count: tasks.length,
      tasks
    });
  } catch (error) {
    console.error("Fetch tasks error:", error);
    res.status(500).json({
      message: "Failed to fetch tasks"
    });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { title, description, status } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        message: "Task title is required"
      });
    }

    const allowedStatuses = ["todo", "in_progress", "done"];
    const finalStatus = allowedStatuses.includes(status) ? status : "todo";

    const result = await query(
      "INSERT INTO tasks (title, description, status) VALUES (?, ?, ?)",
      [title, description || "", finalStatus]
    );

    const newTask = await query(
      "SELECT id, title, description, status, created_at FROM tasks WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json({
      message: "Task created",
      task: newTask[0]
    });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({
      message: "Failed to create task"
    });
  }
});

app.patch("/api/tasks/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ["todo", "in_progress", "done"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status"
      });
    }

    await query("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);

    const updatedTask = await query(
      "SELECT id, title, description, status, created_at FROM tasks WHERE id = ?",
      [id]
    );

    if (updatedTask.length === 0) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.status(200).json({
      message: "Task status updated",
      task: updatedTask[0]
    });
  } catch (error) {
    console.error("Update task error:", error);
    res.status(500).json({
      message: "Failed to update task"
    });
  }
});

app.delete("/api/tasks/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await query("DELETE FROM tasks WHERE id = ?", [id]);

    res.status(200).json({
      message: "Task deleted"
    });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({
      message: "Failed to delete task"
    });
  }
});

async function startServer() {
  try {
    await waitForDatabase();
    await initDatabase();

    app.listen(PORT, () => {
      console.log(`TaskOps backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Backend failed to start:", error.message);
    process.exit(1);
  }
}

startServer();
