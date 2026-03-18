<script lang="ts">
	import type { Snippet } from 'svelte';
	import { onMount, onDestroy } from 'svelte';

	let {
		x,
		y,
		onclose,
		children
	}: {
		x: number;
		y: number;
		onclose: () => void;
		children: Snippet;
	} = $props();

	let menuEl = $state<HTMLElement>();

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.stopPropagation();
			onclose();
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (menuEl && !menuEl.contains(e.target as Node)) {
			onclose();
		}
	}

	onMount(() => {
		document.addEventListener('mousedown', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('mousedown', handleClickOutside);
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div
	bind:this={menuEl}
	class="ctx-menu"
	style="top: {y}px; left: {x}px;"
>
	{@render children()}
</div>

<style>
	.ctx-menu {
		position: fixed;
		z-index: 50;
		display: flex;
		flex-direction: column;
		min-width: 10rem;
		padding: 0.375rem;
		border-radius: 0.75rem;
		background-color: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
		animation: scale-in 0.15s ease;
	}
</style>
