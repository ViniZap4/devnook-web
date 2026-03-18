<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { sidebarStore, type SidebarMode } from '$lib/stores/sidebar.svelte';
	import { themes, darkThemeOrder, lightThemeOrder, type ThemeMode, type BackgroundEffect } from '$lib/styles/themes';

	const modes: ThemeMode[] = ['auto', 'dark', 'light'];
	const modeLabels: Record<ThemeMode, string> = { auto: 'Auto', dark: 'Dark', light: 'Light' };
	const modeIcons: Record<ThemeMode, string> = {
		auto: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
		dark: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
		light: '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
	};

	const bgEffects: BackgroundEffect[] = ['none', 'particles', 'grid', 'waves', 'orbs', 'constellation', 'dna', 'aurora', 'tunnel', 'fireflies', 'matrix'];
	const bgLabels: Record<BackgroundEffect, string> = {
		none: 'None', particles: 'Particles', grid: 'Grid', waves: 'Waves', orbs: 'Orbs',
		constellation: 'Stars', dna: 'DNA', aurora: 'Aurora', tunnel: 'Tunnel', fireflies: 'Fireflies', matrix: 'Matrix'
	};
	const bgIcons: Record<BackgroundEffect, string> = {
		none: '<circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>',
		particles: '<circle cx="12" cy="12" r="1"/><circle cx="5" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="19" r="1"/><circle cx="19" cy="19" r="1"/>',
		grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18"/>',
		waves: '<path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0"/><path d="M2 16c2-3 4-3 6 0s4 3 6 0 4-3 6 0" opacity="0.5"/>',
		orbs: '<circle cx="7" cy="7" r="4" opacity="0.6"/><circle cx="16" cy="10" r="3" opacity="0.4"/><circle cx="10" cy="16" r="3.5" opacity="0.5"/>',
		constellation: '<circle cx="5" cy="5" r="1.5"/><circle cx="19" cy="8" r="1.5"/><circle cx="12" cy="18" r="1.5"/><line x1="5" y1="5" x2="19" y2="8"/><line x1="19" y1="8" x2="12" y2="18"/><line x1="12" y1="18" x2="5" y2="5"/>',
		dna: '<path d="M6 3v18M18 3v18"/><path d="M6 7h12M6 12h12M6 17h12"/>',
		aurora: '<path d="M2 16c2-4 5-8 10-8s8 4 10 8"/><path d="M2 12c3-5 6-7 10-7s7 2 10 7" opacity="0.5"/>',
		tunnel: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="7" opacity="0.7"/><circle cx="12" cy="12" r="4" opacity="0.4"/><circle cx="12" cy="12" r="1.5"/>',
		fireflies: '<circle cx="5" cy="5" r="1"/><circle cx="18" cy="7" r="1.5"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="14" r="0.8"/><circle cx="12" cy="10" r="1.2"/>',
		matrix: '<text x="3" y="10" font-size="8" fill="currentColor">01</text><text x="12" y="16" font-size="8" fill="currentColor">10</text><text x="6" y="22" font-size="8" fill="currentColor">11</text>',
	};

	const sidebarModes: SidebarMode[] = ['auto', 'expanded', 'compact', 'hidden'];
	const sidebarLabels: Record<SidebarMode, string> = { auto: 'Auto', expanded: 'Expanded', compact: 'Compact', hidden: 'Hidden' };
	const sidebarIcons: Record<SidebarMode, string> = {
		auto: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="9" y1="3" x2="9" y2="21"/><path d="M14 10l2 2-2 2"/>',
		expanded: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="12" y1="3" x2="12" y2="21"/>',
		compact: '<rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="3" x2="7" y2="21"/>',
		hidden: '<path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
	};
</script>

