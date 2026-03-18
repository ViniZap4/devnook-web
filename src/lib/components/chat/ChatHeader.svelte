<script lang="ts">
	import type { Conversation, Message } from '$lib/types/message';
	import { userStore } from '$lib/stores/user.svelte';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { isOnline } from '$lib/stores/presence.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let {
		convo,
		showDetails = false,
		onback,
		ontoggledetails,
		oncall,
		onsearchresult
	}: {
		convo: Conversation;
		showDetails: boolean;
		onback: () => void;
		ontoggledetails: () => void;
		oncall: () => void;
		onsearchresult?: (msgId: number) => void;
	} = $props();

	function getDisplayName(c: Conversation): string {
		if (c.name) return c.name;
		if (c.type === 'repo') return `${c.repo_owner}/${c.repo_name}`;
		if (c.type === 'org') return c.org_name || '';
		if (c.type === 'issue') return `Issue #${c.issue_number}`;
		const other = c.participants.find(p => p.username !== userStore.user?.username);
		return other?.full_name || other?.username || 'Chat';
	}

	function getUsername(c: Conversation): string {
		if (c.type === 'direct') {
			const other = c.participants.find(p => p.username !== userStore.user?.username);
			return other?.username || '';
		}
		return '';
	}

	function getDescription(c: Conversation): string {
		if (c.type === 'repo') return `Discussion about ${c.repo_owner}/${c.repo_name}`;
		if (c.type === 'org') return `Organization chat`;
		if (c.type === 'issue') return `Issue discussion`;
		return '';
	}

	// --- Search state ---
	let searchActive = $state(false);
	let searchQuery = $state('');
	let searchResults = $state<Message[]>([]);
	let searchLoading = $state(false);
	let searchInputEl = $state<HTMLInputElement>();
	let searchDebounce: ReturnType<typeof setTimeout> | null = null;

	function toggleSearch() {
		searchActive = !searchActive;
		if (!searchActive) {
			searchQuery = '';
			searchResults = [];
		} else {
			// Focus input after DOM update
			requestAnimationFrame(() => searchInputEl?.focus());
		}
	}

	function handleSearchInput() {
		if (searchDebounce) clearTimeout(searchDebounce);
		const q = searchQuery.trim();
		if (!q) { searchResults = []; return; }
		searchDebounce = setTimeout(async () => {
			searchLoading = true;
			try {
				const { messages } = await import('$lib/services/api');
				searchResults = await messages.searchMessages(convo.id, q);
			} catch {
				searchResults = [];
			} finally {
				searchLoading = false;
			}
		}, 300);
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			searchActive = false;
			searchQuery = '';
			searchResults = [];
		}
	}

	function selectSearchResult(msg: Message) {
		onsearchresult?.(msg.id);
		searchResults = [];
		searchQuery = '';
		searchActive = false;
	}

	function formatResultTime(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const hours = Math.floor(diff / 3600000);
		if (hours < 24) return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function truncate(s: string, max = 60): string {
		return s.length > max ? s.slice(0, max) + '...' : s;
	}
</script>

<header class="chat-header">
	<button
		class="back-btn lg:hidden"
		aria-label="Back to conversations"
		onclick={onback}
	>
		<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
		</svg>
	</button>

	{#if searchActive}
		<div class="search-bar">
			<svg class="search-bar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" />
			</svg>
			<input
				bind:this={searchInputEl}
				type="text"
				bind:value={searchQuery}
				oninput={handleSearchInput}
				onkeydown={handleSearchKeydown}
				placeholder="Search messages..."
				class="search-bar-input"
				aria-label="Search messages in this conversation"
			/>
			{#if searchLoading}
				<div class="search-bar-spinner"><Spinner size="sm" /></div>
			{:else if searchQuery}
				<button class="search-bar-clear" aria-label="Clear search" onclick={() => { searchQuery = ''; searchResults = []; }}>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
			{#if searchResults.length > 0}
				<div class="search-results" role="listbox" aria-label="Search results">
					{#each searchResults as msg (msg.id)}
						<button
							class="search-result-item"
							role="option"
							aria-selected="false"
							onclick={() => selectSearchResult(msg)}
						>
							<div class="search-result-meta">
								<span class="search-result-sender">{msg.sender_full_name || msg.sender_username}</span>
								<span class="search-result-time">{formatResultTime(msg.created_at)}</span>
							</div>
							<div class="search-result-content">{truncate(msg.content)}</div>
						</button>
					{/each}
				</div>
			{:else if searchQuery.trim() && !searchLoading}
				<div class="search-results">
					<p class="search-no-results">No messages found</p>
				</div>
			{/if}
		</div>
	{:else}
		<div class="channel-info">
			<div class="channel-title">
				{#if convo.type !== 'direct'}
					<span class="hash-icon">#</span>
				{/if}
				<span class="ch-name">{getDisplayName(convo)}</span>
				{#if !wsStore.connected}
					<span class="connection-badge">Reconnecting...</span>
				{/if}
			</div>
			{#if getDescription(convo)}
				<span class="ch-desc">{getDescription(convo)}</span>
			{:else if convo.type === 'direct'}
				<span class="ch-desc">
					{#if getUsername(convo)}
						<span class="presence-dot" class:online={isOnline(getUsername(convo))}></span>
						{isOnline(getUsername(convo)) ? 'Online' : 'Offline'}
					{/if}
				</span>
			{/if}
		</div>
	{/if}

	<div class="channel-actions">
		{#if !searchActive && convo.participants.length > 1}
			<div class="member-avatars">
				{#each convo.participants.slice(0, 3) as p}
					<div class="member-av"><Avatar username={p.username} size={28} /></div>
				{/each}
				{#if convo.participants.length > 3}
					<div class="member-count">+{convo.participants.length - 3}</div>
				{/if}
			</div>
		{/if}
		<!-- Search toggle -->
		<button
			class="action-btn"
			class:action-btn-active={searchActive}
			aria-label={searchActive ? 'Close search' : 'Search messages'}
			onclick={toggleSearch}
		>
			<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" />
			</svg>
		</button>
		{#if !searchActive}
			{#if convo.type === 'repo'}
				<a href="/{convo.repo_owner}/{convo.repo_name}" class="action-btn" aria-label="View repository">
					<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
				</a>
			{/if}
			{#if convo.type === 'direct'}
				<button class="action-btn" aria-label="Start call" onclick={oncall}>
					<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
					</svg>
				</button>
			{/if}
			{#if convo.type === 'direct'}
				<a href="/{getUsername(convo)}" class="action-btn" aria-label="View profile">
					<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
					</svg>
				</a>
			{/if}
			<button
				class="action-btn hidden xl:flex"
				class:action-btn-active={showDetails}
				aria-label="Toggle details panel"
				onclick={ontoggledetails}
			>
				<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<rect x="3" y="3" width="18" height="18" rx="2"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 3v18" />
				</svg>
			</button>
		{/if}
	</div>
</header>

<style>
	.chat-header {
		height: 56px; padding: 0 20px;
		display: flex; align-items: center; gap: 12px;
		border-bottom: 1px solid color-mix(in srgb, var(--color-text) 5%, transparent); flex-shrink: 0;
		position: relative;
		backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
	}
	.back-btn { shrink: 0; margin-right: 4px; color: var(--color-text-dim); }
	.channel-info { flex: 1; min-width: 0; }
	.channel-title { display: flex; align-items: center; gap: 8px; }
	.hash-icon { color: var(--color-text-dim); font-size: 18px; }
	.ch-name { font-size: 16px; font-weight: 600; color: var(--color-text); }
	.ch-desc { font-size: 13px; color: var(--color-text-dim); }
	.connection-badge {
		font-size: 11px; padding: 2px 8px; border-radius: 10px;
		background: color-mix(in srgb, var(--color-warning) 15%, transparent); color: var(--color-warning);
		animation: pulse-badge 2s ease-in-out infinite;
	}
	@keyframes pulse-badge {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.5; }
	}
	.channel-actions { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
	.member-avatars { display: flex; }
	.member-av { margin-left: -8px; border-radius: 50%; border: 2px solid var(--glass-border); }
	.member-av:first-child { margin-left: 0; }
	.member-count {
		width: 28px; height: 28px; border-radius: 50%;
		background: color-mix(in srgb, var(--color-text) 6%, transparent); color: var(--color-text-dim);
		font-size: 10px; font-weight: 600; display: flex; align-items: center; justify-content: center;
		margin-left: -8px;
	}
	.action-btn {
		width: 36px; height: 36px; border-radius: 8px; color: var(--color-text-dim);
		display: flex; align-items: center; justify-content: center;
		transition: background 0.15s, color 0.15s; text-decoration: none;
	}
	.action-btn:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); color: var(--color-text); }
	.action-btn-active { background: color-mix(in srgb, var(--color-primary) 12%, transparent); color: var(--color-primary); }
	.presence-dot {
		display: inline-block; width: 8px; height: 8px; border-radius: 50%;
		background: var(--color-text-dim); opacity: 0.4; margin-right: 4px; vertical-align: middle;
	}
	.presence-dot.online { background: var(--color-success); opacity: 1; }

	/* Search bar */
	.search-bar {
		flex: 1; position: relative; display: flex; align-items: center;
	}
	.search-bar-icon {
		position: absolute; left: 10px; width: 15px; height: 15px;
		color: var(--color-text-dim); opacity: 0.5; pointer-events: none;
	}
	.search-bar-input {
		width: 100%; padding: 8px 36px 8px 32px; font-size: 14px;
		border-radius: 10px; border: 1px solid var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 6%, transparent); color: var(--color-text); outline: none;
		font-family: inherit; transition: box-shadow 0.15s;
	}
	.search-bar-input:focus { box-shadow: 0 0 0 2px var(--color-primaryGlow); }
	.search-bar-input::placeholder { color: var(--color-text-dim); opacity: 0.5; }
	.search-bar-clear, .search-bar-spinner {
		position: absolute; right: 10px;
		color: var(--color-text-dim); display: flex; align-items: center; justify-content: center;
	}
	.search-bar-clear { opacity: 0.6; transition: opacity 0.12s; }
	.search-bar-clear:hover { opacity: 1; }

	/* Search results dropdown */
	.search-results {
		position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 60;
		border-radius: 12px; border: 1px solid var(--glass-border);
		background: var(--glass-bg); backdrop-filter: blur(20px);
		box-shadow: 0 8px 32px color-mix(in srgb, var(--color-overlay, #000) 50%, transparent);
		max-height: 280px; overflow-y: auto;
		animation: search-drop 0.15s ease both;
	}
	@keyframes search-drop {
		from { opacity: 0; transform: translateY(-6px); }
		to { opacity: 1; transform: translateY(0); }
	}
	.search-result-item {
		width: 100%; text-align: left; padding: 10px 14px;
		transition: background 0.12s; border-bottom: 1px solid color-mix(in srgb, var(--color-text) 4%, transparent);
	}
	.search-result-item:last-child { border-bottom: none; }
	.search-result-item:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); }
	.search-result-meta {
		display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px;
	}
	.search-result-sender { font-size: 12px; font-weight: 600; color: var(--color-primary); }
	.search-result-time { font-size: 11px; color: var(--color-text-dim); opacity: 0.6; }
	.search-result-content {
		font-size: 13px; color: var(--color-text); opacity: 0.85;
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.search-no-results {
		padding: 16px; text-align: center; font-size: 13px;
		color: var(--color-text-dim); opacity: 0.5;
	}

	@media (prefers-reduced-motion: reduce) {
		.connection-badge { animation: none !important; }
		.search-results { animation: none !important; }
	}
</style>
