<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let {
		containerEl,
		activeIndex,
		selector,
		direction = 'horizontal',
		class: extraClass = ''
	}: {
		containerEl: HTMLElement | undefined;
		activeIndex: number;
		selector: string;
		direction?: 'horizontal' | 'vertical';
		class?: string;
	} = $props();

	let style = $state('opacity: 0;');
	let mounted = $state(false);

	function update() {
		if (!containerEl || activeIndex < 0) {
			style = 'opacity: 0;';
			return;
		}
		const items = containerEl.querySelectorAll<HTMLElement>(selector);
		const active = items[activeIndex];
		if (!active) {
			style = 'opacity: 0;';
			return;
		}
		const rect = active.getBoundingClientRect();
		const containerRect = containerEl.getBoundingClientRect();
		if (direction === 'vertical') {
			style = `height: ${rect.height}px; transform: translateY(${rect.top - containerRect.top}px); opacity: 1;`;
		} else {
			style = `width: ${rect.width}px; transform: translateX(${rect.left - containerRect.left}px); opacity: 1;`;
		}
	}

	function scheduleUpdate() {
		tick().then(() => requestAnimationFrame(update));
	}

	onMount(() => {
		mounted = true;
		scheduleUpdate();
	});

	afterNavigate(() => {
		scheduleUpdate();
	});

	$effect(() => {
		if (mounted && containerEl) {
			const _ = activeIndex;
			const __ = direction;
			scheduleUpdate();
		}
	});
</script>

<svelte:window onresize={update} />

{#if mounted}
	<div
		class="absolute {direction === 'vertical' ? 'left-0 right-0' : 'top-0 bottom-0'} rounded-xl pointer-events-none z-0 {extraClass}"
		style="{style} transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), {direction === 'vertical' ? 'height' : 'width'} 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;"
		aria-hidden="true"
	></div>
{/if}
