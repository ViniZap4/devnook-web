export type ThemeMode = 'dark' | 'light' | 'auto';
export type BackgroundEffect = 'none' | 'mesh' | 'particles' | 'aurora' | 'orbs';

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
	primarySubtle: string;
	errorSubtle: string;
	warningSubtle: string;
	successSubtle: string;
	infoSubtle: string;
	glassBg: string;
	glassBorder: string;
	glassBorderHover: string;
	primaryGlow: string;
	previewColors: string[];
}

export interface ThemeSettings {
	mode: ThemeMode;
	darkName: string;
	lightName: string;
	backgroundEffect: BackgroundEffect;
}

/**
 * Mix two hex colors at a given ratio (0 = all color1, 1 = all color2).
 * Returns an opaque hex color string.
 */
export function mixColor(hex1: string, hex2: string, ratio: number): string {
	const parse = (h: string) => {
		const c = h.replace('#', '');
		return [
			parseInt(c.substring(0, 2), 16),
			parseInt(c.substring(2, 4), 16),
			parseInt(c.substring(4, 6), 16),
		];
	};
	const [r1, g1, b1] = parse(hex1);
	const [r2, g2, b2] = parse(hex2);
	const mix = (a: number, b: number) => Math.round(a + (b - a) * ratio);
	const toHex = (n: number) => n.toString(16).padStart(2, '0');
	return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
}

/**
 * Compute subtle semantic color variants by mixing into the surface color.
 * Dark themes use 12% ratio, light themes use 8% ratio.
 */
