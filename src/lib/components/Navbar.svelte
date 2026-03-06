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
	let mobileOpen = $state(false);

	const navItems = [
		{ to: '/dashboard', label: 'Dashboard', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />' },
		{ to: '/feed', label: 'Feed', icon: '<path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />' },
		{ to: '/explore', label: 'Explore', icon: '<circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" />' },
	];

	function getActiveIndex(pathname: string): number {
		if (pathname === '/dashboard') return 0;
		if (pathname === '/feed' || pathname.startsWith('/feed')) return 1;
		if (pathname === '/explore') return 2;
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
		mobileOpen = false;
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
	<div class="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
		<!-- Left -->
		<div class="flex items-center gap-4 sm:gap-6">
			<a href="/dashboard" class="flex items-center gap-2.5 shrink-0 group">
				<div class="relative">
					<div class="w-2.5 h-2.5 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_12px_var(--color-primary)]" style="background-color: var(--color-primary);"></div>
					<div class="absolute inset-0 w-2.5 h-2.5 rounded-full live-dot" style="background-color: var(--color-primary); opacity: 0.4;"></div>
				</div>
				<span class="font-bold tracking-tight text-sm gradient-text">Dev Nook</span>
			</a>

			<!-- Nav links with sliding indicator — desktop -->
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

		<!-- Center: search trigger — desktop -->
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
			<div class="hidden sm:contents">
				<ThemePicker />
				<div class="w-px h-4 mx-1" style="background: var(--color-border);"></div>
			</div>
			<NotificationBell />
			<div class="hidden sm:contents">
				<CreateDropdown />
			</div>
			<UserDropdown />

			<!-- Mobile menu button -->
			<button
				class="sm:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200"
				style="color: var(--color-text-dim);"
				onclick={() => { mobileOpen = !mobileOpen; }}
				aria-label="Menu"
			>
				{#if mobileOpen}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
				{:else}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
				{/if}
			</button>
		</div>
	</div>
</nav>

<!-- Mobile menu panel -->
{#if mobileOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="fixed inset-0 z-30 sm:hidden"
		style="background: rgba(0, 0, 0, 0.5); backdrop-filter: blur(4px);"
		onclick={() => { mobileOpen = false; }}
	>
		<div
			class="mobile-menu-enter absolute right-0 top-14 bottom-0 w-72 overflow-y-auto"
			style="background: var(--color-background); border-left: 1px solid var(--color-border);"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="flex flex-col gap-1 p-4">
				{#each navItems as item, i}
					{@const isActive = activeIndex === i}
					<a
						href={item.to}
						class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
						style="
							color: {isActive ? 'var(--color-primary)' : 'var(--color-text)'};
							background: {isActive ? 'var(--color-primary)10' : 'transparent'};
						"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							{@html item.icon}
						</svg>
						{item.label}
					</a>
				{/each}

				<div class="my-2 border-t" style="border-color: var(--color-separator);"></div>

				<!-- Search -->
				<button
					class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 w-full text-left"
					style="color: var(--color-text);"
					onclick={() => { mobileOpen = false; document.dispatchEvent(new CustomEvent('open-command-palette')); }}
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
					Search
				</button>

				<a
					href="/new"
					class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
					style="color: var(--color-text);"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
					New Repository
				</a>

				<a
					href="/settings"
					class="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200"
					style="color: var(--color-text);"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
					Settings
				</a>

				<div class="my-2 border-t" style="border-color: var(--color-separator);"></div>

				<div class="px-4 py-3">
					<ThemePicker />
				</div>
			</div>
		</div>
	</div>
{/if}
