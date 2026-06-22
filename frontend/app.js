const apiUrlInput = document.getElementById("api-url");
const saveApiUrlBtn = document.getElementById("save-api-url");
const apiStatus = document.getElementById("api-status");
const statusDot = document.querySelector(".status-dot");

const taskForm = document.getElementById("task-form");
const taskTitle = document.getElementById("task-title");
const taskDescription = document.getElementById("task-description");
const taskStatus = document.getElementById("task-status");

const taskList = document.getElementById("task-list");
const refreshBtn = document.getElementById("refresh-btn");

const DEFAULT_API_URL = "";

function getApiUrl() {
  return localStorage.getItem("TASKOPS_API_URL") || DEFAULT_API_URL;
}

function setApiStatus(status, message) {
  apiStatus.textContent = message;

  statusDot.classList.remove("online", "offline");

  if (status === "online") {
    statusDot.classList.add("online");
  }

  if (status === "offline") {
    statusDot.classList.add("offline");
  }
}

async function checkApiHealth() {
  try {
    const response = await fetch(`${getApiUrl()}/health`);

    if (!response.ok) {
      throw new Error("API unhealthy");
    }

    setApiStatus("online", "API online");
  } catch (error) {
    setApiStatus("offline", "API offline");
  }
}

function formatStatus(status) {
  if (status === "todo") return "To do";
  if (status === "in_progress") return "In progress";
  if (status === "done") return "Done";
  return status;
}

function renderTasks(tasks) {
  if (!tasks || tasks.length === 0) {
    taskList.innerHTML = `<p class="empty">No tasks found.</p>`;
    return;
  }

  taskList.innerHTML = tasks
    .map(
      (task) => `
      <article class="task-card">
        <div class="task-card-header">
          <div>
            <h3>${task.title}</h3>
            <p>${task.description || "No description provided."}</p>
          </div>

          <span class="badge ${task.status}">
            ${formatStatus(task.status)}
          </span>
        </div>

        <div class="task-actions">
          <button onclick="updateStatus(${task.id}, 'todo')">To do</button>
          <button onclick="updateStatus(${task.id}, 'in_progress')">In progress</button>
          <button onclick="updateStatus(${task.id}, 'done')">Done</button>
          <button class="delete" onclick="deleteTask(${task.id})">Delete</button>
        </div>
      </article>
    `
    )
    .join("");
}

async function loadTasks() {
  try {
    taskList.innerHTML = `<p class="empty">Loading tasks...</p>`;

    const response = await fetch(`${getApiUrl()}/api/tasks`);

    if (!response.ok) {
      throw new Error("Failed to load tasks");
    }

    const data = await response.json();
    renderTasks(data.tasks);
  } catch (error) {
    taskList.innerHTML = `
      <p class="empty">
        Could not load tasks. Check if backend is running and API URL is correct.
      </p>
    `;
  }
}

async function createTask(event) {
  event.preventDefault();

  const payload = {
    title: taskTitle.value,
    description: taskDescription.value,
    status: taskStatus.value
  };

  try {
    const response = await fetch(`${getApiUrl()}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Failed to create task");
    }

    taskForm.reset();
    await loadTasks();
    await checkApiHealth();
  } catch (error) {
    alert("Could not create task. Check backend connection.");
  }
}

async function updateStatus(id, status) {
  try {
    const response = await fetch(`${getApiUrl()}/api/tasks/${id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    await loadTasks();
  } catch (error) {
    alert("Could not update task.");
  }
}

async function deleteTask(id) {
  try {
    const response = await fetch(`${getApiUrl()}/api/tasks/${id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error("Failed to delete task");
    }

    await loadTasks();
  } catch (error) {
    alert("Could not delete task.");
  }
}

saveApiUrlBtn.addEventListener("click", async () => {
  const apiUrl = apiUrlInput.value.trim();

  if (!apiUrl) {
    alert("API URL cannot be empty");
    return;
  }

  localStorage.setItem("TASKOPS_API_URL", apiUrl);
  await checkApiHealth();
  await loadTasks();
});

refreshBtn.addEventListener("click", async () => {
  await checkApiHealth();
  await loadTasks();
});

taskForm.addEventListener("submit", createTask);

apiUrlInput.value = getApiUrl();

checkApiHealth();
loadTasks();
