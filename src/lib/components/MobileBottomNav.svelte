<script lang="ts">
	import { page } from '$app/stores';
	import { messages as messagesApi } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let msgUnread = $state(0);
	let unsubMsg: (() => void) | null = null;

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

	onMount(() => {
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
		if ($page.url.pathname.startsWith('/messages')) {
			msgUnread = 0;
		}
	});
</script>

<nav class="mobile-nav">
	{#each navItems as item, i}
		{@const isActive = activeIndex === i}
		<a href={item.to} class="mobile-nav-item" class:active={isActive}>
			<div class="relative">
				{#if item.icon === 'dashboard'}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
				{:else if item.icon === 'feed'}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
				{:else if item.icon === 'explore'}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
				{:else if item.icon === 'messages'}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
					{#if msgUnread > 0}
						<span class="mobile-badge">{msgUnread > 9 ? '9+' : msgUnread}</span>
					{/if}
				{:else if item.icon === 'docs'}
					<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
				{/if}
			</div>
			<span class="mobile-nav-label">{item.label}</span>
		</a>
	{/each}
</nav>

<style>
	.mobile-nav {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: 4rem;
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: space-around;
		background-color: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border-top: 1px solid var(--glass-border);
		box-shadow: 0 -1px 8px rgba(0, 0, 0, 0.06);
	}

	@media (min-width: 1024px) {
		.mobile-nav {
			display: none;
		}
	}

	.mobile-nav-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
		padding: 0.375rem 0.5rem;
		text-decoration: none;
		color: var(--color-text-dim);
		transition: color 0.15s;
		border-radius: 0.5rem;
	}

	.mobile-nav-item.active {
		color: var(--color-primary);
	}

	.mobile-nav-item:not(.active):active {
		color: var(--color-text);
	}

	.mobile-nav-label {
		font-size: 10px;
		font-weight: 500;
		line-height: 1;
	}

	.mobile-badge {
		position: absolute;
		top: -4px;
		right: -6px;
		min-width: 14px;
		height: 14px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 9px;
		font-weight: 700;
		border-radius: 9999px;
		background-color: var(--color-error);
		color: white;
		padding: 0 3px;
	}
</style>
