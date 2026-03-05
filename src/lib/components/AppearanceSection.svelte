<script lang="ts">
	import SwitchButtonTheme from './SwitchButtonTheme.svelte';
	import { themeStore } from '$lib/stores/theme.svelte';
	import { cianoPalette, pinkPalette, orangePalette, bluePalette } from '$lib/styles/colors';

	const palettes = [cianoPalette, pinkPalette, orangePalette, bluePalette];
</script>

<div class="flex flex-col gap-5">
	<div class="flex flex-col gap-3">
		<span class="text-[var(--color-text)] text-xs font-semibold opacity-40 uppercase tracking-wider">Color Palette</span>
		<div class="flex flex-row gap-3">
			{#each palettes as palette}
				<button
					class="palette-option"
					class:active={palette[0] === themeStore.colors[0]}
					onclick={() => { themeStore.colors = palette; }}
					style="--c0: #{palette[0]};"
				aria-label="Select color palette"
				>
					<div class="palette-preview">
						<div class="dot" style="background: #{palette[0]};"></div>
						<div class="dot" style="background: #{palette[2]};"></div>
						<div class="dot" style="background: #{palette[3]};"></div>
					</div>
				</button>
			{/each}
		</div>
	</div>

	<div class="flex flex-col gap-3">
		<span class="text-[var(--color-text)] text-xs font-semibold opacity-40 uppercase tracking-wider">Theme</span>
		<SwitchButtonTheme />
	</div>
</div>

<style>
	.palette-option {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0.5rem;
		border-radius: 0.75rem;
		border: 2px solid transparent;
		transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
		background: rgba(255, 255, 255, 0.04);
	}
	.palette-option:hover {
		background: rgba(255, 255, 255, 0.08);
		transform: scale(1.05);
	}
	.palette-option.active {
		border-color: var(--c0);
		box-shadow: 0 0 12px var(--c0, #fff3);
	}
	.palette-preview {
		display: flex;
		gap: 4px;
	}
	.dot {
		width: 1rem;
		height: 1rem;
		border-radius: 50%;
	}
</style>
