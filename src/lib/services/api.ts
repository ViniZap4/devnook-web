const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';

function getToken(): string | null {
	try {
		return localStorage.getItem('token');
	} catch {
		return null;
	}
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' };
	const token = getToken();
	if (token) headers['Authorization'] = `Bearer ${token}`;

	const res = await fetch(`${BASE_URL}${path}`, {
		method,
		headers,
		body: body ? JSON.stringify(body) : undefined
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(err.error || res.statusText);
	}

	if (res.status === 204) return undefined as T;
	return res.json();
}

// Auth
export interface TokenResponse {
	token: string;
}

export interface SetupStatus {
	needs_setup: boolean;
}

export interface User {
	id: number;
	username: string;
	email: string;
	full_name: string;
	avatar_url: string;
	is_admin: boolean;
}

export const auth = {
	checkSetup: () => request<SetupStatus>('GET', '/api/v1/auth/setup'),
	setup: (data: { username: string; email: string; password: string; full_name: string }) =>
		request<TokenResponse>('POST', '/api/v1/auth/setup', data),
	login: (data: { username: string; password: string }) =>
		request<TokenResponse>('POST', '/api/v1/auth/login', data),
	register: (data: { username: string; email: string; password: string; full_name: string }) =>
		request<TokenResponse>('POST', '/api/v1/auth/register', data),
	me: () => request<User>('GET', '/api/v1/users/me')
};

// Shortcuts
export interface Shortcut {
	id: number;
	title: string;
	url: string;
	icon_url: string;
	color: string;
}

export const shortcuts = {
	list: () => request<Shortcut[]>('GET', '/api/v1/shortcuts'),
	create: (data: { title: string; url: string }) =>
		request<{ id: number }>('POST', '/api/v1/shortcuts', data),
	update: (id: number, data: { title: string; url: string }) =>
		request<void>('PUT', `/api/v1/shortcuts/${id}`, data),
	remove: (id: number) => request<void>('DELETE', `/api/v1/shortcuts/${id}`)
};
