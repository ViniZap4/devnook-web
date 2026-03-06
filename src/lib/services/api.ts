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
	bio: string;
	location: string;
	website: string;
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
	orgs: import('$lib/types/organization').Organization[];
}

export interface DashboardStats {
	total_repos: number;
	total_orgs: number;
	open_issues: number;
	total_commits: number;
}

// Preferences (server-synced)
export interface UserPreferences {
	theme: string;
	mode: string;
	locale: string;
	settings: Record<string, unknown>;
}

export const users = {
	profile: (username: string) => request<UserProfile>('GET', `/api/v1/users/${username}`),
	updateProfile: (data: { full_name?: string; email?: string; avatar_url?: string; bio?: string; location?: string; website?: string }) =>
		request<void>('PUT', '/api/v1/users/me', data),
	changePassword: (data: { old_password: string; new_password: string }) =>
		request<void>('PUT', '/api/v1/users/me/password', data),
	dashboardStats: () => request<DashboardStats>('GET', '/api/v1/dashboard/stats'),
	activity: () => request<ActivityItem[]>('GET', '/api/v1/dashboard/activity'),
	starred: (username: string) =>
		request<import('$lib/types/repository').Repository[]>('GET', `/api/v1/users/${username}/starred`),
	getPreferences: () => request<UserPreferences>('GET', '/api/v1/users/me/preferences'),
	updatePreferences: (data: UserPreferences) => request<UserPreferences>('PUT', '/api/v1/users/me/preferences', data)
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

// Activity
export interface ActivityItem {
	type: string;
	repo_owner: string;
	repo_name: string;
	title: string;
	author: string;
	number?: number;
	created_at: string;
}

// Language stats
export interface LanguageStat {
	name: string;
	bytes: number;
	percentage: number;
	color: string;
}

// Contributors
export interface Contributor {
	name: string;
	email: string;
	commits: number;
}

// Collaborators
export interface Collaborator {
	id: number;
	username: string;
	full_name: string;
	avatar_url: string;
	permission: string;
	created_at: string;
}

// Repositories
import type { Repository, TreeEntry, Commit, CommitDetail, Branch, Tag, BlobContent, ReadmeContent, BlameLine, CompareResult } from '$lib/types/repository';

export const repos = {
	list: () => request<Repository[]>('GET', '/api/v1/repos'),
	create: (data: { name: string; description: string; is_private: boolean }) =>
		request<{ id: number; name: string; clone_url: string }>('POST', '/api/v1/repos', data),
	get: (owner: string, name: string) =>
		request<Repository>('GET', `/api/v1/repos/${owner}/${name}`),
	update: (owner: string, name: string, data: { description?: string; website?: string; is_private?: boolean; default_branch?: string; topics?: string[] }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${name}`, data),
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
	commitDetail: (owner: string, name: string, hash: string) =>
		request<CommitDetail>('GET', `/api/v1/repos/${owner}/${name}/commits/${hash}`),
	branches: (owner: string, name: string) =>
		request<Branch[]>('GET', `/api/v1/repos/${owner}/${name}/branches`),
	tags: (owner: string, name: string) =>
		request<Tag[]>('GET', `/api/v1/repos/${owner}/${name}/tags`),
	readme: (owner: string, name: string, ref?: string) => {
		const qs = ref ? `?ref=${ref}` : '';
		return request<ReadmeContent>('GET', `/api/v1/repos/${owner}/${name}/readme${qs}`);
	},
	blame: (owner: string, name: string, ref: string, path: string) =>
		request<BlameLine[]>('GET', `/api/v1/repos/${owner}/${name}/blame/${ref}/${path}`),
	compare: (owner: string, name: string, base: string, head: string) =>
		request<CompareResult>('GET', `/api/v1/repos/${owner}/${name}/compare?base=${base}&head=${head}`),

	// Stars
	star: (owner: string, name: string) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${name}/star`),
	unstar: (owner: string, name: string) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${name}/star`),
	isStarred: (owner: string, name: string) =>
		request<{ starred: boolean }>('GET', `/api/v1/repos/${owner}/${name}/star`),
	stargazers: (owner: string, name: string) =>
		request<User[]>('GET', `/api/v1/repos/${owner}/${name}/stargazers`),

	// Forks
	fork: (owner: string, name: string) =>
		request<{ id: number; name: string }>('POST', `/api/v1/repos/${owner}/${name}/forks`),
	forks: (owner: string, name: string) =>
		request<Repository[]>('GET', `/api/v1/repos/${owner}/${name}/forks`),

	// File editor
	createFile: (owner: string, name: string, path: string, data: { content: string; message?: string; branch?: string }) =>
		request<{ message: string }>('POST', `/api/v1/repos/${owner}/${name}/contents/${path}`, data),
	updateFile: (owner: string, name: string, path: string, data: { content: string; message?: string; branch?: string }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${name}/contents/${path}`, data),
	deleteFile: (owner: string, name: string, path: string, data: { message?: string; branch?: string }) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${name}/contents/${path}`, data),

	// Branch management
	createBranch: (owner: string, name: string, data: { name: string; from?: string }) =>
		request<{ message: string }>('POST', `/api/v1/repos/${owner}/${name}/branches`, data),
	deleteBranch: (owner: string, name: string, branch: string) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${name}/branches/${branch}`),

	// Languages
	languages: (owner: string, name: string) =>
		request<LanguageStat[]>('GET', `/api/v1/repos/${owner}/${name}/languages`),

	// Contributors
	contributors: (owner: string, name: string) =>
		request<Contributor[]>('GET', `/api/v1/repos/${owner}/${name}/contributors`),

	// Collaborators
	listCollaborators: (owner: string, name: string) =>
		request<Collaborator[]>('GET', `/api/v1/repos/${owner}/${name}/collaborators`),
	addCollaborator: (owner: string, name: string, data: { username: string; permission?: string }) =>
		request<void>('POST', `/api/v1/repos/${owner}/${name}/collaborators`, data),
	removeCollaborator: (owner: string, name: string, username: string) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${name}/collaborators/${username}`),

	// Transfer
	transfer: (owner: string, name: string, newOwner: string) =>
		request<{ new_owner: string }>('POST', `/api/v1/repos/${owner}/${name}/transfer`, { new_owner: newOwner }),

	// Archive URL (not an API call, returns download URL)
	archiveUrl: (owner: string, name: string, ref: string, format: 'zip' | 'tar.gz' = 'zip') =>
		`${BASE_URL}/api/v1/repos/${owner}/${name}/archive/${ref}.${format}`
};

// Labels
import type { Label, Milestone } from '$lib/types/issue';

export const labels = {
	list: (owner: string, repo: string) =>
		request<Label[]>('GET', `/api/v1/repos/${owner}/${repo}/labels`),
	create: (owner: string, repo: string, data: { name: string; color: string; description?: string }) =>
		request<{ id: number }>('POST', `/api/v1/repos/${owner}/${repo}/labels`, data),
	update: (owner: string, repo: string, id: number, data: { name?: string; color?: string; description?: string }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${repo}/labels/${id}`, data),
	remove: (owner: string, repo: string, id: number) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${repo}/labels/${id}`),
	addToIssue: (owner: string, repo: string, issueNumber: number, labelId: number) =>
		request<void>('POST', `/api/v1/repos/${owner}/${repo}/issues/${issueNumber}/labels`, { label_id: labelId }),
	removeFromIssue: (owner: string, repo: string, issueNumber: number, labelId: number) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${repo}/issues/${issueNumber}/labels/${labelId}`)
};

