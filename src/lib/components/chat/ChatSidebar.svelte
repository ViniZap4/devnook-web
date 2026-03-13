<script lang="ts">
	import type { Conversation } from '$lib/types/message';
	import type { User } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let {
		conversations,
		activeConvoId = null,
		loading = false,
		mobileHidden = false,
		onselect,
		onnewchat,
		oncreatechannel
	}: {
		conversations: Conversation[];
		activeConvoId: number | null;
		loading: boolean;
		mobileHidden: boolean;
		onselect: (convo: Conversation) => void;
		onnewchat: () => void;
		oncreatechannel: () => void;
	} = $props();

	let searchQuery = $state('');
	let showNewChat = $state(false);
	let userSearchQuery = $state('');
	let searchResults = $state<User[]>([]);
	let searching = $state(false);
	let searchTimeout: ReturnType<typeof setTimeout>;

	function getDisplayName(convo: Conversation): string {
		if (convo.name) return convo.name;
		if (convo.type === 'repo') return `${convo.repo_owner}/${convo.repo_name}`;
		if (convo.type === 'org') return convo.org_name || '';
		if (convo.type === 'issue') return `Issue #${convo.issue_number}`;
		const other = convo.participants.find(p => p.username !== userStore.user?.username);
		return other?.full_name || other?.username || 'Chat';
	}

	function getAvatar(convo: Conversation): string {
		if (convo.type === 'direct') {
			const other = convo.participants.find(p => p.username !== userStore.user?.username);
			return other?.username || '?';
		}
		return convo.name?.charAt(0) || '#';
	}

	function formatSidebarTime(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const mins = Math.floor(diff / 60000);
		if (mins < 1) return 'now';
		if (mins < 60) return `${mins}m`;
		const hours = Math.floor(mins / 60);
		if (hours < 24) return `${hours}h`;
		const days = Math.floor(hours / 24);
		if (days < 7) return `${days}d`;
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function formatPreview(content: string): string {
		if (!content) return '';
		return content.length > 40 ? content.slice(0, 40) + '...' : content;
	}

	function matchesSearch(convo: Conversation): boolean {
		if (!searchQuery.trim()) return true;
		return getDisplayName(convo).toLowerCase().includes(searchQuery.toLowerCase());
	}

	const channels = $derived(conversations.filter(c => c.type !== 'direct').filter(matchesSearch));
	const directMessages = $derived(conversations.filter(c => c.type === 'direct').filter(matchesSearch));

	async function handleUserSearch() {
		const q = userSearchQuery.trim();
		if (!q) { searchResults = []; return; }
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			searching = true;
			try {
				const { users } = await import('$lib/services/api');
				const results = await users.search(q);
				searchResults = results.filter(u => u.username !== userStore.user?.username);
			} catch {
				searchResults = [];
			} finally {
				searching = false;
			}
		}, 300);
	}

	async function startChatWith(user: User) {
		const existing = conversations.find(c =>
			c.type === 'direct' &&
			c.participants.some(p => p.username === user.username)
		);
		if (existing) {
			onselect(existing);
			showNewChat = false;
			userSearchQuery = '';
			searchResults = [];
			return;
		}

		try {
			const { messages } = await import('$lib/services/api');
			const result = await messages.createConversation({
				type: 'direct',
				participants: [user.username]
			});
			showNewChat = false;
			userSearchQuery = '';
			searchResults = [];
			onnewchat();
		} catch { /* handled in parent */ }
	}

	export function openNewChat(username?: string) {
		showNewChat = true;
		userSearchQuery = username || '';
		searchResults = [];
		if (username) handleUserSearch();
	}
</script>

