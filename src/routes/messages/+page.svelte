<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { messages } from '$lib/services/api';
	import type { Conversation, Message } from '$lib/types/message';
	import PageShell from '$lib/components/PageShell.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let conversations = $state<Conversation[]>([]);
	let activeConvo = $state<Conversation | null>(null);
	let convoMessages = $state<Message[]>([]);
	let loading = $state(true);
	let msgLoading = $state(false);
	let newMessage = $state('');
	let sending = $state(false);
	let showNewChat = $state(false);
	let newChatUsername = $state('');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await loadConversations();
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
		msgLoading = true;
		try {
			convoMessages = await messages.messages(convo.id);
		} catch {
			convoMessages = [];
		} finally {
			msgLoading = false;
		}
	}

	async function sendMessage() {
		if (!newMessage.trim() || !activeConvo || sending) return;
		sending = true;
		try {
			await messages.send(activeConvo.id, { content: newMessage });
			newMessage = '';
			convoMessages = await messages.messages(activeConvo.id);
		} catch {
			// ignore
		} finally {
			sending = false;
		}
	}

	async function startNewChat() {
		if (!newChatUsername.trim()) return;
		try {
			const result = await messages.createConversation({
				type: 'direct',
				participants: [newChatUsername]
			});
			showNewChat = false;
			newChatUsername = '';
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
</script>

<PageShell maxWidth="max-w-7xl">
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between page-header">
			<h1 class="text-xl font-bold" style="color: var(--color-text);">Messages</h1>
			<button
				class="btn-glow flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white"
				style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
				onclick={() => { showNewChat = !showNewChat; }}
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Chat
			</button>
		</div>

		{#if showNewChat}
			<div class="card p-4 flex items-center gap-3 animate-fade-up-sm">
				<input
					type="text"
					bind:value={newChatUsername}
					placeholder="Username to message..."
					class="flex-1 px-3 py-2 text-sm rounded-lg border bg-transparent"
					style="border-color: var(--color-border); color: var(--color-text);"
					onkeydown={(e) => { if (e.key === 'Enter') startNewChat(); }}
				/>
				<button
					class="px-4 py-2 text-sm font-medium rounded-lg"
					style="background: var(--color-primary); color: white;"
					onclick={startNewChat}
				>Start</button>
			</div>
		{/if}

		<div class="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-0 card overflow-hidden" style="min-height: 600px;">
			<!-- Conversations sidebar -->
			<div class="border-r flex flex-col" style="border-color: var(--color-border);">
				<div class="p-3 border-b" style="border-color: var(--color-border);">
					<input
						type="text"
						placeholder="Search conversations..."
						class="w-full px-3 py-2 text-xs rounded-lg border bg-transparent"
						style="border-color: var(--color-border); color: var(--color-text);"
					/>
				</div>
				<div class="flex-1 overflow-y-auto">
					{#if loading}
						<div class="p-8 text-center text-sm" style="color: var(--color-text-dim);">Loading...</div>
					{:else if conversations.length === 0}
						<div class="p-8 text-center">
							<svg class="w-10 h-10 mx-auto mb-3 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
							<p class="text-xs" style="color: var(--color-text-dim);">No conversations yet</p>
						</div>
					{:else}
						{#each conversations as convo}
							<button
								class="w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200"
								style="
									background: {activeConvo?.id === convo.id ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent'};
									border-left: 2px solid {activeConvo?.id === convo.id ? 'var(--color-primary)' : 'transparent'};
								"
								onclick={() => selectConvo(convo)}
								onmouseenter={(e) => { if (activeConvo?.id !== convo.id) e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
								onmouseleave={(e) => { if (activeConvo?.id !== convo.id) e.currentTarget.style.background = 'transparent'; }}
							>
								<div class="shrink-0">
									{#if convo.type === 'direct'}
										<Avatar username={getConvoAvatar(convo)} size={36} />
									{:else}
										<div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold" style="background: var(--color-primary)15; color: var(--color-primary);">
											{#if convo.type === 'repo'}
												<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
											{:else}
												#
											{/if}
										</div>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<div class="flex items-center justify-between gap-2">
										<span class="text-sm font-medium truncate" style="color: var(--color-text);">{getConvoDisplayName(convo)}</span>
										{#if convo.unread_count > 0}
											<span class="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[0.625rem] font-bold text-white" style="background: var(--color-primary);">{convo.unread_count}</span>
										{/if}
									</div>
									{#if convo.last_message}
										<p class="text-xs truncate mt-0.5" style="color: var(--color-text-dim);">{convo.last_message.content}</p>
									{/if}
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</div>

			<!-- Chat area -->
			<div class="flex flex-col">
				{#if !activeConvo}
					<div class="flex-1 flex items-center justify-center">
						<div class="text-center">
							<svg class="w-16 h-16 mx-auto mb-4 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
							<p class="text-sm" style="color: var(--color-text-dim);">Select a conversation to start chatting</p>
							<p class="text-xs mt-1" style="color: var(--color-text-dim); opacity: 0.6;">Your messages are linked to repos, orgs, and issues</p>
						</div>
					</div>
				{:else}
					<!-- Chat header -->
					<div class="flex items-center gap-3 px-4 py-3 border-b" style="border-color: var(--color-border);">
						<span class="font-semibold text-sm" style="color: var(--color-text);">{getConvoDisplayName(activeConvo)}</span>
						{#if activeConvo.type === 'repo'}
							<a href="/{activeConvo.repo_owner}/{activeConvo.repo_name}" class="text-xs hover:underline" style="color: var(--color-primary);">View repo</a>
						{/if}
						<span class="text-xs ml-auto" style="color: var(--color-text-dim);">{activeConvo.participants.length} members</span>
					</div>

					<!-- Messages -->
					<div class="flex-1 overflow-y-auto p-4 flex flex-col gap-3" style="max-height: 480px;">
						{#if msgLoading}
							<div class="text-center py-8 text-sm" style="color: var(--color-text-dim);">Loading messages...</div>
						{:else if convoMessages.length === 0}
							<div class="text-center py-8">
								<p class="text-sm" style="color: var(--color-text-dim);">No messages yet. Say something!</p>
							</div>
						{:else}
							{#each convoMessages as msg}
								{@const isMine = msg.sender_username === userStore.user?.username}
								<div class="flex gap-2.5 {isMine ? 'flex-row-reverse' : ''}">
									<Avatar username={msg.sender_username} size={28} />
									<div class="max-w-[70%]">
										<div class="flex items-center gap-2 mb-0.5 {isMine ? 'flex-row-reverse' : ''}">
											<span class="text-[0.6875rem] font-medium" style="color: var(--color-text);">{msg.sender_full_name || msg.sender_username}</span>
											<span class="text-[0.625rem]" style="color: var(--color-text-dim); opacity: 0.5;"><RelativeTime date={msg.created_at} /></span>
										</div>
										<div
											class="px-3 py-2 rounded-2xl text-sm {isMine ? 'rounded-tr-sm' : 'rounded-tl-sm'}"
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
									</div>
								</div>
							{/each}
						{/if}
					</div>

					<!-- Message input -->
					<div class="border-t p-3" style="border-color: var(--color-border);">
						<div class="flex items-end gap-2">
							<textarea
								bind:value={newMessage}
								placeholder="Type a message... (Enter to send)"
								class="flex-1 px-3 py-2 text-sm rounded-xl border bg-transparent resize-none"
								style="border-color: var(--color-border); color: var(--color-text); min-height: 38px; max-height: 120px;"
								rows="1"
								onkeydown={handleKeydown}
							></textarea>
							<button
								class="shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-40"
								style="background: var(--color-primary); color: white;"
								disabled={!newMessage.trim() || sending}
								onclick={sendMessage}
							>
								{sending ? '...' : 'Send'}
							</button>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
</PageShell>
