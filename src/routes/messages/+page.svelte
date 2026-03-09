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

	const filteredConversations = $derived(conversations.filter(convoFilter));
</script>

<PageShell maxWidth="max-w-6xl">
	<div class="flex flex-col gap-4">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<h1 class="text-lg font-semibold" style="color: var(--color-text);">Messages</h1>
				{#if conversations.length > 0}
					<span class="text-[11px] tabular-nums px-1.5 py-0.5 rounded-md" style="background: var(--color-surface); color: var(--color-text-dim); border: 1px solid var(--color-border);">{conversations.length}</span>
				{/if}
			</div>
			<button
				class="flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
				style="background: var(--color-primary);"
				onclick={() => { showNewChat = !showNewChat; userSearchQuery = ''; searchResults = []; }}
			>
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Chat
			</button>
		</div>

		<!-- New chat search panel -->
		{#if showNewChat}
			<div class="rounded-xl border overflow-hidden" style="border-color: var(--color-border); background: var(--color-surface);">
				<div class="p-3 border-b" style="border-color: var(--color-border);">
					<div class="relative">
						<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
						<input
							type="text"
							bind:value={userSearchQuery}
							oninput={handleSearch}
							placeholder="Search users to message..."
							class="w-full pl-10 pr-4 py-2 text-sm rounded-lg border bg-transparent transition-colors focus:border-[var(--color-primary)]"
							style="border-color: var(--color-border); color: var(--color-text); background: var(--color-background);"
						/>
						{#if searching}
							<div class="absolute right-3 top-1/2 -translate-y-1/2">
								<Spinner size="xs" />
							</div>
						{/if}
					</div>
				</div>
				{#if searchResults.length > 0}
					<div class="max-h-64 overflow-y-auto">
						{#each searchResults as user}
							<button
								class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group"
								onclick={() => startChatWith(user)}
								onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
								onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
							>
								<Avatar username={user.username} size={32} />
								<div class="flex-1 min-w-0">
									<span class="text-sm font-medium block truncate" style="color: var(--color-text);">{user.full_name || user.username}</span>
									<span class="text-xs" style="color: var(--color-text-dim);">@{user.username}</span>
								</div>
								<span class="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity" style="color: var(--color-primary);">Message</span>
							</button>
						{/each}
					</div>
				{:else if userSearchQuery.trim() && !searching}
					<div class="p-6 text-center">
						<p class="text-sm" style="color: var(--color-text-dim);">No users found for "{userSearchQuery}"</p>
					</div>
				{:else if !userSearchQuery.trim()}
					<div class="p-6 text-center">
						<p class="text-xs" style="color: var(--color-text-dim); opacity: 0.5;">Type a username to find someone to chat with</p>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Main chat layout -->
		<div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] rounded-xl border overflow-hidden chat-container" style="border-color: var(--color-border); background: var(--color-surface);">
			<!-- Conversations sidebar -->
			<div class="border-r flex flex-col {mobileShowChat ? 'hidden lg:flex' : ''}" style="border-color: var(--color-border);">
				<!-- Sidebar search -->
				<div class="p-2.5 border-b" style="border-color: var(--color-border);">
					<div class="relative">
						<svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style="color: var(--color-text-dim); opacity: 0.5;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8" /><path stroke-linecap="round" d="m21 21-4.3-4.3" /></svg>
						<input
							type="text"
							bind:value={filterQuery}
							placeholder="Filter conversations..."
							class="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border bg-transparent transition-colors focus:border-[var(--color-primary)]"
							style="border-color: var(--color-border); color: var(--color-text); background: var(--color-background);"
						/>
					</div>
				</div>

				<!-- Conversation list -->
				<div class="flex-1 overflow-y-auto">
					{#if loading}
						<div class="p-8 text-center">
							<div class="mx-auto w-fit"><Spinner size="sm" /></div>
						</div>
					{:else if filteredConversations.length === 0}
						<div class="p-8 text-center flex flex-col items-center gap-3">
							<svg class="w-10 h-10 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
							<p class="text-xs" style="color: var(--color-text-dim);">No conversations yet</p>
							<button
								class="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
								style="color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, transparent);"
								onclick={() => { showNewChat = true; }}
							>Start a conversation</button>
						</div>
					{:else}
						{#each filteredConversations as convo}
							{@const isActive = activeConvo?.id === convo.id}
							<button
								class="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors relative"
								style="background: {isActive ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent'};"
								onclick={() => selectConvo(convo)}
								onmouseenter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
								onmouseleave={(e) => { e.currentTarget.style.background = isActive ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent'; }}
							>
								{#if isActive}
									<div class="absolute left-0 top-2 bottom-2 w-0.5 rounded-r" style="background: var(--color-primary);"></div>
								{/if}

								<div class="shrink-0 relative">
									{#if convo.type === 'direct'}
										<Avatar username={getConvoAvatar(convo)} size={34} />
									{:else}
										<div class="w-[34px] h-[34px] rounded-full flex items-center justify-center text-xs font-semibold" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">
											{#if convo.type === 'repo'}
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
											{:else if convo.type === 'org'}
												<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16" /></svg>
											{:else}
												#
											{/if}
										</div>
									{/if}
								</div>

								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<span class="text-[13px] font-medium truncate" style="color: {isActive ? 'var(--color-primary)' : 'var(--color-text)'};">{getConvoDisplayName(convo)}</span>
										<div class="flex items-center gap-1.5 shrink-0">
											{#if convo.last_message}
												<span class="text-[10px] tabular-nums" style="color: var(--color-text-dim); opacity: 0.5;">
													<RelativeTime date={convo.last_message.created_at} />
												</span>
											{/if}
											{#if convo.unread_count > 0}
												<span class="min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold text-white" style="background: var(--color-primary);">{convo.unread_count}</span>
											{/if}
										</div>
									</div>
									{#if convo.last_message}
										<p class="text-xs truncate mt-0.5" style="color: var(--color-text-dim);">
											{#if convo.last_message.sender_username === userStore.user?.username}
												<span style="opacity: 0.5;">You: </span>
											{/if}
											{convo.last_message.content}
										</p>
									{/if}
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Chat area -->
			<div class="flex flex-col {!mobileShowChat ? 'hidden lg:flex' : ''}" style="background: var(--color-background);">
				{#if !activeConvo}
					<div class="flex-1 flex items-center justify-center">
						<div class="text-center max-w-xs px-4">
							<div class="w-12 h-12 mx-auto mb-4 rounded-2xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-primary) 6%, transparent);">
								<svg class="w-6 h-6" style="color: var(--color-primary); opacity: 0.5;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
							</div>
							<p class="text-sm font-medium" style="color: var(--color-text);">Select a conversation</p>
							<p class="text-xs mt-1 leading-relaxed" style="color: var(--color-text-dim);">
								Choose a chat from the sidebar or start a new conversation.
							</p>
						</div>
					</div>
				{:else}
					<!-- Chat header -->
					<div class="flex items-center gap-3 px-4 py-2.5 border-b" style="border-color: var(--color-border); background: var(--color-surface);">
						<button
							class="lg:hidden shrink-0 p-1 rounded-lg transition-colors"
							style="color: var(--color-text-dim);"
							onclick={() => { mobileShowChat = false; }}
						>
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
						</button>

						<div class="shrink-0">
							{#if activeConvo.type === 'direct'}
								<Avatar username={getConvoAvatar(activeConvo)} size={30} />
							{:else}
								<div class="w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">
									{#if activeConvo.type === 'repo'}
										<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
									{:else}#
									{/if}
								</div>
							{/if}
						</div>
						<div class="flex-1 min-w-0">
							<span class="font-semibold text-[13px] block truncate" style="color: var(--color-text);">{getConvoDisplayName(activeConvo)}</span>
							{#if activeConvo.type === 'direct'}
								<span class="text-[10px]" style="color: var(--color-text-dim);">@{getConvoUsername(activeConvo)}</span>
							{:else}
								<span class="text-[10px]" style="color: var(--color-text-dim);">{activeConvo.participants.length} members</span>
							{/if}
						</div>
						<div class="flex items-center gap-1.5">
							{#if activeConvo.type === 'repo'}
								<a href="/{activeConvo.repo_owner}/{activeConvo.repo_name}" class="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors" style="color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 6%, transparent);">View repo</a>
							{/if}
							{#if activeConvo.type === 'direct'}
								<a href="/{getConvoUsername(activeConvo)}" class="text-[11px] font-medium px-2 py-1 rounded-lg transition-colors" style="color: var(--color-text-dim); background: var(--color-surface);">Profile</a>
							{/if}
						</div>
					</div>

					<!-- Messages -->
					<div bind:this={chatAreaEl} class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-0.5 chat-messages">
						{#if msgLoading}
							<div class="flex-1 flex items-center justify-center">
								<Spinner size="sm" />
							</div>
						{:else if convoMessages.length === 0}
							<div class="flex-1 flex items-center justify-center">
								<div class="text-center">
									<p class="text-sm" style="color: var(--color-text-dim);">No messages yet</p>
									<p class="text-xs mt-1" style="color: var(--color-text-dim); opacity: 0.5;">Send a message to start the conversation</p>
								</div>
							</div>
						{:else}
							{#each convoMessages as msg, i}
								{@const isMine = msg.sender_username === userStore.user?.username}
								{@const prevMsg = convoMessages[i - 1]}
								{@const sameSender = prevMsg?.sender_username === msg.sender_username}
								{@const showAvatar = !sameSender || i === 0}

								{#if showAvatar && i > 0}
									<div class="h-3"></div>
								{/if}

								<div class="flex gap-2 {isMine ? 'flex-row-reverse' : ''}" style="animation: msg-in 0.2s ease both;">
									<div class="w-6 shrink-0">
										{#if showAvatar}
											<Avatar username={msg.sender_username} size={24} />
										{/if}
									</div>
									<div class="max-w-[70%] min-w-0">
										{#if showAvatar}
											<div class="flex items-center gap-2 mb-0.5 {isMine ? 'flex-row-reverse' : ''}">
												<span class="text-[11px] font-medium" style="color: var(--color-text);">{msg.sender_full_name || msg.sender_username}</span>
												<span class="text-[10px]" style="color: var(--color-text-dim); opacity: 0.4;"><RelativeTime date={msg.created_at} /></span>
											</div>
										{/if}
										<div
											class="px-3 py-2 text-[13px] leading-relaxed {isMine ? 'rounded-2xl rounded-tr-lg' : 'rounded-2xl rounded-tl-lg'}"
											style="
												background: {isMine ? 'var(--color-primary)' : 'var(--color-surface)'};
												color: {isMine ? 'white' : 'var(--color-text)'};
												{!isMine ? 'border: 1px solid var(--color-border);' : ''}
											"
										>
											{#if msg.type === 'code'}
												<pre class="text-xs font-mono whitespace-pre-wrap">{msg.content}</pre>
											{:else}
												{msg.content}
											{/if}
										</div>
										{#if msg.id < 0}
											<span class="text-[10px] block mt-0.5 {isMine ? 'text-right' : ''}" style="color: var(--color-text-dim); opacity: 0.4;">Sending...</span>
										{/if}
									</div>
								</div>
							{/each}
						{/if}
					</div>

					<!-- Message input -->
					<div class="border-t p-3" style="border-color: var(--color-border); background: var(--color-surface);">
						<div class="flex items-end gap-2">
							<div class="flex-1 relative">
								<textarea
									bind:this={textareaEl}
									bind:value={newMessage}
									placeholder="Type a message..."
									class="w-full px-3 py-2 text-[13px] rounded-xl border bg-transparent resize-none transition-colors focus:border-[var(--color-primary)]"
									style="border-color: var(--color-border); color: var(--color-text); background: var(--color-background); min-height: 38px; max-height: 120px;"
									rows="1"
									onkeydown={handleKeydown}
									oninput={(e) => {
										const target = e.currentTarget;
										target.style.height = 'auto';
										target.style.height = Math.min(target.scrollHeight, 120) + 'px';
									}}
								></textarea>
							</div>
							<button
								class="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 disabled:opacity-30 active:scale-95"
								style="background: var(--color-primary); color: white;"
								disabled={!newMessage.trim() || sending}
								onclick={sendMessage}
							>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
							</button>
						</div>
						<div class="mt-1 px-1">
							<span class="text-[10px]" style="color: var(--color-text-dim); opacity: 0.35;">Enter to send, Shift+Enter for new line</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</PageShell>

<style>
	.chat-container {
		height: min(680px, calc(100vh - 160px));
	}

	.chat-messages {
		max-height: calc(100% - 1px);
	}

	@keyframes msg-in {
		0% { opacity: 0; transform: translateY(4px); }
		100% { opacity: 1; transform: translateY(0); }
	}
</style>
