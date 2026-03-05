export type ThemeMode = 'dark' | 'light' | 'auto';

export interface Theme {
	name: string;
	label: string;
	isDark: boolean;
	primary: string;
	secondary: string;
	accent: string;
	muted: string;
	background: string;
	surface: string;
	surfaceHover: string;
	overlay: string;
	text: string;
	textDim: string;
	border: string;
	separator: string;
	error: string;
	warning: string;
	success: string;
	info: string;
	previewColors: string[];
}

export interface ThemeSettings {
	mode: ThemeMode;
	darkName: string;
	lightName: string;
}

export const themeOrder: string[] = [
	'default-dark',
	'default-light',
	'tokyo-night',
	'tokyo-day',
	'catppuccin-mocha',
	'catppuccin-latte',
	'dracula',
	'nord',
	'solarized-dark',
	'solarized-light',
	'trans-dark',
	'trans-light',
	'transfem',
	'transmasc',
	'obsidian',
];

export const themes: Record<string, Theme> = {
	'default-dark': {
		name: 'default-dark',
		label: 'Default Dark',
		isDark: true,
		primary: '#7C3AED',
		secondary: '#06B6D4',
		accent: '#8B5CF6',
		muted: '#6B7280',
		background: '#0d1117',
		surface: '#161b22',
		surfaceHover: '#1c2128',
		overlay: '#090c10',
		text: '#e6edf3',
		textDim: '#7d8590',
		border: '#30363d',
		separator: '#21262d',
		error: '#f85149',
		warning: '#d29922',
		success: '#3fb950',
		info: '#58a6ff',
		previewColors: ['#7C3AED', '#06B6D4', '#8B5CF6', '#3fb950'],
	},
	'default-light': {
		name: 'default-light',
		label: 'Default Light',
		isDark: false,
		primary: '#6D28D9',
		secondary: '#0891B2',
		accent: '#7C3AED',
		muted: '#6B7280',
		background: '#ffffff',
		surface: '#f6f8fa',
		surfaceHover: '#eaeef2',
		overlay: '#ffffff',
		text: '#1f2328',
		textDim: '#656d76',
		border: '#d0d7de',
		separator: '#d8dee4',
		error: '#cf222e',
		warning: '#9a6700',
		success: '#1a7f37',
		info: '#0969da',
		previewColors: ['#6D28D9', '#0891B2', '#7C3AED', '#1a7f37'],
	},
	'tokyo-night': {
		name: 'tokyo-night',
		label: 'Tokyo Night',
		isDark: true,
		primary: '#7aa2f7',
		secondary: '#bb9af7',
		accent: '#7dcfff',
		muted: '#565f89',
		background: '#1a1b26',
		surface: '#16161e',
		surfaceHover: '#292e42',
		overlay: '#16161e',
		text: '#c0caf5',
		textDim: '#565f89',
		border: '#3b4261',
		separator: '#292e42',
		error: '#f7768e',
		warning: '#e0af68',
		success: '#9ece6a',
		info: '#7dcfff',
		previewColors: ['#7aa2f7', '#7dcfff', '#bb9af7', '#9ece6a'],
	},
	'tokyo-day': {
		name: 'tokyo-day',
		label: 'Tokyo Day',
		isDark: false,
		primary: '#2e7de9',
		secondary: '#9854f1',
		accent: '#007197',
		muted: '#8990b3',
		background: '#e1e2e7',
		surface: '#d5d6db',
		surfaceHover: '#c4c8da',
		overlay: '#e9e9ec',
		text: '#3760bf',
		textDim: '#8990b3',
		border: '#a8aecb',
		separator: '#c4c8da',
		error: '#f52a65',
		warning: '#8c6c3e',
		success: '#587539',
		info: '#007197',
		previewColors: ['#2e7de9', '#007197', '#9854f1', '#587539'],
	},
	'catppuccin-mocha': {
		name: 'catppuccin-mocha',
		label: 'Catppuccin Mocha',
		isDark: true,
		primary: '#cba6f7',
		secondary: '#89b4fa',
		accent: '#f5c2e7',
		muted: '#6c7086',
		background: '#1e1e2e',
		surface: '#181825',
		surfaceHover: '#313244',
		overlay: '#181825',
		text: '#cdd6f4',
		textDim: '#6c7086',
		border: '#45475a',
		separator: '#313244',
		error: '#f38ba8',
		warning: '#f9e2af',
		success: '#a6e3a1',
		info: '#89dceb',
		previewColors: ['#cba6f7', '#f5c2e7', '#89b4fa', '#a6e3a1'],
	},
	'catppuccin-latte': {
		name: 'catppuccin-latte',
		label: 'Catppuccin Latte',
		isDark: false,
		primary: '#8839ef',
		secondary: '#1e66f5',
		accent: '#ea76cb',
		muted: '#9ca0b0',
		background: '#eff1f5',
		surface: '#e6e9ef',
		surfaceHover: '#ccd0da',
		overlay: '#e6e9ef',
		text: '#4c4f69',
		textDim: '#9ca0b0',
		border: '#acb0be',
		separator: '#bcc0cc',
		error: '#d20f39',
		warning: '#df8e1d',
		success: '#40a02b',
		info: '#04a5e5',
		previewColors: ['#8839ef', '#ea76cb', '#1e66f5', '#40a02b'],
	},
	'dracula': {
		name: 'dracula',
		label: 'Dracula',
		isDark: true,
		primary: '#bd93f9',
		secondary: '#8be9fd',
		accent: '#ff79c6',
		muted: '#6272a4',
		background: '#282a36',
		surface: '#21222c',
		surfaceHover: '#44475a',
		overlay: '#21222c',
		text: '#f8f8f2',
		textDim: '#6272a4',
		border: '#44475a',
		separator: '#44475a',
		error: '#ff5555',
		warning: '#f1fa8c',
		success: '#50fa7b',
		info: '#8be9fd',
		previewColors: ['#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b'],
	},
	'nord': {
		name: 'nord',
		label: 'Nord',
		isDark: true,
		primary: '#88c0d0',
		secondary: '#81a1c1',
		accent: '#5e81ac',
		muted: '#4c566a',
		background: '#2e3440',
		surface: '#3b4252',
		surfaceHover: '#434c5e',
		overlay: '#2e3440',
		text: '#eceff4',
		textDim: '#4c566a',
		border: '#434c5e',
		separator: '#3b4252',
		error: '#bf616a',
		warning: '#ebcb8b',
		success: '#a3be8c',
		info: '#88c0d0',
		previewColors: ['#88c0d0', '#81a1c1', '#5e81ac', '#a3be8c'],
	},
	'solarized-dark': {
		name: 'solarized-dark',
		label: 'Solarized Dark',
		isDark: true,
		primary: '#268bd2',
		secondary: '#2aa198',
		accent: '#6c71c4',
		muted: '#586e75',
		background: '#002b36',
		surface: '#073642',
		surfaceHover: '#0a4959',
		overlay: '#002028',
		text: '#839496',
		textDim: '#586e75',
		border: '#094959',
		separator: '#073642',
		error: '#dc322f',
		warning: '#b58900',
		success: '#859900',
		info: '#268bd2',
		previewColors: ['#268bd2', '#2aa198', '#6c71c4', '#859900'],
	},
	'solarized-light': {
		name: 'solarized-light',
		label: 'Solarized Light',
		isDark: false,
		primary: '#268bd2',
		secondary: '#2aa198',
		accent: '#6c71c4',
		muted: '#93a1a1',
		background: '#fdf6e3',
		surface: '#eee8d5',
		surfaceHover: '#e4ddc8',
		overlay: '#fdf6e3',
		text: '#657b83',
		textDim: '#93a1a1',
		border: '#d3cbb7',
		separator: '#eee8d5',
		error: '#dc322f',
		warning: '#b58900',
		success: '#859900',
		info: '#268bd2',
		previewColors: ['#268bd2', '#2aa198', '#6c71c4', '#859900'],
	},
	'trans-dark': {
		name: 'trans-dark',
		label: 'Trans Dark',
		isDark: true,
		primary: '#5bcefa',
		secondary: '#f5a9b8',
		accent: '#ffffff',
		muted: '#7f8c8d',
		background: '#1a1a2e',
		surface: '#16162a',
		surfaceHover: '#2d2d44',
		overlay: '#141425',
		text: '#ecf0f1',
		textDim: '#7f8c8d',
		border: '#3d3d5c',
		separator: '#2d2d44',
		error: '#ff6b6b',
		warning: '#ffd93d',
		success: '#6bcb77',
		info: '#5bcefa',
		previewColors: ['#5bcefa', '#f5a9b8', '#ffffff', '#6bcb77'],
	},
	'trans-light': {
		name: 'trans-light',
		label: 'Trans Light',
		isDark: false,
		primary: '#5bcefa',
		secondary: '#f5a9b8',
		accent: '#333333',
		muted: '#8d99ae',
		background: '#f5f5ff',
		surface: '#eaeaf8',
		surfaceHover: '#dcdcf0',
		overlay: '#edf2f4',
		text: '#2b2d42',
		textDim: '#8d99ae',
		border: '#c5c5dd',
		separator: '#dcdcf0',
		error: '#e63946',
		warning: '#e76f51',
		success: '#2a9d8f',
		info: '#5bcefa',
		previewColors: ['#5bcefa', '#f5a9b8', '#333333', '#2a9d8f'],
	},
	'transfem': {
		name: 'transfem',
		label: 'Transfem',
		isDark: true,
		primary: '#f4a7b9',
		secondary: '#c9b1e8',
		accent: '#87ceeb',
		muted: '#7a6e7e',
		background: '#1a1520',
		surface: '#211a28',
		surfaceHover: '#2e2238',
		overlay: '#130f1a',
		text: '#f0e6f6',
		textDim: '#7a6e7e',
		border: '#3d2e4a',
		separator: '#2e2238',
		error: '#ff6b8a',
		warning: '#ffd6a5',
		success: '#87ceeb',
		info: '#c9b1e8',
		previewColors: ['#f4a7b9', '#c9b1e8', '#87ceeb', '#f0e6f6'],
	},
	'transmasc': {
		name: 'transmasc',
		label: 'Transmasc',
		isDark: true,
		primary: '#5ba3d9',
		secondary: '#f4a7b9',
		accent: '#d8eaf8',
		muted: '#6e7a8a',
		background: '#0f1820',
		surface: '#152030',
		surfaceHover: '#1c2e3f',
		overlay: '#0a1018',
		text: '#ddeeff',
		textDim: '#6e7a8a',
		border: '#2a4060',
		separator: '#1c2e3f',
		error: '#ff7096',
		warning: '#ffd6a5',
		success: '#5ba3d9',
		info: '#d8eaf8',
		previewColors: ['#5ba3d9', '#d8eaf8', '#f4a7b9', '#ddeeff'],
	},
	'obsidian': {
		name: 'obsidian',
		label: 'Obsidian',
		isDark: true,
		primary: '#a882ff',
		secondary: '#7c6f9e',
		accent: '#c792ea',
		muted: '#5c5c5c',
		background: '#1e1e1e',
		surface: '#252525',
		surfaceHover: '#2d2d2d',
		overlay: '#161616',
		text: '#dcddde',
		textDim: '#5c5c5c',
		border: '#3c3c3c',
		separator: '#2d2d2d',
		error: '#e05561',
		warning: '#d19a66',
		success: '#98c379',
		info: '#56b6c2',
		previewColors: ['#a882ff', '#c792ea', '#7c6f9e', '#98c379'],
	},
};