function computeSubtleColors(
	surface: string,
	isDark: boolean,
	colors: { primary: string; error: string; warning: string; success: string; info: string },
): { primarySubtle: string; errorSubtle: string; warningSubtle: string; successSubtle: string; infoSubtle: string } {
	const ratio = isDark ? 0.18 : 0.10;
	return {
		primarySubtle: mixColor(surface, colors.primary, ratio),
		errorSubtle: mixColor(surface, colors.error, ratio),
		warningSubtle: mixColor(surface, colors.warning, ratio),
		successSubtle: mixColor(surface, colors.success, ratio),
		infoSubtle: mixColor(surface, colors.info, ratio),
	};
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

// ── Theme definitions ──────────────────────────────────────────────

const defaultDarkBase = {
	name: 'default-dark',
	label: 'Default Dark',
	isDark: true,
	primary: '#06b6d4',
	secondary: '#8b5cf6',
	accent: '#22d3ee',
	muted: '#6B7280',
	background: '#080c14',
	surface: '#0d1420',
	surfaceHover: '#131d2e',
	overlay: '#040810',
	text: '#f8fafc',
	textDim: '#94a3b8',
	border: '#1e293b',
	separator: '#172033',
	error: '#f85149',
	warning: '#e3b341',
	success: '#3fb950',
	info: '#58a6ff',
	previewColors: ['#06b6d4', '#22d3ee', '#8b5cf6', '#3fb950'],
};

const defaultLightBase = {
	name: 'default-light',
	label: 'Default Light',
	isDark: false,
	primary: '#0891b2',
	secondary: '#7c3aed',
	accent: '#06b6d4',
	muted: '#6B7280',
	background: '#ffffff',
	surface: '#f6f8fa',
	surfaceHover: '#eaeef2',
	overlay: '#ffffff',
	text: '#1f2328',
	textDim: '#59636e',
	border: '#d0d7de',
	separator: '#d8dee4',
	error: '#cf222e',
	warning: '#bf8700',
	success: '#1a7f37',
	info: '#0969da',
	previewColors: ['#0891b2', '#06b6d4', '#7c3aed', '#1a7f37'],
};

// Tokyo Night — official spec: bg #1a1b26, storm #24283b, fg #c0caf5
const tokyoNightBase = {
	name: 'tokyo-night',
	label: 'Tokyo Night',
	isDark: true,
	primary: '#7aa2f7',
	secondary: '#bb9af7',
	accent: '#7dcfff',
	muted: '#565f89',
	background: '#1a1b26',
	surface: '#24283b',
	surfaceHover: '#292e42',
	overlay: '#16161e',
	text: '#c0caf5',
	textDim: '#9aa5ce',
	border: '#3b4261',
	separator: '#292e42',
	error: '#f7768e',
	warning: '#e0af68',
	success: '#9ece6a',
	info: '#7dcfff',
	previewColors: ['#7aa2f7', '#7dcfff', '#bb9af7', '#9ece6a'],
};

// Tokyo Day — official light: bg #e1e2e7, sidebar #d5d6db, fg #343b58
const tokyoDayBase = {
	name: 'tokyo-day',
	label: 'Tokyo Day',
	isDark: false,
	primary: '#2e7de9',
	secondary: '#9854f1',
	accent: '#007197',
	muted: '#8990b3',
	background: '#e1e2e7',
	surface: '#d5d6db',
	surfaceHover: '#cbccd6',
	overlay: '#e9e9ec',
	text: '#343b58',
	textDim: '#6e7191',
	border: '#a8aecb',
	separator: '#c4c8da',
	error: '#f52a65',
	warning: '#8c6c3e',
	success: '#587539',
	info: '#007197',
	previewColors: ['#2e7de9', '#007197', '#9854f1', '#587539'],
};

// Catppuccin Mocha — official spec verified: base #1e1e2e, surface0 #313244, text #cdd6f4
const catppuccinMochaBase = {
	name: 'catppuccin-mocha',
	label: 'Catppuccin Mocha',
	isDark: true,
	primary: '#cba6f7',
	secondary: '#89b4fa',
	accent: '#f5c2e7',
	muted: '#6c7086',
	background: '#1e1e2e',
	surface: '#313244',
	surfaceHover: '#45475a',
	overlay: '#11111b',
	text: '#cdd6f4',
	textDim: '#a6adc8',
	border: '#45475a',
	separator: '#313244',
	error: '#f38ba8',
	warning: '#f9e2af',
	success: '#a6e3a1',
	info: '#89dceb',
	previewColors: ['#cba6f7', '#f5c2e7', '#89b4fa', '#a6e3a1'],
};

// Catppuccin Latte — official spec verified: base #eff1f5, mantle #e6e9ef, text #4c4f69
const catppuccinLatteBase = {
	name: 'catppuccin-latte',
	label: 'Catppuccin Latte',
	isDark: false,
	primary: '#8839ef',
	secondary: '#1e66f5',
	accent: '#ea76cb',
	muted: '#8c8fa1',
	background: '#eff1f5',
	surface: '#e6e9ef',
	surfaceHover: '#ccd0da',
	overlay: '#dce0e8',
	text: '#4c4f69',
	textDim: '#6c6f85',
	border: '#acb0be',
	separator: '#bcc0cc',
	error: '#d20f39',
	warning: '#df8e1d',
	success: '#40a02b',
	info: '#04a5e5',
	previewColors: ['#8839ef', '#ea76cb', '#1e66f5', '#40a02b'],
};

// Dracula — official spec verified: bg #282a36, fg #f8f8f2, current #44475a, comment #6272a4
const draculaBase = {
	name: 'dracula',
	label: 'Dracula',
	isDark: true,
	primary: '#bd93f9',
	secondary: '#8be9fd',
	accent: '#ff79c6',
	muted: '#6272a4',
	background: '#282a36',
	surface: '#343746',
	surfaceHover: '#44475a',
	overlay: '#191a21',
	text: '#f8f8f2',
	textDim: '#b0b4d0',
	border: '#44475a',
	separator: '#343746',
	error: '#ff5555',
	warning: '#ffb86c',
	success: '#50fa7b',
	info: '#8be9fd',
	previewColors: ['#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b'],
};

// Nord — official spec: polar night #2e3440..#4c566a, snow storm #d8dee9..#eceff4, frost #8fbcbb..#5e81ac
const nordBase = {
	name: 'nord',
	label: 'Nord',
	isDark: true,
	primary: '#88c0d0',
	secondary: '#81a1c1',
	accent: '#5e81ac',
	muted: '#616e88',
	background: '#2e3440',
	surface: '#3b4252',
	surfaceHover: '#434c5e',
	overlay: '#272c36',
	text: '#eceff4',
	textDim: '#a5b3c0',
	border: '#434c5e',
	separator: '#3b4252',
	error: '#bf616a',
	warning: '#ebcb8b',
	success: '#a3be8c',
	info: '#88c0d0',
	previewColors: ['#88c0d0', '#81a1c1', '#5e81ac', '#a3be8c'],
};

// Solarized Dark — official: base03 #002b36, base02 #073642, base0 #839496, base1 #93a1a1
const solarizedDarkBase = {
	name: 'solarized-dark',
	label: 'Solarized Dark',
	isDark: true,
	primary: '#268bd2',
	secondary: '#2aa198',
	accent: '#6c71c4',
	muted: '#657b83',
	background: '#002b36',
	surface: '#073642',
	surfaceHover: '#0d4a59',
	overlay: '#001e26',
	text: '#93a1a1',
	textDim: '#839496',
	border: '#1a5c6b',
	separator: '#0d4a59',
	error: '#dc322f',
	warning: '#b58900',
	success: '#859900',
	info: '#268bd2',
	previewColors: ['#268bd2', '#2aa198', '#6c71c4', '#859900'],
};

// Solarized Light — official: base3 #fdf6e3, base2 #eee8d5, base00 #657b83, base01 #586e75
const solarizedLightBase = {
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
	overlay: '#dfd8c3',
	text: '#073642',
	textDim: '#586e75',
	border: '#d3cbb7',
	separator: '#eee8d5',
	error: '#dc322f',
	warning: '#b58900',
	success: '#859900',
	info: '#268bd2',
	previewColors: ['#268bd2', '#2aa198', '#6c71c4', '#859900'],
};

const transDarkBase = {
	name: 'trans-dark',
	label: 'Trans Dark',
	isDark: true,
	primary: '#5bcefa',
	secondary: '#f5a9b8',
	accent: '#ffffff',
	muted: '#7f8c8d',
	background: '#1a1a2e',
	surface: '#222240',
	surfaceHover: '#2d2d50',
	overlay: '#141425',
	text: '#ecf0f1',
	textDim: '#aab2be',
	border: '#3d3d5c',
	separator: '#2d2d44',
	error: '#ff6b6b',
	warning: '#ffd93d',
	success: '#6bcb77',
	info: '#5bcefa',
	previewColors: ['#5bcefa', '#f5a9b8', '#ffffff', '#6bcb77'],
};

const transLightBase = {
	name: 'trans-light',
	label: 'Trans Light',
	isDark: false,
	primary: '#1a9bcf',
	secondary: '#d4657a',
	accent: '#333333',
	muted: '#8d99ae',
	background: '#f5f5ff',
	surface: '#eaeaf8',
	surfaceHover: '#dcdcf0',
	overlay: '#edf2f4',
	text: '#2b2d42',
	textDim: '#555c75',
	border: '#c5c5dd',
	separator: '#dcdcf0',
	error: '#e63946',
	warning: '#e76f51',
	success: '#2a9d8f',
	info: '#5bcefa',
	previewColors: ['#5bcefa', '#f5a9b8', '#333333', '#2a9d8f'],
};

const transfemBase = {
	name: 'transfem',
	label: 'Transfem',
	isDark: true,
	primary: '#f4a7b9',
	secondary: '#c9b1e8',
	accent: '#87ceeb',
	muted: '#7a6e7e',
	background: '#1a1520',
	surface: '#241d2e',
	surfaceHover: '#342840',
	overlay: '#130f1a',
	text: '#f0e6f6',
	textDim: '#b0a4b8',
	border: '#3d2e4a',
	separator: '#2e2238',
	error: '#ff6b8a',
	warning: '#ffd6a5',
	success: '#a6e3a1',
	info: '#87ceeb',
	previewColors: ['#f4a7b9', '#c9b1e8', '#87ceeb', '#f0e6f6'],
};

const transmascBase = {
	name: 'transmasc',
	label: 'Transmasc',
	isDark: true,
	primary: '#5ba3d9',
	secondary: '#f4a7b9',
	accent: '#d8eaf8',
	muted: '#6e7a8a',
	background: '#0f1820',
	surface: '#182430',
	surfaceHover: '#1f3040',
	overlay: '#0a1018',
	text: '#ddeeff',
	textDim: '#8fa4b8',
	border: '#2a4060',
	separator: '#1c2e3f',
	error: '#ff7096',
	warning: '#ffd6a5',
	success: '#8fc98a',
	info: '#7dcfff',
	previewColors: ['#5ba3d9', '#d8eaf8', '#f4a7b9', '#ddeeff'],
};

const obsidianBase = {
	name: 'obsidian',
	label: 'Obsidian',
	isDark: true,
	primary: '#a882ff',
	secondary: '#61afef',
	accent: '#c792ea',
	muted: '#5c5c5c',
	background: '#1e1e1e',
	surface: '#282828',
	surfaceHover: '#323232',
	overlay: '#161616',
	text: '#dcddde',
	textDim: '#a0a0a0',
	border: '#404040',
	separator: '#2d2d2d',
	error: '#e06c75',
	warning: '#e5c07b',
	success: '#98c379',
	info: '#61afef',
	previewColors: ['#a882ff', '#c792ea', '#61afef', '#98c379'],
};

// ── Build themes with computed subtle colors ───────────────────────

type BaseTheme = Omit<Theme, 'primarySubtle' | 'errorSubtle' | 'warningSubtle' | 'successSubtle' | 'infoSubtle' | 'glassBg' | 'glassBorder' | 'glassBorderHover' | 'primaryGlow'>;

function computeGlassProps(theme: BaseTheme): Pick<Theme, 'glassBg' | 'glassBorder' | 'glassBorderHover' | 'primaryGlow'> {
	// Parse the surface hex to RGB
	const r = parseInt(theme.surface.slice(1, 3), 16);
	const g = parseInt(theme.surface.slice(3, 5), 16);
	const b = parseInt(theme.surface.slice(5, 7), 16);
	const alpha = theme.isDark ? 0.8 : 0.85;

	// Parse primary for glow
	const pr = parseInt(theme.primary.slice(1, 3), 16);
	const pg = parseInt(theme.primary.slice(3, 5), 16);
	const pb = parseInt(theme.primary.slice(5, 7), 16);

	return {
		glassBg: `rgba(${r}, ${g}, ${b}, ${alpha})`,
		glassBorder: theme.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
		glassBorderHover: theme.isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(0, 0, 0, 0.14)',
		primaryGlow: `rgba(${pr}, ${pg}, ${pb}, 0.15)`,
	};
}

function buildTheme(base: BaseTheme): Theme {
	const subtle = computeSubtleColors(base.surface, base.isDark, {
		primary: base.primary,
		error: base.error,
		warning: base.warning,
		success: base.success,
		info: base.info,
	});
	const glass = computeGlassProps(base);
	return { ...base, ...subtle, ...glass };
}

export const themes: Record<string, Theme> = {
	'default-dark': buildTheme(defaultDarkBase),
	'default-light': buildTheme(defaultLightBase),
	'tokyo-night': buildTheme(tokyoNightBase),
	'tokyo-day': buildTheme(tokyoDayBase),
	'catppuccin-mocha': buildTheme(catppuccinMochaBase),
	'catppuccin-latte': buildTheme(catppuccinLatteBase),
	'dracula': buildTheme(draculaBase),
	'nord': buildTheme(nordBase),
	'solarized-dark': buildTheme(solarizedDarkBase),
	'solarized-light': buildTheme(solarizedLightBase),
	'trans-dark': buildTheme(transDarkBase),
	'trans-light': buildTheme(transLightBase),
	'transfem': buildTheme(transfemBase),
	'transmasc': buildTheme(transmascBase),
	'obsidian': buildTheme(obsidianBase),
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
		'--color-primary-subtle': t.primarySubtle,
		'--color-error-subtle': t.errorSubtle,
		'--color-warning-subtle': t.warningSubtle,
		'--color-success-subtle': t.successSubtle,
		'--color-info-subtle': t.infoSubtle,
		'--glass-bg': t.glassBg,
		'--glass-border': t.glassBorder,
		'--glass-border-hover': t.glassBorderHover,
		'--primary-glow': t.primaryGlow,
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
			if (s.mode && s.darkName && s.lightName) return { backgroundEffect: 'orbs', ...s } as ThemeSettings;
		} catch {
			// corrupted
		}
	}
	return { mode: 'dark', darkName: 'default-dark', lightName: 'default-light', backgroundEffect: 'orbs' };
}

export function saveThemeSettings(mode: ThemeMode, darkName: string, lightName: string, backgroundEffect: BackgroundEffect = 'orbs'): void {
	localStorage.setItem(SETTINGS_KEY, JSON.stringify({ mode, darkName, lightName, backgroundEffect }));
}

export function watchSystemTheme(callback: (isDark: boolean) => void): () => void {
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	const handler = (e: MediaQueryListEvent) => callback(e.matches);
	mq.addEventListener('change', handler);
	return () => mq.removeEventListener('change', handler);
}
