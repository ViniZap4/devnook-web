<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { themes, darkThemeOrder, lightThemeOrder, type ThemeMode } from '$lib/styles/themes';

	let open = $state(false);

	const modes: ThemeMode[] = ['auto', 'dark', 'light'];
	const modeIcons: Record<ThemeMode, string> = { auto: '\u25D0', dark: '\u25CF', light: '\u25CB' };

	function setMode(m: ThemeMode) {
		themeStore.mode = m;
	}

	function selectTheme(name: string) {
		themeStore.selectTheme(name);
		open = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="relative">
	<button
		onclick={() => { open = !open; }}
		class="flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors text-sm"
		style="border-color: var(--color-border); color: var(--color-text-dim); background: var(--color-surface);"
		aria-label="Change theme"
	>
		<span
			class="w-3 h-3 rounded-full"
			style="background: {themeStore.currentTheme.primary};"
		></span>
		<span class="hidden sm:inline text-xs">{themeStore.currentTheme.label}</span>
		<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if open}
		<button
			class="fixed inset-0 z-40"
			onclick={() => { open = false; }}
			aria-label="Close theme picker"
		></button>
		<div
			class="absolute right-0 top-full mt-2 z-50 rounded-xl border overflow-hidden min-w-56 max-h-[70vh] overflow-y-auto"
			style="background: var(--color-background); border-color: var(--color-border);"
		>
			<!-- Mode selector -->
			<div class="flex border-b" style="border-color: var(--color-border); background: var(--color-surface);">
				{#each modes as m}
					<button
						onclick={() => setMode(m)}
						class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs transition-colors"
						style="color: {themeStore.mode === m ? 'var(--color-primary)' : 'var(--color-text-dim)'}; background: {themeStore.mode === m ? 'var(--color-overlay)' : 'transparent'};"
					>
						<span>{modeIcons[m]}</span>
						<span class="capitalize">{m}</span>
					</button>
				{/each}
			</div>

			<!-- Dark themes -->
			{#if themeStore.mode !== 'light'}
				<div class="px-3 pt-3 pb-1">
					<span class="text-[10px] uppercase tracking-wider font-semibold" style="color: var(--color-muted);">Dark</span>
				</div>
				{#each darkThemeOrder as name}
					{@const t = themes[name]}
					{@const selected = themeStore.isSelected(name)}
					<button
						onclick={() => selectTheme(name)}
						class="w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors"
						style="color: {selected ? t.primary : 'var(--color-text-dim)'}; background: {selected ? 'var(--color-surface)' : 'transparent'};"
						onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
						onmouseleave={(e) => { e.currentTarget.style.background = selected ? 'var(--color-surface)' : 'transparent'; }}
					>
						<div class="flex gap-0.5">
							{#each t.previewColors as color}
								<span class="w-2.5 h-2.5 rounded-sm" style="background: {color};"></span>
							{/each}
						</div>
						<span class="text-xs">{t.label}</span>
						{#if selected}
							<svg class="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{/if}
					</button>
				{/each}
			{/if}

			<!-- Light themes -->
			{#if themeStore.mode !== 'dark'}
				<div class="px-3 pt-3 pb-1" style="border-top: {themeStore.mode === 'auto' ? '1px solid var(--color-separator)' : 'none'};">
					<span class="text-[10px] uppercase tracking-wider font-semibold" style="color: var(--color-muted);">Light</span>
				</div>
				{#each lightThemeOrder as name}
					{@const t = themes[name]}
					{@const selected = themeStore.isSelected(name)}
					<button
						onclick={() => selectTheme(name)}
						class="w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors"
						style="color: {selected ? t.primary : 'var(--color-text-dim)'}; background: {selected ? 'var(--color-surface)' : 'transparent'};"
						onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-surface)'; }}
						onmouseleave={(e) => { e.currentTarget.style.background = selected ? 'var(--color-surface)' : 'transparent'; }}
					>
						<div class="flex gap-0.5">
							{#each t.previewColors as color}
								<span class="w-2.5 h-2.5 rounded-sm" style="background: {color};"></span>
							{/each}
						</div>
						<span class="text-xs">{t.label}</span>
						{#if selected}
							<svg class="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
								<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
							</svg>
						{/if}
					</button>
				{/each}
			{/if}

			<div class="h-1"></div>
		</div>
	{/if}
</div>
