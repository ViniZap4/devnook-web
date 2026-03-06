<script lang="ts">
	import { browser } from '$app/environment';
	import { themeStore } from '$lib/stores/theme.svelte';

	let { mouseX = 0, mouseY = 0 }: { mouseX?: number; mouseY?: number } = $props();

	let ParticleField: typeof import('./ParticleField.svelte').default | null = $state(null);
	let AuroraCanvas: typeof import('./AuroraCanvas.svelte').default | null = $state(null);

	$effect(() => {
		if (browser && themeStore.backgroundEffect === 'particles' && !ParticleField) {
			import('./ParticleField.svelte').then((mod) => {
				ParticleField = mod.default;
			});
		}
		if (browser && themeStore.backgroundEffect === 'aurora' && !AuroraCanvas) {
			import('./AuroraCanvas.svelte').then((mod) => {
				AuroraCanvas = mod.default;
			});
		}
	});
</script>

{#if browser}
	{#if themeStore.backgroundEffect === 'orbs'}
		<!-- Organic floating orbs — pure CSS, theme-aware -->
		<div class="bg-orb bg-orb-1" aria-hidden="true"></div>
		<div class="bg-orb bg-orb-2" aria-hidden="true"></div>
		<div class="bg-orb bg-orb-3" aria-hidden="true"></div>
		<div class="bg-orb bg-orb-4" aria-hidden="true"></div>
	{:else if themeStore.backgroundEffect === 'mesh'}
		<div class="fixed inset-0 mesh-gradient pointer-events-none" style="z-index: 0;"></div>
	{:else if themeStore.backgroundEffect === 'particles' && ParticleField}
		<ParticleField {mouseX} {mouseY} />
	{:else if themeStore.backgroundEffect === 'aurora' && AuroraCanvas}
		<AuroraCanvas />
	{/if}
{/if}
