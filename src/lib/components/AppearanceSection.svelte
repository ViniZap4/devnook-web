<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { themes, darkThemeOrder, lightThemeOrder, type ThemeMode } from '$lib/styles/themes';

	const modes: ThemeMode[] = ['auto', 'dark', 'light'];
	const modeLabels: Record<ThemeMode, string> = { auto: 'Auto', dark: 'Dark', light: 'Light' };
</script>

<div class="flex flex-col gap-6">
	<!-- Mode selector -->
	<div class="flex flex-col gap-3">
		<span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Mode</span>
		<div class="flex gap-2">
			{#each modes as m}
				<button
					class="flex-1 px-3 py-2 rounded-xl text-xs font-medium transition-all border"
					style="
						color: {themeStore.mode === m ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {themeStore.mode === m ? 'var(--color-surface)' : 'transparent'};
						border-color: {themeStore.mode === m ? 'var(--color-primary)30' : 'var(--color-border)'};
					"
					onclick={() => { themeStore.mode = m; }}
				>
					{modeLabels[m]}
				</button>
			{/each}
		</div>
	</div>

	<!-- Dark themes -->
	{#if themeStore.mode !== 'light'}
		<div class="flex flex-col gap-3">
			<span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Dark Theme</span>
			<div class="grid grid-cols-2 gap-2">
				{#each darkThemeOrder as name}
					{@const t = themes[name]}
					{@const selected = themeStore.isSelected(name)}
					<button
						class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
						style="
							border-color: {selected ? t.primary + '60' : 'var(--color-border)'};
							background: {selected ? t.primary + '10' : 'transparent'};
						"
						onclick={() => themeStore.selectTheme(name)}
						onmouseenter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--color-surface)'; }}
						onmouseleave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
					>
						<div class="flex gap-0.5 shrink-0">
							{#each t.previewColors as color}
								<span class="w-2 h-2 rounded-full" style="background: {color};"></span>
							{/each}
						</div>
						<span class="text-xs truncate" style="color: {selected ? t.primary : 'var(--color-text-dim)'};">{t.label}</span>
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
				{#each lightThemeOrder as name}
					{@const t = themes[name]}
					{@const selected = themeStore.isSelected(name)}
					<button
						class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all"
						style="
							border-color: {selected ? t.primary + '60' : 'var(--color-border)'};
							background: {selected ? t.primary + '10' : 'transparent'};
						"
						onclick={() => themeStore.selectTheme(name)}
						onmouseenter={(e) => { if (!selected) e.currentTarget.style.background = 'var(--color-surface)'; }}
						onmouseleave={(e) => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
					>
						<div class="flex gap-0.5 shrink-0">
							{#each t.previewColors as color}
								<span class="w-2 h-2 rounded-full" style="background: {color};"></span>
							{/each}
						</div>
						<span class="text-xs truncate" style="color: {selected ? t.primary : 'var(--color-text-dim)'};">{t.label}</span>
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>