export const darkThemeOrder = themeOrder.filter((n) => themes[n].isDark);
export const lightThemeOrder = themeOrder.filter((n) => !themes[n].isDark);

const SETTINGS_KEY = 'devnook-theme-settings';

export function applyTheme(name: string): void {
	const t = themes[name];
	if (!t) return;
	const root = document.documentElement;
	const props: Record<string, string> = {
		'--color-primary': t.primary,
		'--color-secondary': t.secondary,
		'--color-accent': t.accent,
		'--color-muted': t.muted,
		'--color-background': t.background,
		'--color-surface': t.surface,
		'--color-surface-hover': t.surfaceHover,
		'--color-overlay': t.overlay,
		'--color-text': t.text,
		'--color-text-dim': t.textDim,
		'--color-border': t.border,
		'--color-separator': t.separator,
		'--color-error': t.error,
		'--color-warning': t.warning,
		'--color-success': t.success,
		'--color-info': t.info,
	};
	for (const [k, v] of Object.entries(props)) {
		root.style.setProperty(k, v);
	}
}

export function resolveTheme(mode: ThemeMode, darkName: string, lightName: string): string {
	if (mode === 'dark') return darkName;
	if (mode === 'light') return lightName;
	const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
	return prefersDark ? darkName : lightName;
}

export function loadThemeSettings(): ThemeSettings {
	const saved = localStorage.getItem(SETTINGS_KEY);
	if (saved) {
		try {
			const s = JSON.parse(saved);
			if (s.mode && s.darkName && s.lightName) return s as ThemeSettings;
		} catch {
			// corrupted
		}
	}
	return { mode: 'dark', darkName: 'default-dark', lightName: 'default-light' };
}

export function saveThemeSettings(mode: ThemeMode, darkName: string, lightName: string): void {
	localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode, darkName, lightName }));
}

export function watchSystemTheme(callback: (isDark: boolean) => void): () => void {
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	const handler = (e: MediaQueryListEvent) => callback(e.matches);
	mq.addEventListener('change', handler);
	return () => mq.removeEventListener('change', handler);
}
