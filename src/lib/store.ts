// localStorage-based store for prototype

export interface User {
  id: string;
  email: string;
  name: string;
  password: string; // prototype only - never do this in production
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

const USERS_KEY = 'planner_users';
const TASKS_KEY = 'planner_tasks';
const SESSION_KEY = 'planner_session';

function getItems<T>(key: string): T[] {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

function setItems<T>(key: string, items: T[]) {
  localStorage.setItem(key, JSON.stringify(items));
}

// Seed admin user
export function seedData() {
  const users = getItems<User>(USERS_KEY);
  if (!users.find(u => u.role === 'admin')) {
    users.push({
      id: crypto.randomUUID(),
      email: 'admin@planner.com',
      name: 'Admin',
      password: 'admin123',
      role: 'admin',
      createdAt: new Date().toISOString(),
    });
    setItems(USERS_KEY, users);
  }
}

// Auth
export function register(email: string, name: string, password: string): User | string {
  const users = getItems<User>(USERS_KEY);
  if (users.find(u => u.email === email)) return 'Email already registered';
  const user: User = {
    id: crypto.randomUUID(),
    email, name, password, role: 'user',
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  setItems(USERS_KEY, users);
  return user;
}

export function login(email: string, password: string): User | string {
  const users = getItems<User>(USERS_KEY);
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return 'Invalid email or password';
  localStorage.setItem(SESSION_KEY, user.id);
  return user;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getCurrentUser(): User | null {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return getItems<User>(USERS_KEY).find(u => u.id === id) || null;
}

export function updateProfile(userId: string, updates: Partial<Pick<User, 'name' | 'email'>>) {
  const users = getItems<User>(USERS_KEY);
  const idx = users.findIndex(u => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], ...updates };
  setItems(USERS_KEY, users);
}

// Tasks
export function getTasks(userId: string): Task[] {
  return getItems<Task>(TASKS_KEY).filter(t => t.userId === userId);
}

export function getAllTasks(): Task[] {
  return getItems<Task>(TASKS_KEY);
}

export function addTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
  const tasks = getItems<Task>(TASKS_KEY);
  const newTask: Task = { ...task, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  tasks.push(newTask);
  setItems(TASKS_KEY, tasks);
  return newTask;
}

export function updateTask(taskId: string, updates: Partial<Task>) {
  const tasks = getItems<Task>(TASKS_KEY);
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx === -1) return;
  tasks[idx] = { ...tasks[idx], ...updates };
  setItems(TASKS_KEY, tasks);
}

export function deleteTask(taskId: string) {
  const tasks = getItems<Task>(TASKS_KEY).filter(t => t.id !== taskId);
  setItems(TASKS_KEY, tasks);
}

// Admin
export function getAllUsers(): User[] {
  return getItems<User>(USERS_KEY);
}

export function deleteUser(userId: string) {
  setItems(USERS_KEY, getItems<User>(USERS_KEY).filter(u => u.id !== userId));
  setItems(TASKS_KEY, getItems<Task>(TASKS_KEY).filter(t => t.userId !== userId));
}

// Smart ordering: high priority first, then by due date (soonest first)
export function getOrderedTasks(tasks: Task[]): Task[] {
  const priorityWeight = { high: 3, medium: 2, low: 1 };
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const pw = priorityWeight[b.priority] - priorityWeight[a.priority];
    if (pw !== 0) return pw;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}
