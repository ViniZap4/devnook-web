<script lang="ts">
	import type { Snippet } from 'svelte';
	import Sidebar from './Sidebar.svelte';
	import MobileBottomNav from './MobileBottomNav.svelte';
	import BackgroundEffect from './BackgroundEffect.svelte';
	import NotificationPanel from './NotificationPanel.svelte';
	import { sidebarStore } from '$lib/stores/sidebar.svelte';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';

	type ContentWidth = 'narrow' | 'default' | 'wide' | 'full';
	let { children, rightPanel, width = 'default' as ContentWidth }: {
		children: Snippet;
		rightPanel?: Snippet;
		width?: ContentWidth;
	} = $props();

	const widthMap: Record<ContentWidth, string> = {
		narrow: '48rem',
		default: '88rem',
		wide: '110rem',
		full: '160rem',
	};

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
<div class="min-h-screen flex" style="background-color: var(--color-background);" onmousemove={handleMouseMove}>
	<BackgroundEffect {mouseX} {mouseY} />

	{#if showSpotlight && browser}
		<div class="spotlight" style="transform: translate(calc({mouseX}px - 50%), calc({mouseY}px - 50%));"></div>
	{/if}

	<Sidebar />

	<div class="app-content" data-sidebar={sidebarStore.mode} style="z-index: 1;">
		<div class="flex min-h-screen">
			<main class="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 lg:py-8 pb-20 lg:pb-8">
				<div class="mx-auto w-full" style="max-width: {widthMap[width]};">
					{@render children()}
				</div>
			</main>

			{#if rightPanel}
				<aside class="right-panel">
					{@render rightPanel()}
				</aside>
			{/if}
		</div>
	</div>

	<MobileBottomNav />
	<NotificationPanel />
</div>

<style>
	.app-content {
		flex: 1;
		position: relative;
	}

	@media (min-width: 1024px) {
		.app-content {
			transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
		}
		.app-content[data-sidebar="compact"] {
			margin-left: 96px;
		}
		.app-content[data-sidebar="expanded"] {
			margin-left: 264px;
		}
		.app-content[data-sidebar="auto"],
		.app-content[data-sidebar="hidden"] {
			margin-left: 0;
		}
	}

	.right-panel {
		display: none;
		width: 320px;
		flex-shrink: 0;
		padding: 2rem 2rem 2rem 0;
		position: sticky;
		top: 0;
		height: 100vh;
		overflow-y: auto;
	}

	@media (min-width: 1440px) {
		.right-panel {
			display: block;
		}
	}
</style>