// Milestones
export const milestones = {
	list: (owner: string, repo: string) =>
		request<Milestone[]>('GET', `/api/v1/repos/${owner}/${repo}/milestones`),
	create: (owner: string, repo: string, data: { title: string; description?: string; due_date?: string }) =>
		request<{ id: number }>('POST', `/api/v1/repos/${owner}/${repo}/milestones`, data),
	update: (owner: string, repo: string, id: number, data: { title?: string; description?: string; state?: string; due_date?: string }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${repo}/milestones/${id}`, data),
	remove: (owner: string, repo: string, id: number) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${repo}/milestones/${id}`)
};

// Releases
import type { Release } from '$lib/types/release';

export const releases = {
	list: (owner: string, repo: string) =>
		request<Release[]>('GET', `/api/v1/repos/${owner}/${repo}/releases`),
	get: (owner: string, repo: string, id: number) =>
		request<Release>('GET', `/api/v1/repos/${owner}/${repo}/releases/${id}`),
	create: (owner: string, repo: string, data: { tag_name: string; title: string; body?: string; is_draft?: boolean; is_prerelease?: boolean }) =>
		request<{ id: number }>('POST', `/api/v1/repos/${owner}/${repo}/releases`, data),
	update: (owner: string, repo: string, id: number, data: { title?: string; body?: string; is_draft?: boolean; is_prerelease?: boolean }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${repo}/releases/${id}`, data),
	remove: (owner: string, repo: string, id: number) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${repo}/releases/${id}`)
};