<aside class="sidebar {mobileHidden ? 'hidden lg:flex' : ''}" aria-label="Conversations">
	<div class="sidebar-search">
		<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" />
		</svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search conversations..."
			class="search-input"
			aria-label="Search conversations"
		/>
		{#if searchQuery}
			<button class="search-clear" aria-label="Clear search" onclick={() => { searchQuery = ''; }}>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	{#if channels.length > 0 || !loading}
		<div class="section-header">
			<span>CHANNELS</span>
			<button aria-label="Create channel" onclick={oncreatechannel}>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
			</button>
		</div>
		{#each channels as convo (convo.id)}
			{@const isActive = activeConvoId === convo.id}
			<button class="channel-item" class:active={isActive} onclick={() => onselect(convo)}>
				<span class="hash">#</span>
				<span class="truncate">{getDisplayName(convo)}</span>
				{#if convo.unread_count > 0}
					<span class="badge">{convo.unread_count}</span>
				{/if}
			</button>
		{/each}
		{#if searchQuery && channels.length === 0}
			<p class="no-results">No channels match "{searchQuery}"</p>
		{/if}
	{/if}

	<div class="section-header" style="margin-top: 16px;">
		<span>DIRECT MESSAGES</span>
		<button aria-label="Find user to message" onclick={() => { showNewChat = !showNewChat; userSearchQuery = ''; searchResults = []; }}>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" />
			</svg>
		</button>
	</div>

	{#if showNewChat}
		<div class="px-2 mb-2">
			<input
				type="text"
				bind:value={userSearchQuery}
				oninput={handleUserSearch}
				placeholder="Find a user..."
				aria-label="Search for a user"
				class="user-search-input"
			/>
			{#if searchResults.length > 0}
				<div class="user-results">
					{#each searchResults as user}
						<button class="user-result-item" onclick={() => startChatWith(user)}>
							<Avatar username={user.username} size={24} />
							<span class="truncate">{user.full_name || user.username}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/if}

	{#if loading}
		<div class="py-8 flex justify-center"><Spinner size="sm" /></div>
	{:else}
		{#each directMessages as convo (convo.id)}
			{@const isActive = activeConvoId === convo.id}
			<button class="dm-item" class:active={isActive} onclick={() => onselect(convo)}>
				<div class="dm-avatar-wrap">
					<Avatar username={getAvatar(convo)} size={32} />
				</div>
				<div class="dm-content">
					<div class="dm-top">
						<span class="dm-name" class:unread={convo.unread_count > 0}>{getDisplayName(convo)}</span>
						{#if convo.last_message}
							<span class="dm-time">{formatSidebarTime(convo.last_message.created_at)}</span>
						{/if}
					</div>
					{#if convo.last_message}
						<div class="dm-preview" class:unread={convo.unread_count > 0}>
							{#if convo.last_message.sender_username === userStore.user?.username}
								<span class="preview-you">You: </span>
							{/if}
							{formatPreview(convo.last_message.content)}
						</div>
					{/if}
				</div>
				{#if convo.unread_count > 0}
					<span class="badge">{convo.unread_count}</span>
				{/if}
			</button>
		{/each}
		{#if searchQuery && directMessages.length === 0}
			<p class="no-results">No conversations match "{searchQuery}"</p>
		{/if}
	{/if}

	<div class="flex-1"></div>

	<button class="new-msg-btn" onclick={() => { showNewChat = true; userSearchQuery = ''; searchResults = []; }}>
		<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
		</svg>
		New Message
	</button>
</aside>

<style>
	.sidebar {
		width: 260px; flex-shrink: 0; display: flex; flex-direction: column;
		background: rgba(13, 17, 26, 0.92);
		backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border); border-radius: 16px 0 0 16px;
		padding: 12px 0 16px; overflow-y: auto;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2); min-width: 0;
	}
	.sidebar-search { position: relative; margin: 0 12px 12px; }
	.search-icon {
		position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
		width: 14px; height: 14px; color: var(--color-text-dim); opacity: 0.5; pointer-events: none;
	}
	.search-input {
		width: 100%; padding: 7px 30px 7px 30px; font-size: 12px;
		border-radius: 8px; border: 1px solid rgba(255,255,255,0.06);
		background: rgba(255,255,255,0.04); color: var(--color-text); outline: none;
		transition: border-color 0.15s, background 0.15s;
	}
	.search-input::placeholder { color: var(--color-text-dim); opacity: 0.5; }
	.search-input:focus { border-color: rgba(6,182,212,0.4); background: rgba(255,255,255,0.06); }
	.search-clear {
		position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
		color: var(--color-text-dim); opacity: 0.5; transition: opacity 0.15s;
		display: flex; align-items: center; justify-content: center;
	}
	.search-clear:hover { opacity: 1; }
	.no-results { padding: 8px 16px; font-size: 12px; color: var(--color-text-dim); opacity: 0.5; }
	.section-header {
		padding: 0 16px; margin-bottom: 8px;
		display: flex; justify-content: space-between; align-items: center;
		font-size: 11px; font-weight: 600; text-transform: uppercase;
		letter-spacing: 0.05em; color: var(--color-text-dim);
	}
	.section-header button { color: var(--color-text-dim); opacity: 0.7; transition: opacity 0.15s; }
	.section-header button:hover { opacity: 1; }
	.channel-item {
		height: 32px; margin: 2px 8px; padding: 0 8px; border-radius: 6px;
		display: flex; align-items: center; gap: 8px; font-size: 14px;
		color: var(--color-text-dim); width: calc(100% - 16px); text-align: left;
		transition: background 0.15s, color 0.15s;
	}
	.channel-item:hover { background: rgba(255,255,255,0.05); color: var(--color-text); }
	.channel-item.active { background: rgba(6,182,212,0.15); color: var(--color-primary); }
	.hash { font-size: 16px; opacity: 0.6; }
	.channel-item.active .hash { color: var(--color-primary); opacity: 1; }
	.badge {
		margin-left: auto; min-width: 20px; height: 20px; padding: 0 6px;
		border-radius: 10px; background: var(--color-primary); color: white;
		font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center;
	}
	.user-search-input {
		width: 100%; padding: 6px 12px; font-size: 13px; border-radius: 8px;
		border: none; background: rgba(255,255,255,0.05); color: var(--color-text); outline: none;
	}
	.user-results {
		margin-top: 4px; max-height: 192px; overflow-y: auto; border-radius: 8px;
		background: rgba(255,255,255,0.06);
	}
	.user-result-item {
		width: 100%; display: flex; align-items: center; gap: 8px;
		padding: 8px 12px; text-align: left; font-size: 13px;
		color: var(--color-text); transition: background 0.12s;
	}
	.user-result-item:hover { background: rgba(255,255,255,0.05); }
	.dm-avatar-wrap { position: relative; flex-shrink: 0; }
	.dm-item {
		min-height: 52px; margin: 2px 8px; padding: 8px 10px; border-radius: 6px;
		display: flex; align-items: center; gap: 10px; font-size: 14px;
		color: var(--color-text); width: calc(100% - 16px); transition: background 0.15s;
	}
	.dm-item:hover { background: rgba(255,255,255,0.05); }
	.dm-item.active { background: rgba(6,182,212,0.15); }
	.dm-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.dm-top { display: flex; justify-content: space-between; align-items: baseline; }
	.dm-name {
		font-size: 14px; font-weight: 500; color: var(--color-text);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.dm-name.unread { font-weight: 600; }
	.dm-time { font-size: 11px; color: var(--color-text-dim); flex-shrink: 0; margin-left: 8px; }
	.dm-preview {
		font-size: 12px; color: var(--color-text-dim); opacity: 0.6;
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.dm-preview.unread { opacity: 0.9; color: var(--color-text); }
	.preview-you { color: var(--color-text-dim); }
	.new-msg-btn {
		margin: 16px 12px 0; height: 40px; border-radius: 8px;
		background: var(--color-primary); color: white; font-size: 14px; font-weight: 500;
		display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s;
	}
	.new-msg-btn:hover { background: #22d3ee; }
	@media (max-width: 1023px) {
		.sidebar { width: 100%; border-radius: 12px; }
	}
</style>
