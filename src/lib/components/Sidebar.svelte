<script lang="ts">
	import { page } from '$app/stores';
	import { userStore } from '$lib/stores/user.svelte';
	import { sidebarStore } from '$lib/stores/sidebar.svelte';
	import { notifPanelStore } from '$lib/stores/notifPanel.svelte';
	import { notifications as notifApi, messages as messagesApi } from '$lib/services/api';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import SlidingIndicator from './SlidingIndicator.svelte';
	import UserDropdown from './UserDropdown.svelte';
	import { onMount, onDestroy } from 'svelte';
	import { afterNavigate } from '$app/navigation';

	let navEl = $state<HTMLElement>();
	let hovered = $state(false);
	let msgUnread = $state(0);
	let notifUnread = $state(0);
	let hideTimeout: ReturnType<typeof setTimeout>;
	let unsubMsg: (() => void) | null = null;
	let unsubNotif: (() => void) | null = null;
	let unsubNotifCount: (() => void) | null = null;

	let isWide = $derived(
		sidebarStore.mode === 'expanded' ||
		(sidebarStore.mode === 'auto' && hovered)
	);

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

	function toggleSidebar() {
		if (sidebarStore.mode === 'compact' || sidebarStore.mode === 'auto') {
			sidebarStore.mode = 'expanded';
		} else {
			sidebarStore.mode = 'compact';
		}
	}

	function handleAutoEnter() {
		clearTimeout(hideTimeout);
		hovered = true;
	}

	function handleAutoLeave() {
		if (sidebarStore.mode === 'auto') {
			hideTimeout = setTimeout(() => { hovered = false; }, 300);
		}
	}

	onMount(() => {
		if (userStore.isLoggedIn) {
			messagesApi.unreadCount().then(r => { msgUnread = r.count; }).catch(() => {});
			notifApi.unreadCount().then(r => { notifUnread = r.count; }).catch(() => {});
		}

		unsubMsg = wsStore.on('message_unread', () => {
			messagesApi.unreadCount().then(r => { msgUnread = r.count; }).catch(() => {});
		});

		unsubNotif = wsStore.on('notification', () => { notifUnread++; });
		unsubNotifCount = wsStore.on('notification_count', (data: { count: number }) => {
			notifUnread = data.count;
		});
	});

	onDestroy(() => {
		clearTimeout(hideTimeout);
		unsubMsg?.();
		unsubNotif?.();
		unsubNotifCount?.();
	});

	afterNavigate(() => {
		if ($page.url.pathname.startsWith('/messages')) {
			msgUnread = 0;
		}
	});
</script>

