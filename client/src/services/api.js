/**
 * KheloDisha API Client
 * Centralized fetch wrapper with JWT management and role context.
 */

const API_BASE = '/api';

export function getStoredToken() {
  return localStorage.getItem('khelodisha_token') || '';
}

export function setStoredToken(token) {
  if (token) {
    localStorage.setItem('khelodisha_token', token);
  } else {
    localStorage.removeItem('khelodisha_token');
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem('khelodisha_user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user) {
  if (user) {
    localStorage.setItem('khelodisha_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('khelodisha_user');
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = getStoredToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}
