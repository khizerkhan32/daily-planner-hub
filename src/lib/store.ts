export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  dueDate: string;
  completed: boolean;
  createdAt: string;
}

const API = "http://localhost:8000/api";

/* ---------------- AUTH ---------------- */

export async function register(
  email: string,
  name: string,
  password: string
): Promise<User | string> {
  try {
    const res = await fetch(`${API}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await res.json();

    if (!res.ok) return data.message || "Registration failed";

    localStorage.setItem("planner_token", data.token);
    // If backend does not return user, create user object from input
    const userObj = data.user || { email, name, id: '', role: 'user', createdAt: '' };
    localStorage.setItem("planner_user", JSON.stringify(userObj));

    return userObj;
  } catch {
    return "Server error";
  }
}

export async function login(
  email: string,
  password: string
): Promise<User | string> {
  try {
    const res = await fetch(`${API}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) return data.message || "Login failed";

    localStorage.setItem("planner_token", data.token);
    localStorage.setItem("planner_user", JSON.stringify(data.user));

    return data.user;
  } catch {
    return "Server error";
  }
}

export function logout() {
  localStorage.removeItem("planner_token");
  localStorage.removeItem("planner_user");
}

export function getUser() {
  const user = localStorage.getItem("planner_user");
  if (!user || user === "undefined") return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}


/* ---------------- TASKS ---------------- */

export async function getTasks(): Promise<Task[]> {
  try {
    const token = localStorage.getItem("planner_token");

    const res = await fetch(`${API}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return [];

    return await res.json();
  } catch {
    return [];
  }
}

export async function addTask(
  task: Omit<Task, "id" | "createdAt">
): Promise<Task | null> {
  try {
    const token = localStorage.getItem("planner_token");

    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(task),
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<boolean> {
  try {
    const token = localStorage.getItem("planner_token");

    const res = await fetch(`${API}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });

    return res.ok;
  } catch {
    return false;
  }
}

export async function toggleTaskCompletion(
  taskId: string,
  completed: boolean
): Promise<boolean> {
  try {
    const token = localStorage.getItem("planner_token");

    const res = await fetch(`${API}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ completed }),
    });

    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const token = localStorage.getItem("planner_token");

    const res = await fetch(`${API}/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.ok;
  } catch {
    return false;
  }
}

/* ---------------- ORDERING ---------------- */

export function getOrderedTasks(tasks: Task[]): Task[] {
  const priorityWeight = { high: 3, medium: 2, low: 1 };

  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    const pw = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (pw !== 0) return pw;

    return (
      new Date(a.dueDate).getTime() -
      new Date(b.dueDate).getTime()
    );
  });
  
}
export function updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>) {
  // Implement API call if needed
}

export function deleteUser(userId: string) {
  // Implement API call if needed
}
export function getAllTasks(userId: string) {
  // Implement API call if needed
}
export function getAllUsers(userId: string) {
  // Implement API call if needed
}

