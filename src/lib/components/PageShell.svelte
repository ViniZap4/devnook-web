<script lang="ts">
	import Navbar from './Navbar.svelte';
	import Footer from './Footer.svelte';
	import BackgroundEffect from './BackgroundEffect.svelte';
	import type { Snippet } from 'svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let { children, maxWidth = 'max-w-6xl' }: { children: Snippet; maxWidth?: string } = $props();

	let mouseX = $state(0);
	let mouseY = $state(0);
	let showSpotlight = $state(false);

	onMount(() => {
		if (window.matchMedia('(pointer: fine)').matches) {
			showSpotlight = true;
		}
	});

	function handleMouseMove(e: MouseEvent) {
		mouseX = e.clientX;
		mouseY = e.clientY;
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="min-h-screen flex flex-col relative" style="background-color: var(--color-background);" onmousemove={handleMouseMove}>
	<!-- Dynamic background effect -->
	<BackgroundEffect {mouseX} {mouseY} />

	<!-- Cursor spotlight -->
	{#if showSpotlight && browser}
		<div
			class="spotlight"
			style="left: {mouseX}px; top: {mouseY}px;"
		></div>
	{/if}

	<div class="relative" style="z-index: 1;">
		<Navbar />
		<main class="{maxWidth} mx-auto px-4 sm:px-6 py-8 w-full flex-1">
			{@render children()}
		</main>
		<Footer />
	</div>
</div>
