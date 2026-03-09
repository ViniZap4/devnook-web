<script lang="ts">
	import { page } from '$app/stores';
	import { userStore } from '$lib/stores/user.svelte';
	import { messages as messagesApi } from '$lib/services/api';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import ThemePicker from './ThemePicker.svelte';
	import NotificationBell from './NotificationBell.svelte';
	import CreateDropdown from './CreateDropdown.svelte';
	import UserDropdown from './UserDropdown.svelte';
	import { onMount, onDestroy, tick } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let msgUnread = $state(0);
	let unsubMsg: (() => void) | null = null;

	let navEl = $state<HTMLElement>();
	let indicatorStyle = $state('opacity: 0;');
	let mounted = $state(false);
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

		if (userStore.isLoggedIn) {
			messagesApi.unreadCount().then(r => { msgUnread = r.count; }).catch(() => {});
		}

		unsubMsg = wsStore.on('message_unread', () => {
			messagesApi.unreadCount().then(r => { msgUnread = r.count; }).catch(() => {});
		});
	});

	onDestroy(() => {
		unsubMsg?.();
	});

	afterNavigate(() => {
		tick().then(updateIndicator);
		if ($page.url.pathname.startsWith('/messages')) {
			msgUnread = 0;
		}
	});

	$effect(() => {
		if (mounted && navEl) {
			const _ = activeIndex;
			tick().then(updateIndicator);
		}
	});
</script>

<svelte:window onresize={updateIndicator} />

<div class="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
	<!-- Main nav dock -->
	<nav
		bind:this={navEl}
		class="relative flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl floating-dock"
	>
		<!-- Sliding indicator -->
		{#if mounted}
			<div
				class="absolute top-1.5 bottom-1.5 rounded-xl pointer-events-none z-0"
				style="{indicatorStyle} background: color-mix(in srgb, var(--color-primary) 12%, transparent); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), width 0.3s ease, opacity 0.2s ease;"
				aria-hidden="true"
			></div>
		{/if}

		<!-- Logo -->
		<a href="/dashboard" class="flex items-center justify-center w-9 h-9 rounded-xl relative z-10 group shrink-0" aria-label="Home">
			<div class="w-[7px] h-[7px] rounded-full transition-all duration-300 group-hover:scale-125" style="background-color: var(--color-primary);"></div>
		</a>

		<div class="w-px h-5 mx-1 shrink-0" style="background: var(--color-border); opacity: 0.4;"></div>

		{#each navItems as item, i}
			{@const isActive = activeIndex === i}
			<a
				href={item.to}
				data-nav-item
				class="dock-item relative z-10 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-colors duration-200"
				style="color: {isActive ? 'var(--color-primary)' : 'var(--color-text-dim)'};"
			>
				{#if item.icon === 'dashboard'}
					<svg class="w-[15px] h-[15px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
				{:else if item.icon === 'feed'}
					<svg class="w-[15px] h-[15px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
				{:else if item.icon === 'explore'}
					<svg class="w-[15px] h-[15px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
				{:else if item.icon === 'messages'}
					<svg class="w-[15px] h-[15px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
					{#if msgUnread > 0}
						<span class="absolute -top-0.5 left-[calc(50%+4px)] min-w-[14px] h-[14px] flex items-center justify-center text-[9px] font-bold rounded-full text-white" style="background: var(--color-error);">{msgUnread > 9 ? '9+' : msgUnread}</span>
					{/if}
				{:else if item.icon === 'docs'}
					<svg class="w-[15px] h-[15px] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
				{/if}
				<span class="text-[11px] font-medium">{item.label}</span>
			</a>
		{/each}

		<div class="w-px h-5 mx-1 shrink-0" style="background: var(--color-border); opacity: 0.4;"></div>

		<!-- Search -->
		<button
			class="dock-item relative z-10 flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-200"
			style="color: var(--color-text-dim);"
			onclick={() => { document.dispatchEvent(new CustomEvent('open-command-palette')); }}
			aria-label="Search (⌘K)"
		>
			<svg class="w-[15px] h-[15px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
		</button>
	</nav>

	<!-- Right utilities dock -->
	<div class="flex items-center gap-0.5 px-1.5 py-1.5 rounded-2xl floating-dock">
		<ThemePicker />
		<NotificationBell />
		<CreateDropdown />
		<UserDropdown />
	</div>
</div>

<style>
	.floating-dock {
		backdrop-filter: blur(24px) saturate(1.8);
		background: color-mix(in srgb, var(--color-surface) 72%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-border) 60%, transparent);
		box-shadow:
			0 1px 2px rgba(0, 0, 0, 0.06),
			0 4px 16px rgba(0, 0, 0, 0.1),
			inset 0 0.5px 0 rgba(255, 255, 255, 0.04);
	}

	.dock-item {
		position: relative;
	}

	.dock-item:hover {
		color: var(--color-text) !important;
		background: color-mix(in srgb, var(--color-text) 5%, transparent);
	}

	.dock-item:active {
		transform: scale(0.97);
		transition: transform 0.1s ease;
	}
</style>
