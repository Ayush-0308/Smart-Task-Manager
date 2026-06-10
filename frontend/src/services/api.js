import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;

    const workspaceId = localStorage.getItem('currentWorkspaceId');
    if (workspaceId) config.headers['X-Workspace-Id'] = workspaceId;

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('currentWorkspaceId');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const completeOnboarding = (data) => api.post('/auth/onboarding', data);

export const getWorkspaces = () => api.get('/workspaces');
export const createWorkspace = (data) => api.post('/workspaces', data);
export const joinWorkspace = (room_code) => api.post('/workspaces/join', { room_code });
export const getWorkspaceMembers = (id) => api.get(`/workspaces/${id}/members`);
export const getWorkspaceActivity = (id) => api.get(`/workspaces/${id}/activity`);
export const regenerateRoomCode = (id) => api.post(`/workspaces/${id}/regenerate-code`);

export const getTasks = (params) => api.get('/tasks', { params });
export const getTaskStats = () => api.get('/tasks/stats');
export const getPriorityTasks = () => api.get('/tasks/priority');
export const getTaskById = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });
export const updateTaskPriority = (id, is_priority) => api.patch(`/tasks/${id}/priority`, { is_priority });
export const reorderPriorityBoard = (taskIds) => api.put('/tasks/priority-board', { taskIds });
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

export default api;
