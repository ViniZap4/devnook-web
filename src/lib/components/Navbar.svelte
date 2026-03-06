<script lang="ts">
	import { page } from '$app/stores';
	import { themeStore } from '$lib/stores/theme.svelte';
	import UserDropdown from './UserDropdown.svelte';
	import CreateDropdown from './CreateDropdown.svelte';
	import ThemePicker from './ThemePicker.svelte';
	import NotificationBell from './NotificationBell.svelte';
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let navContainer = $state<HTMLDivElement>();
	let indicatorStyle = $state('opacity: 0;');
	let mounted = $state(false);

	const navItems = [
		{ to: '/dashboard', label: 'Dashboard' },
		{ to: '/explore', label: 'Explore' },
	];

	function getActiveIndex(pathname: string): number {
		if (pathname === '/dashboard') return 0;
		if (pathname === '/explore') return 1;
		return -1;
	}

	let activeIndex = $derived(getActiveIndex($page.url.pathname));

	function updateIndicator() {
		if (!navContainer || activeIndex < 0) {
			indicatorStyle = 'opacity: 0;';
			return;
		}
		const links = navContainer.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]');
		const activeLink = links[activeIndex];
		if (activeLink) {
			const rect = activeLink.getBoundingClientRect();
			const containerRect = navContainer.getBoundingClientRect();
			indicatorStyle = `width: ${rect.width}px; transform: translateX(${rect.left - containerRect.left}px); opacity: 1;`;
		}
	}

	onMount(() => {
		mounted = true;
		tick().then(updateIndicator);
	});

	afterNavigate(() => {
		tick().then(updateIndicator);
	});

	$effect(() => {
		if (mounted && navContainer) {
			const _ = activeIndex;
			tick().then(updateIndicator);
		}
	});
</script>

<svelte:window onresize={updateIndicator} />

<nav class="sticky top-0 z-40 glass-strong">
	<div class="max-w-7xl mx-auto px-6 flex items-center justify-between h-14">
		<!-- Left -->
		<div class="flex items-center gap-6">
			<a href="/dashboard" class="flex items-center gap-2.5 shrink-0 group">
				<div class="relative">
					<div class="w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_12px_var(--color-primary)]" style="background-color: var(--color-primary);"></div>
					<div class="absolute inset-0 w-2.5 h-2.5 rounded-full live-dot" style="background-color: var(--color-primary); opacity: 0.4;"></div>
				</div>
				<span class="font-bold tracking-tight text-sm gradient-text">Dev Nook</span>
			</a>

			<!-- Nav links with sliding indicator -->
			<div bind:this={navContainer} class="hidden sm:flex items-center gap-1 relative">
				{#if mounted}
					<div
						class="absolute top-0 bottom-0 rounded-xl transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] pointer-events-none"
						style="{indicatorStyle} background: var(--color-primary)10; border: 1px solid var(--color-primary)20;"
					></div>
				{/if}
				{#each navItems as item, i}
					{@const isActive = activeIndex === i}
					<a
						href={item.to}
						data-nav-link
						class="relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 z-10"
						style="color: {isActive ? 'var(--color-primary)' : 'var(--color-text-dim)'};"
						onmouseenter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--color-text)'; }}
						onmouseleave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--color-text-dim)'; }}
					>
						{item.label}
					</a>
				{/each}
			</div>
		</div>

		<!-- Center: search trigger -->
		<button
			class="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all duration-200 glass-subtle"
			style="color: var(--color-text-dim);"
			onclick={() => { document.dispatchEvent(new CustomEvent('open-command-palette')); }}
			onmouseenter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)40'; }}
			onmouseleave={(e) => { e.currentTarget.style.borderColor = ''; }}
		>
			<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
			</svg>
			<span>Search...</span>
			<kbd class="ml-4 px-1.5 py-0.5 rounded-md border text-[10px] font-mono" style="border-color: var(--color-border); color: var(--color-text-dim);">
				{navigator?.platform?.includes('Mac') ? '\u2318' : 'Ctrl+'}K
			</kbd>
		</button>

		<!-- Right -->
		<div class="flex items-center gap-2">
			<ThemePicker />
			<div class="w-px h-4 mx-1" style="background: var(--color-border);"></div>
			<NotificationBell />
			<CreateDropdown />
			<UserDropdown />
		</div>
	</div>
</nav>
