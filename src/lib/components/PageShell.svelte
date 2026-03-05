<script lang="ts">
	import Navbar from './Navbar.svelte';
	import Footer from './Footer.svelte';
	import type { Snippet } from 'svelte';

	let { children, maxWidth = 'max-w-5xl' }: { children: Snippet; maxWidth?: string } = $props();
</script>

<div class="min-h-screen flex flex-col" style="background-color: var(--color-background);">
	<Navbar />
	<main class="{maxWidth} mx-auto px-6 py-8 w-full flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
