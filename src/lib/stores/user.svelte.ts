import { browser } from '$app/environment';
import { goto } from '$app/navigation';
import { auth, type User } from '$lib/services/api';

let user = $state<User | null>(null);
let token = $state<string | null>(null);
let loading = $state(false);
let needsSetup = $state(false);

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
	get loading() { return loading; },
	get needsSetup() { return needsSetup; },
	get isLoggedIn() { return !!token; },

	async checkSetup() {
		try {
			const res = await auth.checkSetup();
			needsSetup = res.needs_setup;
		} catch {
			needsSetup = false;
		}
	},

	async setup(data: { username: string; email: string; password: string; full_name: string }) {
		loading = true;
		try {
			const res = await auth.setup(data);
			setToken(res.token);
			await this.fetchUser();
		} finally {
			loading = false;
		}
	},

	async login(username: string, password: string) {
		loading = true;
		try {
			const res = await auth.login({ username, password });
			setToken(res.token);
			await this.fetchUser();
		} finally {
			loading = false;
		}
	},

	async fetchUser() {
		if (!token) return;
		try {
			user = await auth.me();
		} catch {
			this.logout();
		}
	},

	logout() {
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
