import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { auth, type User, registerUnauthorizedHandler } from '$lib/services/api';

let user = $state<User | null>(null);
let token = $state<string | null>(null);
let needsSetup = $state(false);
let initialized = $state(false);

if (browser) {
	try {
		token = localStorage.getItem('token');
	} catch {
		// unavailable
	}
}

export const userStore = {
	get user() { return user; },
	get token() { return token; },
	get needsSetup() { return needsSetup; },
	get isLoggedIn() { return !!token && !!user; },
	get initialized() { return initialized; },

	/**
	 * Validate stored token + check setup status.
	 * Called once from root layout before any page renders.
	 */
	async init() {
		if (initialized) return;

		if (token) {
			try {
				user = await auth.me();
			} catch {
				setToken(null);
				user = null;
			}
		}

		// If not authenticated, check if first-run setup is needed
		if (!user) {
			try {
				const res = await auth.checkSetup();
				needsSetup = res.needs_setup;
			} catch {
				needsSetup = false;
			}
		}

		initialized = true;
		registerUnauthorizedHandler(() => userStore.logout());
	},

	async login(username: string, password: string) {
		// Server returns token + user in one response — no second round-trip
		const res = await auth.login({ username, password });
		setToken(res.token);
		user = res.user;
	},

	async setup(data: { username: string; email: string; password: string; full_name: string }) {
		const res = await auth.setup(data);
		setToken(res.token);
		user = res.user;
		needsSetup = false;
	},

	async register(data: { username: string; email: string; password: string; full_name: string }) {
		const res = await auth.register(data);
		setToken(res.token);
		user = res.user;
	},

	async fetchUser() {
		if (!token) return;
		user = await auth.me();
	},

	logout() {
		if (!token && !user) return;
		user = null;
		setToken(null);
		if (browser) goto('/');
	}
};

function setToken(t: string | null) {
	token = t;
	if (browser) {
		try {
			if (t) localStorage.setItem('token', t);
			else localStorage.removeItem('token');
		} catch {
			// unavailable
		}
	}
}
