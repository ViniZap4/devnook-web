<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import SwitchButtonTheme from './SwitchButtonTheme.svelte';
	import UserDropdown from './UserDropdown.svelte';
	import CreateDropdown from './CreateDropdown.svelte';
	import { cianoPalette, pinkPalette, orangePalette, bluePalette } from '$lib/styles/colors';

	const palettes = [cianoPalette, pinkPalette, orangePalette, bluePalette];
</script>

<nav class="sticky top-0 z-40 border-b border-white/[0.06]" style="background-color: {themeStore.theme.colors.background}e6; backdrop-filter: blur(20px) saturate(1.3);">
	<div class="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
		<!-- Left -->
		<div class="flex items-center gap-6">
			<a href="/dashboard" class="flex items-center gap-2 shrink-0">
				<div class="w-2.5 h-2.5 rounded-full" style="background-color: #{themeStore.colors[0]};"></div>
				<span class="text-[var(--color-text)] font-bold tracking-tight text-sm">Dev Nook</span>
			</a>
			<div class="hidden sm:flex items-center gap-1">
				<a href="/dashboard" class="nav-link">Dashboard</a>
				<a href="/explore" class="nav-link">Explore</a>
			</div>
		</div>

		<!-- Right -->
		<div class="flex items-center gap-3">
			<!-- Palette dots -->
			<div class="hidden md:flex items-center gap-1">
				{#each palettes as palette}
					<button
						class="palette-btn"
						class:active={palette[0] === themeStore.colors[0]}
						onclick={() => { themeStore.colors = palette; }}
						style="--dot-color: #{palette[0]};"
						aria-label="Switch color palette"
					>
						<div class="w-3 h-3 rounded-full" style="background-color: #{palette[0]};"></div>
					</button>
				{/each}
			</div>

			<div class="w-px h-5 bg-white/[0.06] hidden md:block"></div>

			<SwitchButtonTheme />

			<div class="w-px h-5 bg-white/[0.06]"></div>

			<CreateDropdown />
			<UserDropdown />
		</div>
	</div>
</nav>

<style>
	.nav-link {
		padding: 0.375rem 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-text);
		opacity: 0.5;
		border-radius: 0.375rem;
		transition: opacity 0.15s, background-color 0.15s;
	}
	.nav-link:hover {
		opacity: 1;
		background: rgba(255, 255, 255, 0.04);
	}
	.palette-btn {
		padding: 3px;
		border-radius: 50%;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.palette-btn:hover {
		transform: scale(1.15);
	}
	.palette-btn.active {
		transform: scale(1.2);
		box-shadow: 0 0 10px var(--dot-color), 0 0 3px var(--dot-color);
	}
</style>