<div class="flex flex-col gap-6">
	<!-- Mode selector -->
	<div class="flex flex-col gap-3">
		<span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Mode</span>
		<div class="flex gap-2">
			{#each modes as m}
				<button
					class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border"
					style="
						color: {themeStore.mode === m ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {themeStore.mode === m ? 'var(--color-primary-subtle)' : 'transparent'};
						border-color: {themeStore.mode === m ? 'var(--color-primary-subtle)' : 'var(--glass-border)'};
						transform: {themeStore.mode === m ? 'scale(1.02)' : 'scale(1)'};
					"
					onclick={() => { themeStore.mode = m; }}
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						{@html modeIcons[m]}
					</svg>
					{modeLabels[m]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Background effect -->
	<div class="flex flex-col gap-3">
		<span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Background</span>
		<div class="grid grid-cols-2 gap-2">
			{#each bgEffects as bg, i}
				<button
					class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border"
					style="
						color: {themeStore.backgroundEffect === bg ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {themeStore.backgroundEffect === bg ? 'var(--color-primary-subtle)' : 'transparent'};
						border-color: {themeStore.backgroundEffect === bg ? 'var(--color-primary-subtle)' : 'var(--glass-border)'};
						transform: {themeStore.backgroundEffect === bg ? 'scale(1.02)' : 'scale(1)'};
						animation: fade-up 0.3s ease both;
						animation-delay: {i * 40}ms;
					"
					onclick={() => { themeStore.backgroundEffect = bg; }}
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						{@html bgIcons[bg]}
					</svg>
					{bgLabels[bg]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Sidebar -->
	<div class="flex flex-col gap-3">
		<span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Sidebar</span>
		<div class="grid grid-cols-2 gap-2">
			{#each sidebarModes as sb, i}
				<button
					class="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 border"
					style="
						color: {sidebarStore.mode === sb ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {sidebarStore.mode === sb ? 'var(--color-primary-subtle)' : 'transparent'};
						border-color: {sidebarStore.mode === sb ? 'var(--color-primary-subtle)' : 'var(--glass-border)'};
						transform: {sidebarStore.mode === sb ? 'scale(1.02)' : 'scale(1)'};
						animation: fade-up 0.3s ease both;
						animation-delay: {i * 40}ms;
					"
					onclick={() => { sidebarStore.mode = sb; }}
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						{@html sidebarIcons[sb]}
					</svg>
					{sidebarLabels[sb]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Dark themes -->
	{#if themeStore.mode !== 'light'}
		<div class="flex flex-col gap-3">
			<span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Dark Theme</span>
			<div class="grid grid-cols-2 gap-2">
				{#each darkThemeOrder as name, i}
					{@const t = themes[name]}
					{@const selected = themeStore.isSelected(name)}
					<button
						class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 group"
						style="
							border-color: {selected ? t.primary : 'var(--glass-border)'};
							background: {selected ? 'rgba(255, 255, 255, 0.06)' : 'transparent'};
							transform: {selected ? 'scale(1.02)' : 'scale(1)'};
							animation: fade-up 0.3s ease both;
							animation-delay: {i * 40}ms;
						"
						onclick={() => themeStore.selectTheme(name)}
						onmouseenter={(e) => { if (!selected) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.borderColor = t.primary; } }}
						onmouseleave={(e) => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--glass-border)'; } }}
					>
						<div class="flex gap-0.5 shrink-0">
							{#each t.previewColors as color}
								<span class="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-105" style="background: {color};"></span>
							{/each}
						</div>
						<span class="text-xs truncate transition-colors duration-200" style="color: {selected ? t.primary : 'var(--color-text-dim)'};">{t.label}</span>
						{#if selected}
							<svg class="w-3 h-3 ml-auto shrink-0" style="color: {t.primary};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Light themes -->
	{#if themeStore.mode !== 'dark'}
		<div class="flex flex-col gap-3">
			<span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Light Theme</span>
			<div class="grid grid-cols-2 gap-2">
				{#each lightThemeOrder as name, i}
					{@const t = themes[name]}
					{@const selected = themeStore.isSelected(name)}
					<button
						class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200 group"
						style="
							border-color: {selected ? t.primary : 'var(--glass-border)'};
							background: {selected ? 'rgba(255, 255, 255, 0.06)' : 'transparent'};
							transform: {selected ? 'scale(1.02)' : 'scale(1)'};
							animation: fade-up 0.3s ease both;
							animation-delay: {i * 40}ms;
						"
						onclick={() => themeStore.selectTheme(name)}
						onmouseenter={(e) => { if (!selected) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)'; e.currentTarget.style.borderColor = t.primary; } }}
						onmouseleave={(e) => { if (!selected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--glass-border)'; } }}
					>
						<div class="flex gap-0.5 shrink-0">
							{#each t.previewColors as color}
								<span class="w-2.5 h-2.5 rounded-full transition-transform duration-200 group-hover:scale-105" style="background: {color};"></span>
							{/each}
						</div>
						<span class="text-xs truncate transition-colors duration-200" style="color: {selected ? t.primary : 'var(--color-text-dim)'};">{t.label}</span>
						{#if selected}
							<svg class="w-3 h-3 ml-auto shrink-0" style="color: {t.primary};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
								<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
							</svg>
						{/if}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
