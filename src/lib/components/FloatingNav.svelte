<script lang="ts">
	import { page } from '$app/stores';
	import { userStore } from '$lib/stores/user.svelte';
	import ThemePicker from './ThemePicker.svelte';
	import NotificationBell from './NotificationBell.svelte';
	import CreateDropdown from './CreateDropdown.svelte';
	import UserDropdown from './UserDropdown.svelte';
	import { onMount, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let navEl = $state<HTMLElement>();
	let indicatorStyle = $state('opacity: 0;');
	let mounted = $state(false);
	let expanded = $state(false);

	const navItems = [
		{ to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
		{ to: '/feed', label: 'Feed', icon: 'feed' },
		{ to: '/explore', label: 'Explore', icon: 'explore' },
		{ to: '/messages', label: 'Messages', icon: 'messages' },
		{ to: '/docs', label: 'Docs', icon: 'docs' },
	];

	function getActiveIndex(pathname: string): number {
		for (let i = 0; i < navItems.length; i++) {
			if (pathname === navItems[i].to || pathname.startsWith(navItems[i].to + '/')) return i;
		}
		return -1;
	}

	let activeIndex = $derived(getActiveIndex($page.url.pathname));

	function updateIndicator() {
		if (!navEl || activeIndex < 0) {
			indicatorStyle = 'opacity: 0;';
			return;
		}
		const buttons = navEl.querySelectorAll<HTMLElement>('[data-nav-item]');
		const active = buttons[activeIndex];
		if (active) {
			const rect = active.getBoundingClientRect();
			const containerRect = navEl.getBoundingClientRect();
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
		if (mounted && navEl) {
			const _ = activeIndex;
			tick().then(updateIndicator);
		}
	});
</script>

<svelte:window onresize={updateIndicator} />

<!-- Floating dock navbar -->
<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
	<!-- Main nav dock -->
	<nav
		bind:this={navEl}
		class="relative flex items-center gap-1 px-2 py-2 rounded-2xl floating-dock"
		onmouseenter={() => { expanded = true; }}
		onmouseleave={() => { expanded = false; }}
	>
		<!-- Sliding indicator -->
		{#if mounted}
			<div
				class="absolute top-2 bottom-2 rounded-xl pointer-events-none z-0"
				style="{indicatorStyle} background: color-mix(in srgb, var(--color-primary) 15%, transparent); border: 1px solid color-mix(in srgb, var(--color-primary) 25%, transparent); transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s ease, opacity 0.2s ease;"
				aria-hidden="true"
			></div>
		{/if}

		<!-- Logo -->
		<a href="/dashboard" class="flex items-center justify-center w-9 h-9 rounded-xl relative z-10 group shrink-0 mr-1">
			<div class="relative">
				<div class="w-3 h-3 rounded-full transition-all duration-300 group-hover:scale-125 group-hover:shadow-[0_0_12px_var(--color-primary)]" style="background-color: var(--color-primary);"></div>
				<div class="absolute inset-0 w-3 h-3 rounded-full live-dot" style="background-color: var(--color-primary); opacity: 0.4;"></div>
			</div>
		</a>

		<div class="w-px h-5 mx-0.5 shrink-0" style="background: var(--color-border);"></div>

		{#each navItems as item, i}
			{@const isActive = activeIndex === i}
			<a
				href={item.to}
				data-nav-item
				class="dock-item relative z-10 flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300"
				style="color: {isActive ? 'var(--color-primary)' : 'var(--color-text-dim)'};"
				data-tooltip={item.label}
			>
				{#if item.icon === 'dashboard'}
					<svg class="w-[18px] h-[18px] shrink-0 transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
				{:else if item.icon === 'feed'}
					<svg class="w-[18px] h-[18px] shrink-0 transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
				{:else if item.icon === 'explore'}
					<svg class="w-[18px] h-[18px] shrink-0 transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
				{:else if item.icon === 'messages'}
					<svg class="w-[18px] h-[18px] shrink-0 transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
				{:else if item.icon === 'docs'}
					<svg class="w-[18px] h-[18px] shrink-0 transition-transform duration-300 {isActive ? 'scale-110' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
				{/if}
				{#if expanded}
					<span class="text-xs font-medium whitespace-nowrap dock-label">{item.label}</span>
				{/if}
			</a>
		{/each}

		<div class="w-px h-5 mx-0.5 shrink-0" style="background: var(--color-border);"></div>

		<!-- Search -->
		<button
			class="dock-item relative z-10 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300"
			style="color: var(--color-text-dim);"
			onclick={() => { document.dispatchEvent(new CustomEvent('open-command-palette')); }}
			data-tooltip="Search ⌘K"
		>
			<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
		</button>
	</nav>

	<!-- Right utilities dock -->
	<div class="flex items-center gap-1 px-2 py-2 rounded-2xl floating-dock">
		<ThemePicker />
		<NotificationBell />
		<CreateDropdown />
		<UserDropdown />
	</div>
</div>

<style>
	.floating-dock {
		backdrop-filter: blur(24px) saturate(1.8);
		background: color-mix(in srgb, var(--color-surface) 75%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
		box-shadow:
			0 8px 32px rgba(0, 0, 0, 0.25),
			0 2px 8px rgba(0, 0, 0, 0.15),
			inset 0 0 0 1px rgba(255, 255, 255, 0.04);
		animation: dock-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
		animation-delay: 0.2s;
	}

	@keyframes dock-enter {
		0% { opacity: 0; transform: translateY(24px) scale(0.9); }
		100% { opacity: 1; transform: translateY(0) scale(1); }
	}

	.dock-item {
		position: relative;
	}

	.dock-item:hover {
		color: var(--color-text) !important;
		background: color-mix(in srgb, var(--color-text) 5%, transparent);
	}

	.dock-item:active {
		transform: scale(0.92);
	}

	.dock-label {
		animation: label-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	@keyframes label-in {
		0% { opacity: 0; width: 0; }
		100% { opacity: 1; width: auto; }
	}

	/* Override tooltip position for bottom dock */
	.floating-dock [data-tooltip]:hover::after {
		bottom: auto;
		top: auto;
		bottom: calc(100% + 8px);
	}
</style>
