<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { userStore } from '$lib/stores/user.svelte';
	import { messages, users } from '$lib/services/api';
	import type { User } from '$lib/services/api';
	import type { Conversation, Message } from '$lib/types/message';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let conversations = $state<Conversation[]>([]);
	let activeConvo = $state<Conversation | null>(null);
	let convoMessages = $state<Message[]>([]);
	let loading = $state(true);
	let msgLoading = $state(false);
	let newMessage = $state('');
	let sending = $state(false);
	let userSearchQuery = $state('');
	let filterQuery = $state('');
	let searchResults = $state<User[]>([]);
	let searching = $state(false);
	let showNewChat = $state(false);
	let chatAreaEl = $state<HTMLElement>();
	let textareaEl = $state<HTMLElement>();
	let searchTimeout: ReturnType<typeof setTimeout>;
	let mobileShowChat = $state(false);
	let unsubscribeWs: (() => void) | null = null;
	let showProfilePanel = $state(true);

	// Channel creation modal state
	let showCreateChannel = $state(false);
	let channelName = $state('');
	let channelDescription = $state('');
	let channelType = $state<'group' | 'repo' | 'org'>('group');
	let creatingChannel = $state(false);
	let channelError = $state('');

	// Channel search state
	let channelSearchQuery = $state('');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await loadConversations();

		const targetUser = $page.url.searchParams.get('user');
		if (targetUser) {
			const existing = conversations.find(c =>
				c.type === 'direct' &&
				c.participants.some(p => p.username === targetUser)
			);
			if (existing) {
				selectConvo(existing);
			} else {
				showNewChat = true;
				userSearchQuery = targetUser;
				handleSearch();
			}
		}

		unsubscribeWs = wsStore.on('chat_message', async (data: Message) => {
			if (activeConvo && data.conversation_id === activeConvo.id) {
				if (data.sender_username === userStore.user?.username) return;
				convoMessages = [...convoMessages, data];
				await tick();
				scrollToBottom();
			}
			const convoIdx = conversations.findIndex(c => c.id === data.conversation_id);
			if (convoIdx >= 0) {
				const updated = { ...conversations[convoIdx] };
				updated.last_message = data;
				updated.updated_at = data.created_at;
				if (!(activeConvo && data.conversation_id === activeConvo.id)) {
					updated.unread_count = (updated.unread_count || 0) + 1;
				}
				conversations = [updated, ...conversations.filter(c => c.id !== data.conversation_id)];
			} else {
				loadConversations();
			}
		});
	});

	onDestroy(() => {
		unsubscribeWs?.();
	});

	async function loadConversations() {
		loading = true;
		try {
			conversations = await messages.conversations();
		} catch {
			conversations = [];
		} finally {
			loading = false;
		}
	}

	async function selectConvo(convo: Conversation) {
		activeConvo = convo;
		mobileShowChat = true;
		showProfilePanel = convo.type === 'direct';
		msgLoading = true;
		try {
			convoMessages = await messages.messages(convo.id);
		} catch {
			convoMessages = [];
		} finally {
			msgLoading = false;
			await tick();
			scrollToBottom();
			textareaEl?.focus();
		}
	}

	function scrollToBottom() {
		if (chatAreaEl) {
			chatAreaEl.scrollTop = chatAreaEl.scrollHeight;
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !activeConvo || sending) return;
		const content = newMessage;
		sending = true;
		newMessage = '';

		const optimistic: Message = {
			id: -Date.now(),
			conversation_id: activeConvo.id,
			sender_id: userStore.user?.id ?? 0,
			sender_username: userStore.user?.username ?? '',
			sender_full_name: userStore.user?.full_name ?? '',
			content,
			type: 'text',
			reactions: [],
			edited: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		convoMessages = [...convoMessages, optimistic];
		await tick();
		scrollToBottom();

		try {
			const { id } = await messages.send(activeConvo.id, { content });
			convoMessages = convoMessages.map(m => m.id === optimistic.id ? { ...m, id } : m);
		} catch {
			convoMessages = convoMessages.filter(m => m.id !== optimistic.id);
		} finally {
			sending = false;
		}
	}

	function handleSearch() {
		const q = userSearchQuery.trim();
		if (!q) { searchResults = []; return; }
		clearTimeout(searchTimeout);
		searchTimeout = setTimeout(async () => {
			searching = true;
			try {
				searchResults = await users.search(q);
				searchResults = searchResults.filter(u => u.username !== userStore.user?.username);
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
			selectConvo(existing);
			showNewChat = false;
			userSearchQuery = '';
			searchResults = [];
			return;
		}

		try {
			const result = await messages.createConversation({
				type: 'direct',
				participants: [user.username]
			});
			showNewChat = false;
			userSearchQuery = '';
			searchResults = [];
			await loadConversations();
			const convo = conversations.find(c => c.id === result.id);
			if (convo) selectConvo(convo);
		} catch {
			// ignore
		}
	}

	async function handleCreateChannel() {
		if (!channelName.trim()) {
			channelError = 'Channel name is required';
			return;
		}
		creatingChannel = true;
		channelError = '';
		try {
			const result = await messages.createConversation({
				type: channelType,
				name: channelName.trim(),
				participants: []
			});
			showCreateChannel = false;
			channelName = '';
			channelDescription = '';
			channelType = 'group';
			await loadConversations();
			const convo = conversations.find(c => c.id === result.id);
			if (convo) selectConvo(convo);
		} catch (err: any) {
			channelError = err?.message || 'Failed to create channel';
		} finally {
			creatingChannel = false;
		}
	}

	function closeCreateChannelModal() {
		showCreateChannel = false;
		channelName = '';
		channelDescription = '';
		channelType = 'group';
		channelError = '';
	}

	function getConvoDisplayName(convo: Conversation): string {
		if (convo.name) return convo.name;
		if (convo.type === 'repo') return `${convo.repo_owner}/${convo.repo_name}`;
		if (convo.type === 'org') return convo.org_name || '';
		if (convo.type === 'issue') return `Issue #${convo.issue_number}`;
		const other = convo.participants.find(p => p.username !== userStore.user?.username);
		return other?.full_name || other?.username || 'Chat';
	}

	function getConvoUsername(convo: Conversation): string {
		if (convo.type === 'direct') {
			const other = convo.participants.find(p => p.username !== userStore.user?.username);
			return other?.username || '';
		}
		return '';
	}

	function getConvoAvatar(convo: Conversation): string {
		if (convo.type === 'direct') {
			const other = convo.participants.find(p => p.username !== userStore.user?.username);
			return other?.username || '?';
		}
		return convo.name?.charAt(0) || '#';
	}

	function getConvoDescription(convo: Conversation): string {
		if (convo.type === 'repo') return `Discussion about ${convo.repo_owner}/${convo.repo_name}`;
		if (convo.type === 'org') return `Organization chat`;
		if (convo.type === 'issue') return `Issue discussion`;
		return '';
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
	}

	function convoFilter(convo: Conversation): boolean {
		if (!filterQuery.trim() || showNewChat) return true;
		const name = getConvoDisplayName(convo).toLowerCase();
		return name.includes(filterQuery.toLowerCase());
	}

	function channelSearchFilter(convo: Conversation): boolean {
		if (!channelSearchQuery.trim()) return true;
		const name = getConvoDisplayName(convo).toLowerCase();
		return name.includes(channelSearchQuery.toLowerCase());
	}

	function getDateLabel(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diff = now.getTime() - date.getTime();
		const days = Math.floor(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Yesterday';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
	}

	function shouldShowDateDivider(msgs: Message[], idx: number): boolean {
		if (idx === 0) return true;
		const curr = new Date(msgs[idx].created_at).toDateString();
		const prev = new Date(msgs[idx - 1].created_at).toDateString();
		return curr !== prev;
	}

	const filteredConversations = $derived(conversations.filter(convoFilter));
	const directMessages = $derived(filteredConversations.filter(c => c.type === 'direct').filter(channelSearchFilter));
	const channels = $derived(filteredConversations.filter(c => c.type !== 'direct').filter(channelSearchFilter));
</script>

<PageShell width="full">
	<div class="chat-wrapper">
		<!-- Channels Sidebar -->
		<div class="channels-sidebar {mobileShowChat ? 'hidden lg:flex' : ''}">
			<!-- Channel search input -->
			<div class="sidebar-search">
				<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
				<input
					type="text"
					bind:value={channelSearchQuery}
					placeholder="Search conversations..."
					class="sidebar-search-input"
				/>
				{#if channelSearchQuery}
					<button class="search-clear" onclick={() => { channelSearchQuery = ''; }}>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				{/if}
			</div>

			<!-- Section: Channels -->
			{#if channels.length > 0 || !loading}
				<div class="section-header">
					<span>CHANNELS</span>
					<button onclick={() => { showCreateChannel = true; }} title="Create channel">
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
					</button>
				</div>
				{#each channels as convo}
					{@const isActive = activeConvo?.id === convo.id}
					<button class="channel-item" class:active={isActive} onclick={() => selectConvo(convo)}>
						<span class="hash">#</span>
						<span class="truncate">{getConvoDisplayName(convo)}</span>
						{#if convo.unread_count > 0}
							<span class="ch-badge">{convo.unread_count}</span>
						{/if}
					</button>
				{/each}
				{#if channelSearchQuery && channels.length === 0}
					<p class="no-results-hint">No channels match "{channelSearchQuery}"</p>
				{/if}
			{/if}

			<!-- Section: Direct Messages -->
			<div class="section-header" style="margin-top: 16px;">
				<span>DIRECT MESSAGES</span>
				<button onclick={() => { showNewChat = !showNewChat; userSearchQuery = ''; searchResults = []; }} title="Search users">
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
				</button>
			</div>

			{#if showNewChat}
				<div class="px-2 mb-2">
					<input
						type="text"
						bind:value={userSearchQuery}
						oninput={handleSearch}
						placeholder="Find a user..."
						class="w-full px-3 py-1.5 text-[13px] rounded-lg border-none"
						style="background: rgba(255,255,255,0.05); color: var(--color-text);"
					/>
					{#if searchResults.length > 0}
						<div class="mt-1 max-h-48 overflow-y-auto rounded-lg" style="background: rgba(255, 255, 255, 0.06);">
							{#each searchResults as user}
								<button
									class="w-full flex items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-[rgba(255,255,255,0.05)] transition-colors"
									style="color: var(--color-text);"
									onclick={() => startChatWith(user)}
								>
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
				{#each directMessages as convo}
					{@const isActive = activeConvo?.id === convo.id}
					<button class="dm-item" class:active={isActive} onclick={() => selectConvo(convo)}>
						<Avatar username={getConvoAvatar(convo)} size={24} />
						<span class="truncate flex-1 text-left">{getConvoDisplayName(convo)}</span>
						{#if convo.unread_count > 0}
							<span class="ch-badge">{convo.unread_count}</span>
						{/if}
					</button>
				{/each}
				{#if channelSearchQuery && directMessages.length === 0}
					<p class="no-results-hint">No conversations match "{channelSearchQuery}"</p>
				{/if}
			{/if}

			<div class="flex-1"></div>

			<!-- New Message button -->
			<button class="new-msg-btn" onclick={() => { showNewChat = true; userSearchQuery = ''; searchResults = []; }}>
				<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Message
			</button>
		</div>

		<!-- Chat Area -->
		<div class="chat-area {!mobileShowChat ? 'hidden lg:flex' : ''}">
			{#if !activeConvo}
				<div class="flex-1 flex items-center justify-center">
					<div class="empty-state-container">
						<div class="empty-state-icon-ring">
							<div class="empty-state-icon">
								<svg class="w-8 h-8" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
							</div>
						</div>
						<p class="text-[16px] font-semibold" style="color: var(--color-text);">Select a conversation</p>
						<p class="text-[13px] mt-1" style="color: var(--color-text-dim);">Choose from the sidebar or start a new chat.</p>
						<button
							class="empty-state-action"
							onclick={() => { showNewChat = true; userSearchQuery = ''; searchResults = []; }}
						>
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
							Start a new conversation
						</button>
					</div>
				</div>
			{:else}
				<!-- Channel Header -->
				<div class="channel-header">
					<button
						class="lg:hidden shrink-0 mr-1"
						style="color: var(--color-text-dim);"
						onclick={() => { mobileShowChat = false; }}
					>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
					</button>
					<div class="channel-info">
						<div class="channel-title">
							{#if activeConvo.type !== 'direct'}
								<span class="hash-icon">#</span>
							{/if}
							<span class="ch-name">{getConvoDisplayName(activeConvo)}</span>
						</div>
						{#if getConvoDescription(activeConvo)}
							<span class="ch-desc">{getConvoDescription(activeConvo)}</span>
						{:else if activeConvo.type === 'direct'}
							<span class="ch-desc">@{getConvoUsername(activeConvo)}</span>
						{/if}
					</div>
					<div class="channel-actions">
						<!-- Member avatars -->
						{#if activeConvo.participants.length > 1}
							<div class="member-avatars">
								{#each activeConvo.participants.slice(0, 3) as p}
									<div class="member-av"><Avatar username={p.username} size={28} /></div>
								{/each}
								{#if activeConvo.participants.length > 3}
									<div class="member-count">+{activeConvo.participants.length - 3}</div>
								{/if}
							</div>
						{/if}
						{#if activeConvo.type === 'repo'}
							<a href="/{activeConvo.repo_owner}/{activeConvo.repo_name}" class="action-btn" title="View repo">
								<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
							</a>
						{/if}
						{#if activeConvo.type === 'direct'}
							<a href="/{getConvoUsername(activeConvo)}" class="action-btn" title="View profile">
								<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
							</a>
						{/if}
					</div>
				</div>

				<!-- Messages -->
				<div bind:this={chatAreaEl} class="messages-area">
					{#if msgLoading}
						<div class="flex-1 flex items-center justify-center py-20">
							<Spinner size="sm" />
						</div>
					{:else if convoMessages.length === 0}
						<div class="flex-1 flex items-center justify-center py-20">
							<div class="empty-messages-container">
								<div class="empty-msg-icon">
									<svg class="w-10 h-10" style="color: var(--color-primary); opacity: 0.5;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
									</svg>
								</div>
								<p class="text-[15px] font-semibold" style="color: var(--color-text);">No messages yet</p>
								<p class="text-[13px] mt-1" style="color: var(--color-text-dim); opacity: 0.6;">
									Be the first to break the silence.
								</p>
							</div>
						</div>
					{:else}
						{#each convoMessages as msg, i}
							{@const isMine = msg.sender_username === userStore.user?.username}
							{@const prevMsg = convoMessages[i - 1]}
							{@const sameSender = prevMsg?.sender_username === msg.sender_username}
							{@const showHeader = !sameSender || i === 0 || shouldShowDateDivider(convoMessages, i)}

							{#if shouldShowDateDivider(convoMessages, i)}
								<div class="date-divider">
									<div class="div-line"></div>
									<span class="div-text">{getDateLabel(msg.created_at)}</span>
									<div class="div-line"></div>
								</div>
							{/if}

							<div class="message-wrapper">
								<div class="message" class:self={isMine} class:grouped={!showHeader}>
									{#if !isMine}
										<div class="msg-avatar-col">
											{#if showHeader}
												<Avatar username={msg.sender_username} size={40} />
											{/if}
										</div>
									{/if}
									<div class="msg-body">
										{#if showHeader}
											<div class="msg-header" class:msg-header-self={isMine}>
												<span class="msg-name">{msg.sender_full_name || msg.sender_username}</span>
												<span class="msg-time"><RelativeTime date={msg.created_at} /></span>
											</div>
										{/if}
										{#if isMine}
											<div class="bubble-self">
												{msg.content}
											</div>
										{:else}
											<div class="msg-text">
												{msg.content}
											</div>
										{/if}
										{#if msg.id < 0}
											<span class="text-[10px] mt-0.5 block" style="color: var(--color-text-dim); opacity: 0.4; {isMine ? 'text-align: right;' : ''}">Sending...</span>
										{/if}
									</div>
									{#if isMine}
										<div class="msg-avatar-col">
											{#if showHeader}
												<Avatar username={msg.sender_username} size={40} />
											{/if}
										</div>
									{/if}
								</div>
								<!-- Reaction bar (appears on hover) -->
								<div class="reaction-bar" class:reaction-bar-self={isMine}>
									<button class="reaction-btn" title="Like">
										<span>&#128077;</span>
									</button>
									<button class="reaction-btn" title="Laugh">
										<span>&#128516;</span>
									</button>
									<button class="reaction-btn" title="Love">
										<span>&#10084;&#65039;</span>
									</button>
									<button class="reaction-btn" title="Celebrate">
										<span>&#127881;</span>
									</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<!-- Message Input -->
				<div class="message-input-container">
					<div class="message-input-box">
						<!-- Formatting toolbar -->
						<div class="formatting-toolbar">
							<button class="format-btn" title="Bold"><strong>B</strong></button>
							<button class="format-btn" title="Italic"><em>I</em></button>
							<button class="format-btn" title="Code">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
							</button>
							<button class="format-btn" title="Link">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path stroke-linecap="round" stroke-linejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
							</button>
							<button class="format-btn" title="List">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
							</button>
						</div>
						<!-- Input row -->
						<div class="input-row">
							<button class="attach-btn" title="Attach file">
								<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
							</button>
							<textarea
								bind:this={textareaEl}
								bind:value={newMessage}
								placeholder="Message {activeConvo.type === 'direct' ? getConvoDisplayName(activeConvo) : '#' + getConvoDisplayName(activeConvo)}..."
								class="text-input"
								rows="1"
								onkeydown={handleKeydown}
								oninput={(e) => {
									const target = e.currentTarget;
									target.style.height = 'auto';
									target.style.height = Math.min(target.scrollHeight, 120) + 'px';
								}}
							></textarea>
							<button class="emoji-btn" title="Emoji">
								<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" y1="9" x2="9.01" y2="9" /><line x1="15" y1="9" x2="15.01" y2="9" /></svg>
							</button>
							<button
								class="send-btn"
								disabled={!newMessage.trim() || sending}
								onclick={sendMessage}
							>
								<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
							</button>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Profile Panel -->
		{#if activeConvo && activeConvo.type === 'direct' && showProfilePanel}
			{@const otherUser = activeConvo.participants.find(p => p.username !== userStore.user?.username)}
			{#if otherUser}
				<div class="profile-panel">
					<div class="flex flex-col items-center">
						<Avatar username={otherUser.username} size={80} />
						<h3 class="profile-name">{otherUser.full_name || otherUser.username}</h3>
						<span class="profile-handle">@{otherUser.username}</span>
					</div>

					<div class="profile-section">
						<span class="profile-section-title">STATUS</span>
						<div class="flex items-center gap-2">
							<span class="w-2.5 h-2.5 rounded-full" style="background: var(--color-success);"></span>
							<span class="text-[13px]" style="color: var(--color-text);">Online</span>
						</div>
					</div>

					<div class="profile-section">
						<span class="profile-section-title">ROLE</span>
						<span class="text-[13px] capitalize" style="color: var(--color-text);">{otherUser.role}</span>
					</div>

					<div class="flex-1"></div>

					<div class="profile-actions">
						<a href="/{otherUser.username}" class="profile-action-btn secondary">
							<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
							Profile
						</a>
					</div>
				</div>
			{/if}
		{/if}
	</div>

	<!-- Create Channel Modal -->
	{#if showCreateChannel}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="modal-backdrop" onclick={closeCreateChannelModal}>
			<div class="modal-card" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h2 class="modal-title">Create Channel</h2>
					<button class="modal-close" onclick={closeCreateChannelModal}>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>

				<div class="modal-body">
					<div class="form-group">
						<label class="form-label" for="channel-name">Channel Name</label>
						<input
							id="channel-name"
							type="text"
							bind:value={channelName}
							placeholder="e.g. general, project-alpha"
							class="form-input"
						/>
					</div>

					<div class="form-group">
						<label class="form-label" for="channel-desc">Description <span class="text-[11px]" style="color: var(--color-text-dim); opacity: 0.5;">(optional)</span></label>
						<input
							id="channel-desc"
							type="text"
							bind:value={channelDescription}
							placeholder="What is this channel about?"
							class="form-input"
						/>
					</div>

					<div class="form-group">
						<label class="form-label" for="channel-type">Type</label>
						<select
							id="channel-type"
							bind:value={channelType}
							class="form-input form-select"
						>
							<option value="group">Group</option>
							<option value="repo">Repository</option>
							<option value="org">Organization</option>
						</select>
					</div>

					{#if channelError}
						<p class="form-error">{channelError}</p>
					{/if}
				</div>

				<div class="modal-footer">
					<button class="modal-btn-cancel" onclick={closeCreateChannelModal}>Cancel</button>
					<button
						class="modal-btn-submit"
						disabled={creatingChannel || !channelName.trim()}
						onclick={handleCreateChannel}
					>
						{#if creatingChannel}
							<Spinner size="sm" />
						{:else}
							Create Channel
						{/if}
					</button>
				</div>
			</div>
		</div>
	{/if}
</PageShell>

<style>
	.chat-wrapper {
		display: flex;
		height: calc(100vh - 100px);
		gap: 24px;
		position: relative;
	}

	/* === Channels Sidebar === */
	.channels-sidebar {
		width: 260px;
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		background: rgba(13, 17, 26, 0.92);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border);
		border-radius: 20px;
		padding: 12px 0 16px;
		overflow-y: auto;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
	}

	/* === Sidebar Search === */
	.sidebar-search {
		position: relative;
		margin: 0 12px 12px;
	}
	.search-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		width: 14px;
		height: 14px;
		color: var(--color-text-dim);
		opacity: 0.5;
		pointer-events: none;
	}
	.sidebar-search-input {
		width: 100%;
		padding: 7px 30px 7px 30px;
		font-size: 12px;
		border-radius: 8px;
		border: 1px solid rgba(255,255,255,0.06);
		background: rgba(255,255,255,0.04);
		color: var(--color-text);
		outline: none;
		transition: border-color 0.15s, background 0.15s;
	}
	.sidebar-search-input::placeholder {
		color: var(--color-text-dim);
		opacity: 0.5;
	}
	.sidebar-search-input:focus {
		border-color: rgba(6,182,212,0.4);
		background: rgba(255,255,255,0.06);
	}
	.search-clear {
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--color-text-dim);
		opacity: 0.5;
		transition: opacity 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.search-clear:hover {
		opacity: 1;
	}
	.no-results-hint {
		padding: 8px 16px;
		font-size: 12px;
		color: var(--color-text-dim);
		opacity: 0.5;
	}

	.section-header {
		padding: 0 16px;
		margin-bottom: 8px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-dim);
	}
	.section-header button {
		color: var(--color-text-dim);
		opacity: 0.7;
		transition: opacity 0.15s;
	}
	.section-header button:hover {
		opacity: 1;
	}

	.channel-item {
		height: 32px;
		margin: 2px 8px;
		padding: 0 8px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
		color: var(--color-text-dim);
		width: calc(100% - 16px);
		text-align: left;
		transition: background 0.15s, color 0.15s;
	}
	.channel-item:hover {
		background: rgba(255,255,255,0.05);
		color: var(--color-text);
	}
	.channel-item.active {
		background: rgba(6,182,212,0.15);
		color: #22d3ee;
	}
	.channel-item .hash {
		font-size: 16px;
		opacity: 0.6;
	}
	.channel-item.active .hash {
		color: var(--color-primary);
		opacity: 1;
	}

	.ch-badge {
		margin-left: auto;
		min-width: 20px;
		height: 20px;
		padding: 0 6px;
		border-radius: 10px;
		background: #3b82f6;
		color: white;
		font-size: 11px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.dm-item {
		height: 36px;
		margin: 2px 8px;
		padding: 0 8px;
		border-radius: 10px;
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 14px;
		color: var(--color-text);
		width: calc(100% - 16px);
		transition: background 0.15s;
	}
	.dm-item:hover {
		background: rgba(255,255,255,0.05);
	}
	.dm-item.active {
		background: rgba(6,182,212,0.15);
		color: #22d3ee;
	}

	.new-msg-btn {
		margin: 16px 12px 0;
		height: 40px;
		border-radius: 12px;
		background: var(--color-primary);
		color: white;
		font-size: 14px;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		transition: background 0.15s;
	}
	.new-msg-btn:hover {
		background: #22d3ee;
	}

	/* === Chat Area === */
	.chat-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		background: rgba(13, 17, 26, 0.88);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border);
		border-radius: 20px;
		overflow: hidden;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
	}

	/* === Empty State === */
	.empty-state-container {
		text-align: center;
		max-width: 320px;
		animation: emptyStateFadeIn 500ms ease-out;
	}
	.empty-state-icon-ring {
		width: 72px;
		height: 72px;
		margin: 0 auto 20px;
		border-radius: 50%;
		background: rgba(6,182,212,0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: emptyStatePulse 3s ease-in-out infinite;
	}
	.empty-state-icon {
		width: 56px;
		height: 56px;
		border-radius: 50%;
		background: rgba(6,182,212,0.12);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.empty-state-action {
		margin-top: 20px;
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		border-radius: 10px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-primary);
		background: rgba(6,182,212,0.1);
		border: 1px solid rgba(6,182,212,0.2);
		transition: background 0.15s, border-color 0.15s;
	}
	.empty-state-action:hover {
		background: rgba(6,182,212,0.18);
		border-color: rgba(6,182,212,0.35);
	}

	@keyframes emptyStateFadeIn {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes emptyStatePulse {
		0%, 100% { transform: scale(1); opacity: 1; }
		50% { transform: scale(1.06); opacity: 0.8; }
	}

	/* === Empty Messages State === */
	.empty-messages-container {
		text-align: center;
		animation: emptyStateFadeIn 400ms ease-out;
	}
	.empty-msg-icon {
		width: 64px;
		height: 64px;
		margin: 0 auto 16px;
		border-radius: 16px;
		background: rgba(6,182,212,0.08);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: emptyMsgFloat 4s ease-in-out infinite;
	}
	@keyframes emptyMsgFloat {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-6px); }
	}

	.channel-header {
		height: 64px;
		padding: 0 20px;
		display: flex;
		align-items: center;
		gap: 12px;
		border-bottom: 1px solid var(--glass-border);
		flex-shrink: 0;
		border-radius: 20px 20px 0 0;
	}
	.channel-info {
		flex: 1;
		min-width: 0;
	}
	.channel-title {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.hash-icon {
		color: var(--color-text-dim);
		font-size: 18px;
	}
	.ch-name {
		font-size: 16px;
		font-weight: 600;
		color: var(--color-text);
	}
	.ch-desc {
		font-size: 13px;
		color: var(--color-text-dim);
	}
	.channel-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.member-avatars {
		display: flex;
	}
	.member-av {
		margin-left: -8px;
		border-radius: 50%;
		border: 2px solid var(--glass-border);
	}
	.member-av:first-child {
		margin-left: 0;
	}
	.member-count {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.06);
		color: var(--color-text-dim);
		font-size: 10px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: -8px;
	}
	.action-btn {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		color: var(--color-text-dim);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}
	.action-btn:hover {
		background: rgba(255,255,255,0.06);
		color: var(--color-text);
	}

	/* === Messages === */
	.messages-area {
		flex: 1;
		overflow-y: auto;
		padding: 20px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.date-divider {
		display: flex;
		align-items: center;
		gap: 16px;
		margin: 24px 0;
	}
	.div-line {
		flex: 1;
		height: 1px;
		background: rgba(255,255,255,0.06);
	}
	.div-text {
		font-size: 11px;
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-dim);
	}

	/* === Message wrapper with reactions === */
	.message-wrapper {
		position: relative;
	}
	.message-wrapper:hover .reaction-bar {
		opacity: 1;
		pointer-events: auto;
		transform: translateY(0);
	}
	.reaction-bar {
		position: absolute;
		bottom: -4px;
		left: 52px;
		display: flex;
		gap: 2px;
		padding: 2px 4px;
		border-radius: 8px;
		background: rgba(13, 17, 26, 0.95);
		border: 1px solid rgba(255,255,255,0.08);
		backdrop-filter: blur(12px);
		-webkit-backdrop-filter: blur(12px);
		opacity: 0;
		pointer-events: none;
		transform: translateY(4px);
		transition: opacity 0.15s, transform 0.15s;
		z-index: 5;
	}
	.reaction-bar-self {
		left: auto;
		right: 52px;
	}
	.reaction-btn {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		transition: background 0.12s, transform 0.12s;
	}
	.reaction-btn:hover {
		background: rgba(255,255,255,0.08);
		transform: scale(1.2);
	}

	.message {
		display: flex;
		gap: 12px;
		margin-bottom: 4px;
		animation: messageSlideIn 200ms ease-out;
	}
	.message.grouped {
		margin-bottom: 2px;
	}
	.message.self {
		flex-direction: row-reverse;
	}
	.message.self .msg-body {
		align-items: flex-end;
	}
	.message.self .msg-header {
		flex-direction: row-reverse;
	}

	.msg-avatar-col {
		width: 40px;
		flex-shrink: 0;
	}
	.msg-body {
		flex: 1;
		max-width: 600px;
		display: flex;
		flex-direction: column;
	}
	.msg-header {
		display: flex;
		align-items: baseline;
		gap: 8px;
		margin-bottom: 4px;
	}
	.msg-name {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}
	.msg-time {
		font-size: 12px;
		color: var(--color-text-dim);
	}
	.msg-text {
		font-size: 15px;
		line-height: 1.5;
		color: var(--color-text);
		opacity: 0.9;
	}

	.bubble-self {
		background: #0e7490;
		color: white;
		padding: 12px 16px;
		border-radius: 16px 16px 4px 16px;
		font-size: 15px;
		line-height: 1.5;
		max-width: 480px;
		animation: bubblePop 200ms ease-out;
	}

	@keyframes messageSlideIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@keyframes bubblePop {
		0% { transform: scale(0.95); opacity: 0; }
		100% { transform: scale(1); opacity: 1; }
	}

	/* === Message Input === */
	.message-input-container {
		padding: 16px 20px;
		flex-shrink: 0;
	}
	.message-input-box {
		border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
		border-radius: 16px;
		background: rgba(255, 255, 255, 0.06);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		overflow: hidden;
		transition: border-color 0.15s;
	}
	.message-input-box:focus-within {
		border-color: rgba(6,182,212,0.5);
	}
	.formatting-toolbar {
		padding: 8px 12px;
		border-bottom: 1px solid var(--glass-border);
		display: flex;
		gap: 4px;
	}
	.format-btn {
		width: 32px;
		height: 32px;
		border-radius: 6px;
		color: var(--color-text-dim);
		font-size: 14px;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background 0.15s, color 0.15s;
	}
	.format-btn:hover {
		background: rgba(255,255,255,0.06);
		color: var(--color-text);
	}
	.input-row {
		padding: 12px;
		display: flex;
		align-items: center;
		gap: 12px;
		background: rgba(15, 22, 41, 0.6);
	}
	.attach-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: rgba(255,255,255,0.05);
		color: var(--color-text-dim);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s, color 0.15s;
	}
	.attach-btn:hover {
		background: rgba(255,255,255,0.1);
		color: var(--color-text);
	}
	.text-input {
		flex: 1;
		background: transparent;
		border: none;
		outline: none;
		font-size: 15px;
		color: var(--color-text);
		resize: none;
		min-height: 24px;
		max-height: 120px;
		font-family: inherit;
	}
	.text-input::placeholder {
		color: var(--color-text-dim);
	}
	.emoji-btn {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		color: var(--color-text-dim);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: color 0.15s;
	}
	.emoji-btn:hover {
		color: #fbbf24;
	}
	.send-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--color-primary);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s, box-shadow 0.15s;
	}
	.send-btn:hover:not(:disabled) {
		background: #22d3ee;
		box-shadow: 0 0 16px rgba(6,182,212,0.4);
	}
	.send-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* === Profile Panel === */
	.profile-panel {
		width: 280px;
		flex-shrink: 0;
		background: rgba(13, 17, 26, 0.92);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border);
		border-radius: 20px;
		padding: 24px 20px;
		display: none;
		flex-direction: column;
		overflow-y: auto;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
	}
	@media (min-width: 1440px) {
		.profile-panel {
			display: flex;
		}
	}
	.profile-name {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
		text-align: center;
		margin-top: 16px;
	}
	.profile-handle {
		font-size: 14px;
		color: var(--color-primary);
		text-align: center;
		margin-top: 4px;
	}
	.profile-section {
		margin-top: 20px;
		padding-top: 16px;
		border-top: 1px solid var(--glass-border);
	}
	.profile-section-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-dim);
		margin-bottom: 12px;
		display: block;
	}
	.profile-actions {
		display: flex;
		gap: 8px;
		margin-top: 20px;
	}
	.profile-action-btn {
		flex: 1;
		height: 36px;
		border-radius: 12px;
		font-size: 13px;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		text-decoration: none;
		transition: background 0.15s;
	}
	.profile-action-btn.secondary {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--glass-border);
		color: var(--color-text);
	}
	.profile-action-btn.secondary:hover {
		background: rgba(255,255,255,0.08);
	}

	/* === Create Channel Modal === */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		z-index: 100;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		animation: modalFadeIn 150ms ease-out;
	}
	.modal-card {
		width: 100%;
		max-width: 440px;
		margin: 0 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
		border-radius: 16px;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255,255,255,0.04) inset;
		animation: modalSlideIn 200ms ease-out;
		overflow: hidden;
	}
	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px 16px;
		border-bottom: 1px solid var(--glass-border);
	}
	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--color-text);
	}
	.modal-close {
		color: var(--color-text-dim);
		opacity: 0.7;
		transition: opacity 0.15s;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border-radius: 8px;
	}
	.modal-close:hover {
		opacity: 1;
		background: rgba(255,255,255,0.06);
	}
	.modal-body {
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.form-label {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
	}
	.form-input {
		width: 100%;
		padding: 10px 14px;
		font-size: 14px;
		border-radius: 10px;
		border: 1px solid rgba(255,255,255,0.08);
		background: #0f1629;
		color: var(--color-text);
		outline: none;
		transition: border-color 0.15s;
		font-family: inherit;
	}
	.form-input::placeholder {
		color: var(--color-text-dim);
		opacity: 0.5;
	}
	.form-input:focus {
		border-color: rgba(6,182,212,0.5);
	}
	.form-select {
		appearance: none;
		background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
		background-repeat: no-repeat;
		background-position: right 12px center;
		padding-right: 36px;
		cursor: pointer;
	}
	.form-select option {
		background: #0f1629;
		color: var(--color-text);
	}
	.form-error {
		font-size: 13px;
		color: var(--color-error, #ef4444);
		padding: 8px 12px;
		border-radius: 8px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.15);
	}
	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		padding: 16px 24px 20px;
		border-top: 1px solid var(--glass-border);
	}
	.modal-btn-cancel {
		padding: 8px 18px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text-dim);
		background: rgba(255,255,255,0.06);
		border: 1px solid var(--glass-border);
		transition: background 0.15s;
	}
	.modal-btn-cancel:hover {
		background: rgba(255,255,255,0.1);
	}
	.modal-btn-submit {
		padding: 8px 20px;
		border-radius: 8px;
		font-size: 13px;
		font-weight: 500;
		color: white;
		background: var(--color-primary);
		transition: background 0.15s, box-shadow 0.15s;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.modal-btn-submit:hover:not(:disabled) {
		background: #22d3ee;
		box-shadow: 0 0 16px rgba(6,182,212,0.3);
	}
	.modal-btn-submit:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	@keyframes modalFadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes modalSlideIn {
		from { opacity: 0; transform: scale(0.96) translateY(8px); }
		to { opacity: 1; transform: scale(1) translateY(0); }
	}

	/* Responsive */
	@media (max-width: 1023px) {
		.channels-sidebar {
			width: 100%;
			border-radius: 16px;
		}
		.chat-wrapper {
			height: calc(100vh - 80px);
			gap: 16px;
		}
		.chat-area {
			border-radius: 16px;
		}
	}
</style>
