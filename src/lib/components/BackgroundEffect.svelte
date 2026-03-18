<script lang="ts">
	import { browser } from '$app/environment';
	import { Canvas, T } from '@threlte/core';
	// Stars removed — too noisy for a dev platform UI
	import { themeStore } from '$lib/stores/theme.svelte';
	import { onMount } from 'svelte';
	import Particles3D from './Particles3D.svelte';
	import GridBackground from './GridBackground.svelte';
	import WavesBackground from './WavesBackground.svelte';
	import OrbsBackground from './OrbsBackground.svelte';
	import ConstellationBackground from './ConstellationBackground.svelte';
	import DnaBackground from './DnaBackground.svelte';
	import AuroraBackground from './AuroraBackground.svelte';
	import TunnelBackground from './TunnelBackground.svelte';
	import FirefliesBackground from './FirefliesBackground.svelte';
	import MatrixBackground from './MatrixBackground.svelte';
	import MouseGlow from './MouseGlow.svelte';

	let { mouseX = 0, mouseY = 0 }: { mouseX?: number; mouseY?: number } = $props();

	let isVisible = $state(false);
	let particleCount = $state(120);
	let reducedMotion = $state(false);

	const effect = $derived(themeStore.backgroundEffect);

	// Theme-aware accent color for 3D scenes
	let accentColor = $state('#6366f1');

	function refreshAccent() {
		const style = getComputedStyle(document.documentElement);
		accentColor = style.getPropertyValue('--color-primary').trim() || '#6366f1';
	}

	onMount(() => {
		reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const canvas = document.createElement('canvas');
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
		const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
		const isLowEnd = !gl || isMobile || navigator.hardwareConcurrency <= 2;
		particleCount = isLowEnd ? 60 : 120;

		refreshAccent();
		const observer = new MutationObserver(() => refreshAccent());
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

		requestAnimationFrame(() => {
			isVisible = true;
		});

		return () => observer.disconnect();
	});
</script>

{#if browser && effect !== 'none' && !reducedMotion}
	<div class="fixed inset-0 z-0 pointer-events-none transition-opacity duration-1000" class:opacity-0={!isVisible}>
		{#if isVisible}
			<Canvas>
				<T.PerspectiveCamera makeDefault position={[0, 0, 35]} fov={75} />

				{#if effect === 'grid'}
					<GridBackground {accentColor} />
				{:else if effect === 'waves'}
					<WavesBackground {accentColor} />
				{:else if effect === 'orbs'}
					<OrbsBackground {accentColor} />
				{:else if effect === 'constellation'}
					<ConstellationBackground {accentColor} />
				{:else if effect === 'dna'}
					<DnaBackground {accentColor} />
				{:else if effect === 'aurora'}
					<AuroraBackground {accentColor} />
				{:else if effect === 'tunnel'}
					<TunnelBackground {accentColor} />
				{:else if effect === 'fireflies'}
					<FirefliesBackground {accentColor} />
				{:else if effect === 'matrix'}
					<MatrixBackground {accentColor} />
				{:else}
					<!-- Default: particles -->
					<Particles3D count={particleCount} {mouseX} {mouseY} />
				{/if}
			</Canvas>
		{/if}

		<MouseGlow />

		<!-- Subtle bottom fade only -->
		<div class="absolute inset-0 z-10" style="background: linear-gradient(to top, var(--color-background) 0%, transparent 25%);"></div>
	</div>
{/if}
