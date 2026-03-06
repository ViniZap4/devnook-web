import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { auth, type User, registerUnauthorizedHandler } from '$lib/services/api';
import { themeStore } from '$lib/stores/theme.svelte';

let user = $state<User | null>(null);
let token = $state<string | null>(null);
let needsSetup = $state(false);
let initialized = $state(false);
let loggingOut = $state(false);

if (browser) {
	try {
		token = localStorage.getItem('token');
		const cached = localStorage.getItem('user');
		if (cached && token) {
			user = JSON.parse(cached);
		}
	} catch {
		// unavailable or corrupted
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
	 * If user is cached, show immediately and revalidate silently.
	 */
	async init() {
		registerUnauthorizedHandler(() => userStore.logout());

		if (token) {
			if (user) {
				// User is cached — mark as initialized immediately, revalidate in background
				initialized = true;
				// Silently refresh user data + sync theme
				auth.me().then((fresh) => {
					user = fresh;
					persistUser(fresh);
				}).catch((err) => {
					// Only logout on auth errors (401), not network failures
					// The request() function already triggers onUnauthorized for 401s,
					// so network errors (TypeError) should keep the session alive.
					if (err instanceof TypeError) {
						// Network error — server unreachable, keep cached session
						return;
					}
					// Explicit auth error — force logout
					userStore.logout();
				});
				themeStore.loadFromServer();
				return;
			}
			// Token exists but no cached user — must fetch
			try {
				const fresh = await auth.me();
				user = fresh;
				persistUser(fresh);
				initialized = true;
				themeStore.loadFromServer();
				return;
			} catch (err) {
				// Network error — keep token, will retry on next load
				if (!(err instanceof TypeError)) {
					setToken(null);
					user = null;
					clearPersistedUser();
				}
			}
		}

		// If not authenticated, check if first-run setup is needed
		try {
			const res = await auth.checkSetup();
			needsSetup = res.needs_setup;
		} catch {
			needsSetup = false;
		}

		initialized = true;
	},

	async login(username: string, password: string) {
		const res = await auth.login({ username, password });
		setToken(res.token);
		user = res.user;
		persistUser(res.user);
		themeStore.loadFromServer();
	},

	async setup(data: { username: string; email: string; password: string; full_name: string }) {
		const res = await auth.setup(data);
		setToken(res.token);
		user = res.user;
		persistUser(res.user);
		needsSetup = false;
	},

	async register(data: { username: string; email: string; password: string; full_name: string }) {
		const res = await auth.register(data);
		setToken(res.token);
		user = res.user;
		persistUser(res.user);
	},

	async fetchUser() {
		if (!token) return;
		const fresh = await auth.me();
		user = fresh;
		persistUser(fresh);
	},

	logout() {
		if (loggingOut) return;
		if (!token && !user) return;
		loggingOut = true;
		user = null;
		setToken(null);
		clearPersistedUser();
		initialized = false;
		needsSetup = false;
		if (browser) {
			goto('/').finally(() => { loggingOut = false; });
		} else {
			loggingOut = false;
		}
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

function persistUser(u: User) {
	if (browser) {
		try {
			localStorage.setItem('user', JSON.stringify(u));
		} catch {
			// unavailable
		}
	}
}

function clearPersistedUser() {
	if (browser) {
		try {
			localStorage.removeItem('user');
		} catch {
			// unavailable
		}
	}
}
