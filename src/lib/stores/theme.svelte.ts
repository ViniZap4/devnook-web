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

let settings = $state<ThemeSettings>({ mode: 'dark', darkName: 'default-dark', lightName: 'default-light' });

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

export const themeStore = {
	get mode() {
		return settings.mode;
	},
	set mode(m: ThemeMode) {
		settings.mode = m;
		if (browser) {
			applyTheme(resolveTheme(m, settings.darkName, settings.lightName));
			saveThemeSettings(m, settings.darkName, settings.lightName);
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
		}
	},

	isSelected(name: string): boolean {
		const t = themes[name];
		if (!t) return false;
		return t.isDark ? name === settings.darkName : name === settings.lightName;
	},
};
