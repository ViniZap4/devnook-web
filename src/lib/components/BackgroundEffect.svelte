<script lang="ts">
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/stores/theme.svelte';
	import AuroraCanvas from './AuroraCanvas.svelte';

	let { mouseX = 0, mouseY = 0 }: { mouseX?: number; mouseY?: number } = $props();

	let ParticleField: typeof import('./ParticleField.svelte').default | null = $state(null);

	// Lazy-load Threlte component only when needed (avoids SSR issues with Three.js)
	$effect(() => {
		if (browser && themeStore.backgroundEffect === 'particles' && !ParticleField) {
			import('./ParticleField.svelte').then((mod) => {
				ParticleField = mod.default;
			});
		}
	});
</script>

{#if browser}
	{#if themeStore.backgroundEffect === 'mesh'}
		<div class="fixed inset-0 mesh-gradient pointer-events-none" style="z-index: 0;"></div>
	{:else if themeStore.backgroundEffect === 'particles' && ParticleField}
		<ParticleField {mouseX} {mouseY} />
	{:else if themeStore.backgroundEffect === 'aurora'}
		<AuroraCanvas />
	{/if}
{/if}
