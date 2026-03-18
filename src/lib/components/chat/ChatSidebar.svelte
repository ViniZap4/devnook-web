<script lang="ts">
	import type { Conversation } from '$lib/types/message';
	import type { User } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import { isPinned, togglePin, pinnedIds } from '$lib/stores/chatPins.svelte';
	import { isMarkedUnread, markUnread, clearUnread } from '$lib/stores/chatUnread.svelte';
	import { hasDraft } from '$lib/stores/chatDrafts.svelte';
	import { isOnline } from '$lib/stores/presence.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let {
		conversations,
		activeConvoId = null,
		loading = false,
		mobileHidden = false,
		onselect,
		onnewchat,
		oncreatechannel,
		ondeleteconvo
	}: {
		conversations: Conversation[];
		activeConvoId: number | null;
		loading: boolean;
		mobileHidden: boolean;
		onselect: (convo: Conversation) => void;
		onnewchat: (created?: { id: number }) => void;
		oncreatechannel: () => void;
		ondeleteconvo: (convoId: number) => void;
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

	// Context menu state
	let contextMenu = $state<{ x: number; y: number; convoId: number } | null>(null);

	const pinnedConvos = $derived(conversations.filter(c => isPinned(c.id)).filter(matchesSearch));
	const channels = $derived(conversations.filter(c => c.type !== 'direct' && !isPinned(c.id)).filter(matchesSearch));
	const directMessages = $derived(conversations.filter(c => c.type === 'direct' && !isPinned(c.id)).filter(matchesSearch));

	function handleContextMenu(e: MouseEvent, convoId: number) {
		e.preventDefault();
		contextMenu = { x: e.clientX, y: e.clientY, convoId };
	}

	function closeContextMenu() {
		contextMenu = null;
	}

	function getOtherUsername(convo: Conversation): string {
		if (convo.type !== 'direct') return '';
		const other = convo.participants.find(p => p.username !== userStore.user?.username);
		return other?.username || '';
	}

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
			onnewchat(result);
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

	{#if pinnedConvos.length > 0}
		<div class="section-header">
			<span>PINNED</span>
		</div>
		{#each pinnedConvos as convo (convo.id)}
			{@const isActive = activeConvoId === convo.id}
			<button
				class="dm-item pinned-item"
				class:active={isActive}
				onclick={() => onselect(convo)}
				oncontextmenu={(e) => handleContextMenu(e, convo.id)}
			>
				<div class="dm-avatar-wrap">
					{#if convo.type === 'direct'}
						<Avatar username={getAvatar(convo)} size={28} />
						{#if isOnline(getOtherUsername(convo))}
							<span class="online-dot"></span>
						{/if}
					{:else}
						<span class="pin-hash">#</span>
					{/if}
				</div>
				<span class="dm-name truncate" class:unread={convo.unread_count > 0 || isMarkedUnread(convo.id)}>{getDisplayName(convo)}</span>
				{#if hasDraft(convo.id)}
					<span class="draft-indicator">Draft</span>
				{/if}
				{#if convo.unread_count > 0}
					<span class="badge">{convo.unread_count}</span>
				{:else if isMarkedUnread(convo.id)}
					<span class="unread-dot"></span>
				{/if}
			</button>
		{/each}
	{/if}

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
			<button
				class="channel-item"
				class:active={isActive}
				onclick={() => onselect(convo)}
				oncontextmenu={(e) => handleContextMenu(e, convo.id)}
			>
				<span class="hash">#</span>
				<span class="truncate">{getDisplayName(convo)}</span>
				{#if hasDraft(convo.id)}
					<span class="draft-indicator">Draft</span>
				{/if}
				{#if convo.unread_count > 0}
					<span class="badge">{convo.unread_count}</span>
				{:else if isMarkedUnread(convo.id)}
					<span class="unread-dot"></span>
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
			{@const otherName = getOtherUsername(convo)}
			<button
				class="dm-item"
				class:active={isActive}
				onclick={() => onselect(convo)}
				oncontextmenu={(e) => handleContextMenu(e, convo.id)}
			>
				<div class="dm-avatar-wrap">
					<Avatar username={getAvatar(convo)} size={32} />
					{#if otherName && isOnline(otherName)}
						<span class="online-dot"></span>
					{/if}
				</div>
				<div class="dm-content">
					<div class="dm-top">
						<span class="dm-name" class:unread={convo.unread_count > 0 || isMarkedUnread(convo.id)}>{getDisplayName(convo)}</span>
						{#if convo.last_message}
							<span class="dm-time">{formatSidebarTime(convo.last_message.created_at)}</span>
						{/if}
					</div>
					{#if hasDraft(convo.id)}
						<div class="dm-preview draft-text">Draft</div>
					{:else if convo.last_message}
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
				{:else if isMarkedUnread(convo.id)}
					<span class="unread-dot"></span>
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

<!-- Context menu -->
{#if contextMenu}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="ctx-overlay" onclick={closeContextMenu} onkeydown={(e) => { if (e.key === 'Escape') closeContextMenu(); }}></div>
	<div class="ctx-menu" style="left:{contextMenu.x}px;top:{contextMenu.y}px;">
		<button class="ctx-item" onclick={() => { togglePin(contextMenu!.convoId); closeContextMenu(); }}>
			{isPinned(contextMenu.convoId) ? 'Unpin' : 'Pin conversation'}
		</button>
		{#if !isMarkedUnread(contextMenu.convoId)}
			<button class="ctx-item" onclick={() => { markUnread(contextMenu!.convoId); closeContextMenu(); }}>
				Mark as unread
			</button>
		{:else}
			<button class="ctx-item" onclick={() => { clearUnread(contextMenu!.convoId); closeContextMenu(); }}>
				Mark as read
			</button>
		{/if}
		<button class="ctx-item ctx-danger" onclick={() => { ondeleteconvo(contextMenu!.convoId); closeContextMenu(); }}>
			Delete conversation
		</button>
	</div>
{/if}

<style>
	.sidebar {
		width: 264px; flex-shrink: 0; display: flex; flex-direction: column;
		background: var(--glass-bg);
		backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border); border-radius: 16px;
		padding: 12px 0 16px; overflow-y: auto;
		box-shadow: 0 4px 24px color-mix(in srgb, var(--color-overlay, #000) 20%, transparent); min-width: 0;
		animation: chat-panel-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes chat-panel-in {
		from { opacity: 0; transform: translateY(20px) scale(0.97); filter: blur(4px); }
		to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.sidebar { animation: none !important; }
	}
	.sidebar-search { position: relative; margin: 0 12px 12px; }
	.search-icon {
		position: absolute; left: 10px; top: 50%; transform: translateY(-50%);
		width: 14px; height: 14px; color: var(--color-text-dim); opacity: 0.5; pointer-events: none;
	}
	.search-input {
		width: 100%; padding: 7px 30px 7px 30px; font-size: 12px;
		border-radius: 12px; border: 1px solid var(--glass-border);
		background: color-mix(in srgb, var(--color-text) 4%, transparent); color: var(--color-text); outline: none;
		transition: border-color 0.15s, background 0.15s;
	}
	.search-input::placeholder { color: var(--color-text-dim); opacity: 0.5; }
	.search-input:focus { border-color: color-mix(in srgb, var(--color-primary) 40%, transparent); background: color-mix(in srgb, var(--color-text) 6%, transparent); }
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
		height: 32px; margin: 2px 8px; padding: 0 8px; border-radius: 8px;
		display: flex; align-items: center; gap: 8px; font-size: 14px;
		color: var(--color-text-dim); width: calc(100% - 16px); text-align: left;
		transition: background 0.15s, color 0.15s;
	}
	.channel-item:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); color: var(--color-text); }
	.channel-item.active { background: color-mix(in srgb, var(--color-primary) 15%, transparent); color: var(--color-primary); }
	.hash { font-size: 16px; opacity: 0.6; }
	.channel-item.active .hash { color: var(--color-primary); opacity: 1; }
	.badge {
		margin-left: auto; min-width: 20px; height: 20px; padding: 0 6px;
		border-radius: 10px; background: var(--color-primary); color: white;
		font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center;
	}
	.user-search-input {
		width: 100%; padding: 6px 12px; font-size: 13px; border-radius: 12px;
		border: none; background: color-mix(in srgb, var(--color-text) 5%, transparent); color: var(--color-text); outline: none;
	}
	.user-results {
		margin-top: 4px; max-height: 192px; overflow-y: auto; border-radius: 8px;
		background: color-mix(in srgb, var(--color-text) 6%, transparent);
	}
	.user-result-item {
		width: 100%; display: flex; align-items: center; gap: 8px;
		padding: 8px 12px; text-align: left; font-size: 13px;
		color: var(--color-text); transition: background 0.12s;
	}
	.user-result-item:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }
	.dm-avatar-wrap { position: relative; flex-shrink: 0; }
	.dm-item {
		min-height: 52px; margin: 2px 8px; padding: 8px 10px; border-radius: 8px;
		display: flex; align-items: center; gap: 10px; font-size: 14px;
		color: var(--color-text); width: calc(100% - 16px); transition: background 0.15s;
	}
	.dm-item:hover { background: color-mix(in srgb, var(--color-text) 5%, transparent); }
	.dm-item.active { background: color-mix(in srgb, var(--color-primary) 15%, transparent); }
	.dm-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
	.dm-top { display: flex; justify-content: space-between; align-items: baseline; }
	.dm-name {
		font-size: 14px; font-weight: 500; color: var(--color-text);
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.dm-name.unread { font-weight: 600; }
	.dm-time { font-size: 11px; color: var(--color-text-dim); flex-shrink: 0; margin-left: 8px; }
	.dm-preview {
		font-size: 12px; color: var(--color-text-dim); opacity: 0.75;
		overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
	}
	.dm-preview.unread { opacity: 0.9; color: var(--color-text); }
	.preview-you { color: var(--color-text-dim); }
	.new-msg-btn {
		margin: 16px 12px 0; height: 40px; border-radius: 12px;
		background: var(--color-primary); color: white; font-size: 14px; font-weight: 500;
		display: flex; align-items: center; justify-content: center; gap: 8px; transition: background 0.15s;
	}
	.new-msg-btn:hover { background: var(--color-accent); }
	/* Online dot */
	.online-dot {
		position: absolute; bottom: 0; right: 0;
		width: 10px; height: 10px; border-radius: 50%;
		background: var(--color-success); border: 2px solid var(--glass-bg);
	}
	/* Draft indicator */
	.draft-indicator {
		margin-left: auto; font-size: 11px; color: var(--color-warning, #eab308);
		font-style: italic; flex-shrink: 0;
	}
	.draft-text { color: var(--color-warning, #eab308); font-style: italic; opacity: 1; }
	/* Unread dot (no count) */
	.unread-dot {
		margin-left: auto; width: 8px; height: 8px; border-radius: 50%;
		background: var(--color-primary); flex-shrink: 0;
	}
	/* Pinned item */
	.pinned-item { min-height: 36px; padding: 4px 10px; }
	.pin-hash {
		width: 28px; height: 28px; border-radius: 6px;
		background: color-mix(in srgb, var(--color-text) 4%, transparent); display: flex; align-items: center; justify-content: center;
		font-size: 14px; color: var(--color-text-dim);
	}
	/* Context menu */
	.ctx-overlay { position: fixed; inset: 0; z-index: 50; }
	.ctx-menu {
		position: fixed; z-index: 51;
		min-width: 160px; border-radius: 10px; padding: 4px;
		background: var(--glass-bg); backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border);
		box-shadow: 0 8px 32px color-mix(in srgb, var(--color-overlay, #000) 50%, transparent);
		animation: ctx-pop 0.12s ease both;
	}
	.ctx-item {
		width: 100%; text-align: left; padding: 8px 12px; border-radius: 6px;
		font-size: 13px; color: var(--color-text); transition: background 0.1s;
	}
	.ctx-item:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); }
	.ctx-danger { color: var(--color-error); }
	.ctx-danger:hover { background: color-mix(in srgb, var(--color-error) 10%, transparent); }
	@keyframes ctx-pop {
		from { opacity: 0; transform: scale(0.95); }
		to { opacity: 1; transform: scale(1); }
	}
	@media (max-width: 1023px) {
		.sidebar { width: 100%; border-radius: 16px; }
	}
</style>
