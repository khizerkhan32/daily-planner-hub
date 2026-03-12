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

function getToken() {
  return localStorage.getItem("planner_token");
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

const LS_USERS_KEY = "planner_users";
const LS_TASKS_KEY = "planner_tasks";

function getLocalUsers(): User[] {
  const users = safeJsonParse<User[]>(localStorage.getItem(LS_USERS_KEY), []);
  // De-dupe by id/email (best effort)
  const seen = new Set<string>();
  return users.filter((u) => {
    const k = u.id || u.email;
    if (!k) return false;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function setLocalUsers(users: User[]) {
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(users));
}

function upsertLocalUser(user: User) {
  const existing = getLocalUsers();
  const idx = existing.findIndex((u) => (u.id && u.id === user.id) || u.email === user.email);
  const next = [...existing];
  if (idx >= 0) next[idx] = { ...next[idx], ...user };
  else next.push(user);
  setLocalUsers(next);
}

function getLocalTasks(): Task[] {
  return safeJsonParse<Task[]>(localStorage.getItem(LS_TASKS_KEY), []);
}

function setLocalTasks(tasks: Task[]) {
  localStorage.setItem(LS_TASKS_KEY, JSON.stringify(tasks));
}

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
    // Keep a basic local list for admin UI fallback
    upsertLocalUser(userObj);

    return userObj;
  } catch {
    // Local-only fallback (frontend demo)
    const now = new Date().toISOString();
    const userObj: User = {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      email,
      name,
      role: "user",
      createdAt: now,
    };
    localStorage.setItem("planner_token", "local-demo-token");
    localStorage.setItem("planner_user", JSON.stringify(userObj));
    upsertLocalUser(userObj);
    return userObj;
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
    upsertLocalUser(data.user);

    return data.user;
  } catch {
    // Local-only fallback: accept any credentials that match a locally stored user by email
    const users = getLocalUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) return "Server error";
    localStorage.setItem("planner_token", "local-demo-token");
    localStorage.setItem("planner_user", JSON.stringify(found));
    return found;
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
    const token = getToken();

    const res = await fetch(`${API}/tasks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) return [];

    const data = await res.json();

    return data.map((t: any) => ({
      id: t._id,
      userId: t.user,
      title: t.title,
      description: t.description,
      priority: t.priority,
      dueDate: t.dueDate,
      completed: t.status === "done",
      createdAt: t.createdAt,
    }));
  } catch {
    // Local fallback: tasks stored for demo mode
    return getLocalTasks();
  }
}

export async function addTask(
  task: Omit<Task, "id" | "createdAt">
): Promise<Task | null> {
  try {
    const token = getToken();

    const res = await fetch(`${API}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(task),
    });

    if (!res.ok) return null;

    const data = await res.json();

    return {
      id: data._id,
      userId: data.user,
      title: data.title,
      description: data.description,
      priority: data.priority,
      dueDate: data.dueDate,
      completed: data.status === "done",
      createdAt: data.createdAt,
    };
  } catch {
    // Local fallback
    const now = new Date().toISOString();
    const created: Task = {
      id: crypto?.randomUUID?.() ?? String(Date.now()),
      createdAt: now,
      ...task,
    };
    const existing = getLocalTasks();
    setLocalTasks([created, ...existing]);
    return created;
  }
}

export async function updateTask(
  taskId: string,
  updates: Partial<Task>
): Promise<boolean> {
  try {
    const token = getToken();

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
    // Local fallback
    const existing = getLocalTasks();
    const idx = existing.findIndex((t) => t.id === taskId);
    if (idx < 0) return false;
    const next = [...existing];
    next[idx] = { ...next[idx], ...updates };
    setLocalTasks(next);
    return true;
  }
}

export async function toggleTaskCompletion(
  taskId: string,
  completed: boolean
): Promise<boolean> {
  try {
    const token = getToken();

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
    return updateTask(taskId, { completed });
  }
}

export async function deleteTask(taskId: string): Promise<boolean> {
  try {
    const token = getToken();

    const res = await fetch(`${API}/tasks/${taskId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.ok;
  } catch {
    // Local fallback
    const existing = getLocalTasks();
    const next = existing.filter((t) => t.id !== taskId);
    setLocalTasks(next);
    return next.length !== existing.length;
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
  try {
    const token = localStorage.getItem("planner_token");

    fetch(`${API}/auth/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
  } catch {
    // Handle error if needed
  }
}

/* ---------------- ADMIN (frontend-only with API fallback) ---------------- */

export async function getAllUsers(): Promise<User[]> {
  try {
    const token = getToken();
    const res = await fetch(`${API}/auth/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("bad_response");
    const data = (await res.json()) as User[];
    // also cache locally
    data.forEach(upsertLocalUser);
    return data;
  } catch {
    const local = getLocalUsers();
    const current = getUser();
    if (current) upsertLocalUser(current);
    return local.length ? local : current ? [current] : [];
  }
}

export async function getAllTasks(): Promise<Task[]> {
  try {
    const token = getToken();
    const res = await fetch(`${API}/tasks/all`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("bad_response");
    const data = (await res.json()) as Task[];
    return data;
  } catch {
    return getLocalTasks();
  }
}

export async function deleteUser(userId: string): Promise<boolean> {
  try {
    const token = getToken();
    const res = await fetch(`${API}/auth/user/${userId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("bad_response");
    // also update local cache
    setLocalUsers(getLocalUsers().filter((u) => u.id !== userId));
    // remove tasks for that user in local mode
    setLocalTasks(getLocalTasks().filter((t) => t.userId !== userId));
    return true;
  } catch {
    const before = getLocalUsers();
    const after = before.filter((u) => u.id !== userId);
    setLocalUsers(after);
    setLocalTasks(getLocalTasks().filter((t) => t.userId !== userId));
    return after.length !== before.length;
  }
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const token = getToken();
    const res = await fetch(`${API}/auth/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("bad_response");
    const data = (await res.json()) as User;
    upsertLocalUser(data);
    return data;
  } catch {
    return getLocalUsers().find((u) => u.id === userId) ?? null;
  }
}

