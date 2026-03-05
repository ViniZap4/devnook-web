import { browser } from '$app/environment';
import {
	type ThemeMode,
	type ThemeSettings,
	themes,
	applyTheme,
	resolveTheme,
	loadThemeSettings,
	saveThemeSettings,
	watchSystemTheme,
} from '$lib/styles/themes';
import { users } from '$lib/services/api';

let settings = $state<ThemeSettings>({ mode: 'dark', darkName: 'default-dark', lightName: 'default-light' });
let syncTimeout: ReturnType<typeof setTimeout> | null = null;

if (browser) {
	settings = loadThemeSettings();
	applyTheme(resolveTheme(settings.mode, settings.darkName, settings.lightName));

	watchSystemTheme(() => {
		if (settings.mode === 'auto') {
			applyTheme(resolveTheme('auto', settings.darkName, settings.lightName));
		}
	});
}

function currentThemeName(): string {
	if (!browser) return settings.darkName;
	return resolveTheme(settings.mode, settings.darkName, settings.lightName);
}

/** Debounced sync to server — avoids hammering API during rapid theme switching */
function syncToServer() {
	if (!browser) return;
	const token = localStorage.getItem('token');
	if (!token) return;

	if (syncTimeout) clearTimeout(syncTimeout);
	syncTimeout = setTimeout(() => {
		users.updatePreferences({
			theme: currentThemeName(),
			mode: settings.mode,
			locale: 'en',
			settings: {
				darkName: settings.darkName,
				lightName: settings.lightName,
			}
		}).catch(() => {
			// server sync is best-effort
		});
	}, 1000);
}

export const themeStore = {
	get mode() {
		return settings.mode;
	},
	set mode(m: ThemeMode) {
		settings.mode = m;
		if (browser) {
			applyTheme(resolveTheme(m, settings.darkName, settings.lightName));
			saveThemeSettings(m, settings.darkName, settings.lightName);
			syncToServer();
		}
	},

	get darkName() {
		return settings.darkName;
	},
	get lightName() {
		return settings.lightName;
	},

	get currentTheme() {
		return themes[currentThemeName()] ?? themes['default-dark'];
	},

	get currentThemeName() {
		return currentThemeName();
	},

	selectTheme(name: string) {
		const t = themes[name];
		if (!t) return;
		if (t.isDark) {
			settings.darkName = name;
		} else {
			settings.lightName = name;
		}
		if (browser) {
			applyTheme(resolveTheme(settings.mode, settings.darkName, settings.lightName));
			saveThemeSettings(settings.mode, settings.darkName, settings.lightName);
			syncToServer();
		}
	},

	isSelected(name: string): boolean {
		const t = themes[name];
		if (!t) return false;
		return t.isDark ? name === settings.darkName : name === settings.lightName;
	},

	/** Load preferences from server and apply (called after login) */
	async loadFromServer() {
		if (!browser) return;
		const token = localStorage.getItem('token');
		if (!token) return;

		try {
			const prefs = await users.getPreferences();
			// Server stores the resolved theme name + mode + dark/light names in settings
			if (prefs.mode === 'dark' || prefs.mode === 'light' || prefs.mode === 'auto') {
				settings.mode = prefs.mode as ThemeMode;
			}
			const s = prefs.settings as Record<string, string> | undefined;
			if (s?.darkName && themes[s.darkName]) {
				settings.darkName = s.darkName;
			}
			if (s?.lightName && themes[s.lightName]) {
				settings.lightName = s.lightName;
			}
			applyTheme(resolveTheme(settings.mode, settings.darkName, settings.lightName));
			saveThemeSettings(settings.mode, settings.darkName, settings.lightName);
		} catch {
			// best-effort — keep local settings
		}
	}
};