// Pull Requests
import type { PullRequest, PRComment, PRReview } from '$lib/types/pull_request';

export const pulls = {
	list: (owner: string, repo: string, state?: string) => {
		const qs = state ? `?state=${state}` : '';
		return request<PullRequest[]>('GET', `/api/v1/repos/${owner}/${repo}/pulls${qs}`);
	},
	create: (owner: string, repo: string, data: { title: string; body?: string; head_branch: string; base_branch: string }) =>
		request<{ id: number; number: number }>('POST', `/api/v1/repos/${owner}/${repo}/pulls`, data),
	get: (owner: string, repo: string, number: number) =>
		request<PullRequest>('GET', `/api/v1/repos/${owner}/${repo}/pulls/${number}`),
	update: (owner: string, repo: string, number: number, data: { title?: string; body?: string; state?: string }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${repo}/pulls/${number}`, data),
	merge: (owner: string, repo: string, number: number) =>
		request<void>('POST', `/api/v1/repos/${owner}/${repo}/pulls/${number}/merge`),
	comments: (owner: string, repo: string, number: number) =>
		request<PRComment[]>('GET', `/api/v1/repos/${owner}/${repo}/pulls/${number}/comments`),
	addComment: (owner: string, repo: string, number: number, data: { body: string; path?: string; line?: number }) =>
		request<{ id: number }>('POST', `/api/v1/repos/${owner}/${repo}/pulls/${number}/comments`, data),
	reviews: (owner: string, repo: string, number: number) =>
		request<PRReview[]>('GET', `/api/v1/repos/${owner}/${repo}/pulls/${number}/reviews`),
	addReview: (owner: string, repo: string, number: number, data: { state: string; body: string }) =>
		request<{ id: number }>('POST', `/api/v1/repos/${owner}/${repo}/pulls/${number}/reviews`, data)
};

// Webhooks
import type { Webhook } from '$lib/types/webhook';

export const webhooks = {
	list: (owner: string, repo: string) =>
		request<Webhook[]>('GET', `/api/v1/repos/${owner}/${repo}/hooks`),
	create: (owner: string, repo: string, data: { url: string; secret?: string; events: string[]; active?: boolean }) =>
		request<{ id: number }>('POST', `/api/v1/repos/${owner}/${repo}/hooks`, data),
	update: (owner: string, repo: string, id: number, data: { url?: string; secret?: string; events?: string[]; active?: boolean }) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${repo}/hooks/${id}`, data),
	remove: (owner: string, repo: string, id: number) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${repo}/hooks/${id}`)
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
	list: (owner: string, repo: string, opts?: { state?: string; labels?: string; milestone?: string; assignee?: string; q?: string }) => {
		const params = new URLSearchParams();
		if (opts?.state) params.set('state', opts.state);
		if (opts?.labels) params.set('labels', opts.labels);
		if (opts?.milestone) params.set('milestone', opts.milestone);
		if (opts?.assignee) params.set('assignee', opts.assignee);
		if (opts?.q) params.set('q', opts.q);
		const qs = params.toString();
		return request<Issue[]>('GET', `/api/v1/repos/${owner}/${repo}/issues${qs ? '?' + qs : ''}`);
	},
	create: (owner: string, repo: string, data: { title: string; body: string; milestone_id?: number; assignee_id?: number; label_ids?: number[] }) =>
		request<{ id: number; number: number }>('POST', `/api/v1/repos/${owner}/${repo}/issues`, data),
	get: (owner: string, repo: string, number: number) =>
		request<Issue>('GET', `/api/v1/repos/${owner}/${repo}/issues/${number}`),
	update: (owner: string, repo: string, number: number, data: { title?: string; body?: string; state?: string; milestone_id?: number; assignee_id?: number }) =>
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

// Branch Rules
import type { BranchRule } from '$lib/types/branch_rule';

export const branchRules = {
	list: (owner: string, repo: string) =>
		request<BranchRule[]>('GET', `/api/v1/repos/${owner}/${repo}/branch-rules`),
	create: (owner: string, repo: string, data: Omit<BranchRule, 'id' | 'repo_id' | 'created_at' | 'updated_at'>) =>
		request<{ id: number }>('POST', `/api/v1/repos/${owner}/${repo}/branch-rules`, data),
	update: (owner: string, repo: string, id: number, data: Partial<Omit<BranchRule, 'id' | 'repo_id' | 'created_at' | 'updated_at'>>) =>
		request<void>('PUT', `/api/v1/repos/${owner}/${repo}/branch-rules/${id}`, data),
	remove: (owner: string, repo: string, id: number) =>
		request<void>('DELETE', `/api/v1/repos/${owner}/${repo}/branch-rules/${id}`)
};

// SSH Keys
import type { SSHKey } from '$lib/types/ssh_key';

export const sshKeys = {
	list: () => request<SSHKey[]>('GET', '/api/v1/users/me/keys'),
	create: (data: { name: string; public_key: string }) =>
		request<{ id: number }>('POST', '/api/v1/users/me/keys', data),
	remove: (id: number) => request<void>('DELETE', `/api/v1/users/me/keys/${id}`)
};

// Notifications
import type { Notification, UnreadCount } from '$lib/types/notification';

export const notifications = {
	list: (unread?: boolean) => {
		const qs = unread !== undefined ? `?unread=${unread}` : '';
		return request<Notification[]>('GET', `/api/v1/notifications${qs}`);
	},
	unreadCount: () => request<UnreadCount>('GET', '/api/v1/notifications/unread'),
	markRead: (id: number) => request<void>('PUT', `/api/v1/notifications/${id}/read`),
	markAllRead: () => request<void>('PUT', '/api/v1/notifications/read-all')
};

// Admin
export interface AdminStats {
	total_users: number;
	total_repos: number;
	total_orgs: number;
	total_issues: number;
}

export interface AdminUsersResponse {
	users: User[];
	total_count: number;
	page: number;
	per_page: number;
}

export interface AdminReposResponse {
	repos: import('$lib/types/repository').Repository[];
	total_count: number;
	page: number;
	per_page: number;
	total_pages: number;
}

export const admin = {
	stats: () => request<AdminStats>('GET', '/api/v1/admin/stats'),
	listUsers: (opts?: { page?: number; q?: string }) => {
		const params = new URLSearchParams();
		if (opts?.page) params.set('page', String(opts.page));
		if (opts?.q) params.set('q', opts.q);
		const qs = params.toString();
		return request<AdminUsersResponse>('GET', `/api/v1/admin/users${qs ? '?' + qs : ''}`);
	},
	getUser: (username: string) => request<User>('GET', `/api/v1/admin/users/${username}`),
	updateUser: (username: string, data: { is_admin?: boolean; full_name?: string; email?: string }) =>
		request<void>('PUT', `/api/v1/admin/users/${username}`, data),
	removeUser: (username: string) => request<void>('DELETE', `/api/v1/admin/users/${username}`),
	listRepos: (opts?: { page?: number; q?: string }) => {
		const params = new URLSearchParams();
		if (opts?.page) params.set('page', String(opts.page));
		if (opts?.q) params.set('q', opts.q);
		const qs = params.toString();
		return request<AdminReposResponse>('GET', `/api/v1/admin/repos${qs ? '?' + qs : ''}`);
	},
	listOrgs: () => request<import('$lib/types/organization').Organization[]>('GET', '/api/v1/admin/orgs')
};