<!-- Auto-hide trigger zone -->
{#if sidebarStore.mode === 'auto'}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="auto-trigger"
		onmouseenter={handleAutoEnter}
	></div>
{/if}

<aside
	class="sidebar"
	class:wide={isWide}
	class:auto-mode={sidebarStore.mode === 'auto'}
	class:auto-visible={sidebarStore.mode === 'auto' && hovered}
	class:hidden-mode={sidebarStore.mode === 'hidden'}
	onmouseenter={handleAutoEnter}
	onmouseleave={handleAutoLeave}
>
	<!-- Logo row -->
	<div class="logo-row">
		<a href="/dashboard" class="logo-link">
			<div class="logo-dot"></div>
			<span class="logo-text sidebar-label">DevNook</span>
		</a>
		<button class="toggle-btn" onclick={toggleSidebar} title={isWide ? 'Collapse sidebar' : 'Expand sidebar'}>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				{#if isWide}
					<path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
				{:else}
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
				{/if}
			</svg>
		</button>
	</div>

	<!-- Search trigger -->
	<button
		class="search-btn"
		onclick={() => { document.dispatchEvent(new CustomEvent('open-command-palette')); }}
		aria-label="Search (Cmd+K)"
	>
		<svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" />
			<path stroke-linecap="round" d="m21 21-4.3-4.3" />
		</svg>
		<span class="sidebar-label">Search</span>
		<span class="kbd sidebar-label">&#8984;K</span>
	</button>

	<!-- Nav items -->
	<nav bind:this={navEl} class="nav-list">
		<SlidingIndicator
			containerEl={navEl}
			{activeIndex}
			selector="[data-nav-item]"
			direction="vertical"
			class="sidebar-indicator"
		/>

		{#each navItems as item, i}
			{@const isActive = activeIndex === i}
			<a
				href={item.to}
				data-nav-item
				data-active={isActive ? '' : undefined}
				class="nav-item"
				class:active={isActive}
			>
				{#if item.icon === 'dashboard'}
					<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
				{:else if item.icon === 'feed'}
					<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
				{:else if item.icon === 'explore'}
					<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
				{:else if item.icon === 'messages'}
					<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
				{:else if item.icon === 'docs'}
					<svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
				{/if}

				<span class="nav-label sidebar-label">{item.label}</span>

				{#if item.icon === 'messages' && msgUnread > 0}
					<span class="msg-badge sidebar-label">{msgUnread > 9 ? '9+' : msgUnread}</span>
					<span class="msg-dot"></span>
				{/if}
			</a>
		{/each}
	</nav>

	<!-- Footer: notifications, settings, profile -->
	<div class="sidebar-footer">
		<a href="/new" class="footer-item" title="New Repository">
			<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
			</svg>
			<span class="sidebar-label">New Repo</span>
		</a>

		<button class="footer-item" onclick={() => notifPanelStore.toggle()}>
			<div class="footer-icon-wrap">
				<svg class="w-[18px] h-[18px]" viewBox="0 0 16 16" fill="currentColor">
					<path d="M8 16a2 2 0 0 0 1.985-1.75c.017-.137-.097-.25-.235-.25h-3.5c-.138 0-.252.113-.235.25A2 2 0 0 0 8 16ZM3 5a5 5 0 0 1 10 0v2.947c0 .05.015.098.042.139l1.703 2.555A1.519 1.519 0 0 1 13.482 13H2.518a1.516 1.516 0 0 1-1.263-2.36l1.703-2.554A.255.255 0 0 0 3 7.947Z"/>
				</svg>
				{#if notifUnread > 0}
					<span class="notif-badge">{notifUnread > 9 ? '9+' : notifUnread}</span>
				{/if}
			</div>
			<span class="sidebar-label">Notifications</span>
		</button>

		{#if userStore.user}
			<a href="/{userStore.user.username}" class="footer-item">
				<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
				</svg>
				<span class="sidebar-label">Profile</span>
			</a>
		{/if}

		<a href="/settings" class="footer-item">
			<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
				<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			</svg>
			<span class="sidebar-label">Settings</span>
		</a>

		{#if userStore.user}
			<UserDropdown />
		{/if}
	</div>
</aside>

<style>
	/* Auto-hide trigger zone */
	.auto-trigger {
		position: fixed;
		left: 0;
		top: 0;
		bottom: 0;
		width: 12px;
		z-index: 39;
	}

	.sidebar {
		position: fixed;
		top: 12px;
		left: 12px;
		bottom: 12px;
		width: 72px;
		display: none;
		flex-direction: column;
		z-index: 40;
		padding: 12px 10px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		border-radius: 16px;
		transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1),
			box-shadow 0.25s,
			transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	@media (min-width: 1024px) {
		.sidebar {
			display: flex;
		}
	}

	.sidebar.hidden-mode {
		display: none !important;
	}

	.sidebar.wide {
		width: 240px;
	}

	/* Auto mode: hidden off-screen by default */
	.sidebar.auto-mode {
		transform: translateX(calc(-100% - 24px));
	}
	.sidebar.auto-mode.auto-visible {
		transform: translateX(0);
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
	}

	/* Label transitions — hidden when narrow */
	.sidebar-label {
		white-space: nowrap;
		overflow: hidden;
		opacity: 0;
		max-width: 0;
		transition: opacity 0.15s, max-width 0.2s;
	}
	.sidebar.wide .sidebar-label {
		opacity: 1;
		max-width: 180px;
	}

	/* Logo row */
	.logo-row {
		display: flex;
		align-items: center;
		margin-bottom: 0.75rem;
		flex-shrink: 0;
	}
	.sidebar:not(.wide) .logo-row {
		flex-direction: column;
		gap: 4px;
	}

	.logo-link {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.625rem;
		text-decoration: none;
		border-radius: 0.75rem;
		flex: 1;
		min-width: 0;
		transition: background 0.15s, gap 0.25s;
	}
	.sidebar:not(.wide) .logo-link {
		justify-content: center;
		gap: 0;
		flex: unset;
	}
	.logo-link:hover {
		background: rgba(255, 255, 255, 0.05);
	}

	.logo-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background-color: var(--color-primary);
		flex-shrink: 0;
	}

	.logo-text {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 8px;
		color: var(--color-text-dim);
		flex-shrink: 0;
		transition: color 0.15s, background 0.15s;
	}
	.toggle-btn:hover {
		color: var(--color-text);
		background: rgba(255, 255, 255, 0.08);
	}

	/* Search */
	.search-btn {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.5rem 0.625rem;
		margin-bottom: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid var(--glass-border);
		background: rgba(255, 255, 255, 0.03);
		color: var(--color-text-dim);
		font-size: 0.875rem;
		cursor: pointer;
		width: 100%;
		text-align: left;
		flex-shrink: 0;
		transition: all 0.15s, gap 0.25s;
	}
	.sidebar:not(.wide) .search-btn {
		justify-content: center;
		gap: 0;
	}
	.search-btn:hover {
		color: var(--color-text);
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.15);
	}

	.kbd {
		font-size: 10px;
		margin-left: auto;
		opacity: 0.5;
		font-family: inherit;
	}

	/* Nav */
	.nav-list {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 2px;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
	}
	.nav-list::-webkit-scrollbar {
		width: 0;
	}

	.nav-icon {
		width: 18px;
		height: 18px;
		flex-shrink: 0;
	}

	.nav-item {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		gap: 0;
		padding: 0.625rem;
		border-radius: 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-text-dim);
		text-decoration: none;
		transition: color 0.15s, gap 0.25s;
	}
	.sidebar:not(.wide) .nav-item {
		justify-content: center;
	}
	.sidebar.wide .nav-item {
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
	}

	.nav-item:hover:not(.active) {
		color: var(--color-text);
	}
	.nav-item.active {
		color: white;
		font-weight: 500;
	}
	.nav-item:active {
		transform: scale(0.98);
		transition: transform 0.1s ease;
	}

	.nav-label {
		overflow: hidden;
		text-overflow: ellipsis;
	}

	:global(.sidebar-indicator) {
		background: var(--color-primary);
		border-radius: 0.75rem;
		box-shadow: 0 0 20px rgba(6, 182, 212, 0.4), 0 4px 12px rgba(6, 182, 212, 0.3);
	}

	/* Message badge (expanded) */
	.msg-badge {
		min-width: 1.25rem;
		height: 1.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background-color: var(--color-error);
		color: white;
		font-size: 10px;
		font-weight: 700;
		margin-left: auto;
		padding: 0 4px;
	}

	/* Message dot indicator (compact) */
	.msg-dot {
		position: absolute;
		top: 6px;
		right: 6px;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--color-error);
	}
	.sidebar.wide .msg-dot {
		display: none;
	}

	/* Footer */
	.sidebar-footer {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-top: 0.75rem;
		border-top: 1px solid var(--glass-border);
		flex-shrink: 0;
	}

	.footer-item {
		display: flex;
		align-items: center;
		gap: 0;
		padding: 0.625rem;
		border-radius: 0.75rem;
		font-size: 0.8125rem;
		color: var(--color-text-dim);
		text-decoration: none;
		transition: color 0.15s, background 0.15s, gap 0.25s;
	}
	.sidebar:not(.wide) .footer-item {
		justify-content: center;
	}
	.sidebar.wide .footer-item {
		gap: 0.75rem;
		padding: 0.625rem 0.75rem;
	}
	.footer-item:hover {
		color: var(--color-text);
		background: rgba(255, 255, 255, 0.05);
	}

	.footer-icon-wrap {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.notif-badge {
		position: absolute;
		top: -6px;
		right: -8px;
		min-width: 16px;
		height: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 9999px;
		background-color: var(--color-primary);
		color: white;
		font-size: 9px;
		font-weight: 700;
		padding: 0 3px;
	}
</style>
