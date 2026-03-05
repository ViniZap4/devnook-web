const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';

// 401 callback — registered by userStore after init to trigger auto-logout
let _onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(cb: () => void) { _onUnauthorized = cb; }

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
		// Auto-logout on 401 for non-auth endpoints (expired token mid-session)
		if (res.status === 401 && !path.startsWith('/api/v1/auth/')) {
			_onUnauthorized?.();
		}
		const err = await res.json().catch(() => ({ error: res.statusText }));
		throw new Error(err.error || res.statusText);
	}

	if (res.status === 204) return undefined as T;
	return res.json();
}

// Auth
export interface AuthResponse {
	token: string;
	user: User;
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
	created_at: string;
	updated_at: string;
}

export const auth = {
	checkSetup: () => request<SetupStatus>('GET', '/api/v1/auth/setup'),
	setup: (data: { username: string; email: string; password: string; full_name: string }) =>
		request<AuthResponse>('POST', '/api/v1/auth/setup', data),
	login: (data: { username: string; password: string }) =>
		request<AuthResponse>('POST', '/api/v1/auth/login', data),
	register: (data: { username: string; email: string; password: string; full_name: string }) =>
		request<AuthResponse>('POST', '/api/v1/auth/register', data),
	me: () => request<User>('GET', '/api/v1/users/me')
};

// Users
export interface UserProfile {
	user: User;
	repos: import('$lib/types/repository').Repository[];
}

export interface DashboardStats {
	total_repos: number;
	total_orgs: number;
	open_issues: number;
	total_commits: number;
}

export const users = {
	profile: (username: string) => request<UserProfile>('GET', `/api/v1/users/${username}`),
	updateProfile: (data: { full_name: string; email: string; avatar_url: string }) =>
		request<void>('PUT', '/api/v1/users/me', data),
	dashboardStats: () => request<DashboardStats>('GET', '/api/v1/dashboard/stats')
};

// Explore
export interface ExploreResponse {
	repos: import('$lib/types/repository').Repository[];
	total_count: number;
	page: number;
	per_page: number;
	total_pages: number;
}

export const explore = {
	repos: (opts?: { page?: number; q?: string; sort?: string }) => {
		const params = new URLSearchParams();
		if (opts?.page) params.set('page', String(opts.page));
		if (opts?.q) params.set('q', opts.q);
		if (opts?.sort) params.set('sort', opts.sort);
		const qs = params.toString();
		return request<ExploreResponse>('GET', `/api/v1/explore/repos${qs ? '?' + qs : ''}`);
	}
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

// Repositories
import type { Repository, TreeEntry, Commit, Branch, BlobContent, ReadmeContent } from '$lib/types/repository';

export const repos = {
	list: () => request<Repository[]>('GET', '/api/v1/repos'),
	create: (data: { name: string; description: string; is_private: boolean }) =>
		request<{ id: number; name: string; clone_url: string }>('POST', '/api/v1/repos', data),
	get: (owner: string, name: string) =>
		request<Repository>('GET', `/api/v1/repos/${owner}/${name}`),
	remove: (owner: string, name: string) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${name}`),
	tree: (owner: string, name: string, ref: string, path: string = '') =>
		request<TreeEntry[]>('GET', `/api/v1/repos/${owner}/${name}/tree/${ref}/${path}`),
	blob: (owner: string, name: string, ref: string, path: string) =>
		request<BlobContent>('GET', `/api/v1/repos/${owner}/${name}/blob/${ref}/${path}`),
	commits: (owner: string, name: string, ref?: string, page?: number) => {
		const params = new URLSearchParams();
		if (ref) params.set('ref', ref);
		if (page) params.set('page', String(page));
		const qs = params.toString();
		return request<Commit[]>('GET', `/api/v1/repos/${owner}/${name}/commits${qs ? '?' + qs : ''}`);
	},
	branches: (owner: string, name: string) =>
		request<Branch[]>('GET', `/api/v1/repos/${owner}/${name}/branches`),
	readme: (owner: string, name: string, ref?: string) => {
		const qs = ref ? `?ref=${ref}` : '';
		return request<ReadmeContent>('GET', `/api/v1/repos/${owner}/${name}/readme${qs}`);
	}
};

// Organizations
import type { Organization, OrgMember } from '$lib/types/organization';

export const orgs = {
	list: () => request<Organization[]>('GET', '/api/v1/orgs'),
	create: (data: { name: string; display_name: string; description: string }) =>
		request<{ id: number; name: string }>('POST', '/api/v1/orgs', data),
	get: (name: string) => request<Organization>('GET', `/api/v1/orgs/${name}`),
	update: (name: string, data: { display_name: string; description: string }) =>
		request<void>('PUT', `/api/v1/orgs/${name}`, data),
	remove: (name: string) => request<void>('DELETE', `/api/v1/orgs/${name}`),
	members: (name: string) => request<OrgMember[]>('GET', `/api/v1/orgs/${name}/members`),
	addMember: (orgName: string, data: { username: string; role?: string }) =>
		request<void>('POST', `/api/v1/orgs/${orgName}/members`, data),
	updateMember: (orgName: string, username: string, data: { role: string }) =>
		request<void>('PUT', `/api/v1/orgs/${orgName}/members/${username}`, data),
	removeMember: (orgName: string, username: string) =>
		request<void>('DELETE', `/api/v1/orgs/${orgName}/members/${username}`),
	repos: (name: string) => request<Repository[]>('GET', `/api/v1/orgs/${name}/repos`),
	createRepo: (orgName: string, data: { name: string; description: string; is_private: boolean }) =>
		request<{ id: number; name: string }>('POST', `/api/v1/orgs/${orgName}/repos`, data)
};

// Issues
import type { Issue, IssueComment } from '$lib/types/issue';

export const issues = {
	list: (owner: string, repo: string, state?: string) => {
		const qs = state ? `?state=${state}` : '';
		return request<Issue[]>('GET', `/api/v1/repos/${owner}/${repo}/issues${qs}`);
	},
	create: (owner: string, repo: string, data: { title: string; body: string }) =>
		request<{ id: number; number: number }>('POST', `/api/v1/repos/${owner}/${repo}/issues`, data),
	get: (owner: string, repo: string, number: number) =>
		request<Issue>('GET', `/api/v1/repos/${owner}/${repo}/issues/${number}`),
	update: (owner: string, repo: string, number: number, data: { title?: string; body?: string; state?: string }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${repo}/issues/${number}`, data),
	comments: (owner: string, repo: string, number: number) =>
		request<IssueComment[]>('GET', `/api/v1/repos/${owner}/${repo}/issues/${number}/comments`),
	addComment: (owner: string, repo: string, number: number, data: { body: string }) =>
		request<{ id: number }>('POST', `/api/v1/repos/${owner}/${repo}/issues/${number}/comments`, data),
	updateComment: (owner: string, repo: string, number: number, id: number, data: { body: string }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${repo}/issues/${number}/comments/${id}`, data),
	removeComment: (owner: string, repo: string, number: number, id: number) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${repo}/issues/${number}/comments/${id}`)
};
