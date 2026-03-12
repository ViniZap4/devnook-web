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
	import { marked } from 'marked';

	marked.setOptions({ breaks: true, gfm: true });

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

	// Message actions state
	let editingMessageId = $state<number | null>(null);
	let editContent = $state('');
	let replyToMessage = $state<Message | null>(null);
	let hoveredMessageId = $state<number | null>(null);
	let deletingMessageId = $state<number | null>(null);

	// Audio recording state
	let isRecording = $state(false);
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let recordingTime = $state(0);
	let recordingInterval: ReturnType<typeof setInterval> | null = null;

	// Chat background state
	const chatBgOptions = [
		{ id: 'default', label: 'Default', css: '' },
		{ id: 'deep', label: 'Deep Space', css: 'linear-gradient(160deg, #0a0e1a 0%, #111936 50%, #0a0e1a 100%)' },
		{ id: 'ocean', label: 'Ocean', css: 'linear-gradient(160deg, #061520 0%, #0c2a3d 50%, #061520 100%)' },
		{ id: 'aurora', label: 'Aurora', css: 'linear-gradient(160deg, #0f0a2e 0%, #1a1350 50%, #0f0a2e 100%)' },
		{ id: 'ember', label: 'Ember', css: 'linear-gradient(160deg, #1a0a0a 0%, #2d1515 50%, #1a0a0a 100%)' },
		{ id: 'forest', label: 'Forest', css: 'linear-gradient(160deg, #0a1a0f 0%, #142b1a 50%, #0a1a0f 100%)' },
		{ id: 'mesh', label: 'Mesh', css: 'radial-gradient(at 20% 30%, rgba(6,182,212,0.06) 0%, transparent 50%), radial-gradient(at 80% 70%, rgba(139,92,246,0.05) 0%, transparent 50%), radial-gradient(at 50% 50%, rgba(236,72,153,0.04) 0%, transparent 50%)' },
	];
	let chatBgId = $state(typeof localStorage !== 'undefined' ? (localStorage.getItem('devnook-chat-bg') || 'default') : 'default');
	let showBgPicker = $state(false);
	const chatBgStyle = $derived(chatBgOptions.find(b => b.id === chatBgId)?.css || '');

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
		showProfilePanel = true;
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
		const replyId = replyToMessage?.id;
		sending = true;
		newMessage = '';
		replyToMessage = null;

		const optimistic: Message = {
			id: -Date.now(),
			conversation_id: activeConvo.id,
			sender_id: userStore.user?.id ?? 0,
			sender_username: userStore.user?.username ?? '',
			sender_full_name: userStore.user?.full_name ?? '',
			content,
			type: 'text',
			reply_to_id: replyId,
			reactions: [],
			edited: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		convoMessages = [...convoMessages, optimistic];
		await tick();
		scrollToBottom();

		try {
			const sendData: { content: string; reply_to_id?: number } = { content };
			if (replyId) sendData.reply_to_id = replyId;
			const { id } = await messages.send(activeConvo.id, sendData);
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
			if (editingMessageId) {
				saveEdit();
			} else {
				sendMessage();
			}
		}
		if (e.key === 'Escape') {
			if (editingMessageId) cancelEdit();
			if (replyToMessage) cancelReply();
		}
	}

	async function reactToMessage(msgId: number, emoji: string) {
		if (!activeConvo) return;
		try {
			await messages.react(activeConvo.id, msgId, emoji);
			// Update local state
			convoMessages = convoMessages.map(m => {
				if (m.id !== msgId) return m;
				const reactions = [...m.reactions];
				const existing = reactions.find(r => r.emoji === emoji);
				if (existing) {
					if (existing.reacted) {
						existing.count--;
						existing.reacted = false;
						if (existing.count <= 0) {
							return { ...m, reactions: reactions.filter(r => r.emoji !== emoji) };
						}
					} else {
						existing.count++;
						existing.reacted = true;
					}
					return { ...m, reactions: [...reactions] };
				}
				return { ...m, reactions: [...reactions, { emoji, count: 1, reacted: true }] };
			});
		} catch { /* ignore */ }
	}

	function startEdit(msg: Message) {
		editingMessageId = msg.id;
		editContent = msg.content;
	}

	async function saveEdit() {
		if (!activeConvo || !editingMessageId || !editContent.trim()) return;
		try {
			await messages.edit(activeConvo.id, editingMessageId, { content: editContent.trim() });
			convoMessages = convoMessages.map(m =>
				m.id === editingMessageId ? { ...m, content: editContent.trim(), edited: true } : m
			);
		} catch { /* ignore */ }
		cancelEdit();
	}

	function cancelEdit() {
		editingMessageId = null;
		editContent = '';
	}

	async function deleteMessage(msg: Message) {
		if (!activeConvo) return;
		deletingMessageId = msg.id;
		try {
			await messages.remove(activeConvo.id, msg.id);
			convoMessages = convoMessages.filter(m => m.id !== msg.id);
		} catch { /* ignore */ }
		deletingMessageId = null;
	}

	function startReply(msg: Message) {
		replyToMessage = msg;
		textareaEl?.focus();
	}

	function cancelReply() {
		replyToMessage = null;
	}

	function getReplyToMsg(replyToId: number | undefined): Message | undefined {
		if (!replyToId) return undefined;
		return convoMessages.find(m => m.id === replyToId);
	}

	function formatPreview(content: string): string {
		if (!content) return '';
		return content.length > 40 ? content.slice(0, 40) + '...' : content;
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

	// Markdown rendering
	function renderMd(content: string): string {
		return marked.parse(content, { async: false }) as string;
	}

	// Formatting toolbar
	function insertFormat(prefix: string, suffix: string = prefix) {
		const el = textareaEl as HTMLTextAreaElement;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		const selected = newMessage.substring(start, end);
		const before = newMessage.substring(0, start);
		const after = newMessage.substring(end);
		if (selected) {
			newMessage = before + prefix + selected + suffix + after;
		} else {
			newMessage = before + prefix + suffix + after;
		}
		tick().then(() => {
			const cursorPos = selected ? start + prefix.length + selected.length + suffix.length : start + prefix.length;
			el.selectionStart = el.selectionEnd = selected ? cursorPos : start + prefix.length;
			el.focus();
		});
	}

	// Audio recording
	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = [];
			mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
			mediaRecorder.onstop = () => {
				const blob = new Blob(audioChunks, { type: 'audio/webm' });
				sendAudioMessage(blob);
				stream.getTracks().forEach(t => t.stop());
			};
			mediaRecorder.start();
			isRecording = true;
			recordingTime = 0;
			recordingInterval = setInterval(() => { recordingTime++; }, 1000);
		} catch { /* mic denied */ }
	}

	function stopRecording() {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') mediaRecorder.stop();
		isRecording = false;
		if (recordingInterval) { clearInterval(recordingInterval); recordingInterval = null; }
	}

	function formatRecordingTime(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = secs % 60;
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	async function sendAudioMessage(blob: Blob) {
		if (!activeConvo) return;
		const reader = new FileReader();
		reader.onloadend = async () => {
			const base64 = reader.result as string;
			try {
				await messages.send(activeConvo!.id, { content: base64, type: 'audio' });
				convoMessages = await messages.messages(activeConvo!.id);
				await tick();
				scrollToBottom();
			} catch { /* ignore */ }
		};
		reader.readAsDataURL(blob);
	}

	// Chat background
	function setChatBg(id: string) {
		chatBgId = id;
		try { localStorage.setItem('devnook-chat-bg', id); } catch {}
		showBgPicker = false;
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
						<Avatar username={getConvoAvatar(convo)} size={32} />
						<div class="dm-item-content">
							<div class="dm-item-top">
								<span class="dm-item-name" class:unread={convo.unread_count > 0}>{getConvoDisplayName(convo)}</span>
								{#if convo.last_message}
									<span class="dm-item-time">{formatSidebarTime(convo.last_message.created_at)}</span>
								{/if}
							</div>
							{#if convo.last_message}
								<div class="dm-item-preview" class:unread={convo.unread_count > 0}>
									{#if convo.last_message.sender_username === userStore.user?.username}
										<span class="preview-you">You: </span>
									{/if}
									{formatPreview(convo.last_message.content)}
								</div>
							{/if}
						</div>
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
						<!-- Background picker -->
						<div style="position: relative;">
							<button class="action-btn" title="Chat background" onclick={() => showBgPicker = !showBgPicker}>
								<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
							</button>
							{#if showBgPicker}
								<div class="bg-picker">
									<span class="bg-picker-title">Chat Background</span>
									<div class="bg-picker-grid">
										{#each chatBgOptions as bg}
											<button
												class="bg-picker-item"
												class:bg-picker-active={chatBgId === bg.id}
												style="background: {bg.css || 'var(--glass-bg)'};"
												onclick={() => setChatBg(bg.id)}
												title={bg.label}
											>
												{#if chatBgId === bg.id}
													<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
												{/if}
											</button>
										{/each}
									</div>
								</div>
							{/if}
						</div>
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
				<div bind:this={chatAreaEl} class="messages-area" style="{chatBgStyle ? `background: ${chatBgStyle};` : ''}">
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
							{@const replyTarget = getReplyToMsg(msg.reply_to_id)}
							{@const isEditing = editingMessageId === msg.id}

							{#if shouldShowDateDivider(convoMessages, i)}
								<div class="date-divider">
									<div class="div-line"></div>
									<span class="div-text">{getDateLabel(msg.created_at)}</span>
									<div class="div-line"></div>
								</div>
							{/if}

							<!-- svelte-ignore a11y_no_static_element_interactions -->
							<div
								class="message-wrapper"
								class:message-wrapper-hover={hoveredMessageId === msg.id}
								onmouseenter={() => hoveredMessageId = msg.id}
								onmouseleave={() => hoveredMessageId = null}
							>
								{#if replyTarget}
									<div class="reply-context" class:reply-context-self={isMine}>
										<svg class="reply-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
										<span class="reply-author">{replyTarget.sender_full_name || replyTarget.sender_username}</span>
										<span class="reply-text">{formatPreview(replyTarget.content)}</span>
									</div>
								{/if}
								<div class="message" class:self={isMine} class:grouped={!showHeader && !replyTarget}>
									{#if !isMine}
										<div class="msg-avatar-col">
											{#if showHeader || replyTarget}
												<Avatar username={msg.sender_username} size={36} />
											{/if}
										</div>
									{/if}
									<div class="msg-body">
										{#if showHeader || replyTarget}
											<div class="msg-header" class:msg-header-self={isMine}>
												<span class="msg-name">{msg.sender_full_name || msg.sender_username}</span>
												<span class="msg-time"><RelativeTime date={msg.created_at} /></span>
												{#if msg.edited}
													<span class="msg-edited">(edited)</span>
												{/if}
											</div>
										{/if}
										{#if isEditing}
											<div class="edit-box">
												<textarea
													class="edit-textarea"
													bind:value={editContent}
													onkeydown={handleKeydown}
													rows="1"
												></textarea>
												<div class="edit-actions">
													<button class="edit-cancel" onclick={cancelEdit}>Cancel</button>
													<button class="edit-save" onclick={saveEdit}>Save</button>
												</div>
											</div>
										{:else if msg.type === 'audio'}
											<div class="audio-msg" class:audio-msg-self={isMine}>
												<div class="audio-wave-icon">
													<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
												</div>
												<!-- svelte-ignore a11y_media_has_caption -->
												<audio controls preload="metadata" src={msg.content} class="audio-player"></audio>
											</div>
										{:else if isMine}
											<div class="bubble-self chat-md">{@html renderMd(msg.content)}</div>
										{:else}
											<div class="msg-text chat-md">{@html renderMd(msg.content)}</div>
										{/if}
										{#if msg.id < 0}
											<span class="text-[10px] mt-0.5 block" style="color: var(--color-text-dim); opacity: 0.4; {isMine ? 'text-align: right;' : ''}">Sending...</span>
										{/if}
										<!-- Reactions display -->
										{#if msg.reactions && msg.reactions.length > 0}
											<div class="reactions-display" class:reactions-self={isMine}>
												{#each msg.reactions as reaction}
													<button
														class="reaction-pill"
														class:reaction-active={reaction.reacted}
														onclick={() => reactToMessage(msg.id, reaction.emoji)}
													>
														<span>{reaction.emoji}</span>
														<span class="reaction-count">{reaction.count}</span>
													</button>
												{/each}
											</div>
										{/if}
									</div>
									{#if isMine}
										<div class="msg-avatar-col">
											{#if showHeader || replyTarget}
												<Avatar username={msg.sender_username} size={36} />
											{/if}
										</div>
									{/if}
								</div>
								<!-- Action toolbar (appears on hover) -->
								{#if hoveredMessageId === msg.id && msg.id > 0 && !isEditing}
									<div class="action-toolbar" class:action-toolbar-self={isMine}>
										<button class="toolbar-btn" title="Reply" onclick={() => startReply(msg)}>
											<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
										</button>
										<button class="toolbar-btn" title="Like" onclick={() => reactToMessage(msg.id, '\u{1F44D}')}>
											<span class="text-sm">&#128077;</span>
										</button>
										<button class="toolbar-btn" title="Love" onclick={() => reactToMessage(msg.id, '\u{2764}\u{FE0F}')}>
											<span class="text-sm">&#10084;&#65039;</span>
										</button>
										<button class="toolbar-btn" title="Laugh" onclick={() => reactToMessage(msg.id, '\u{1F604}')}>
											<span class="text-sm">&#128516;</span>
										</button>
										{#if isMine}
											<div class="toolbar-divider"></div>
											<button class="toolbar-btn" title="Edit" onclick={() => startEdit(msg)}>
												<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
											</button>
											<button class="toolbar-btn toolbar-btn-danger" title="Delete" onclick={() => deleteMessage(msg)}>
												<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
											</button>
										{/if}
									</div>
								{/if}
							</div>
						{/each}
					{/if}
				</div>

				<!-- Message Input -->
				<div class="message-input-container">
					{#if replyToMessage}
						<div class="reply-bar">
							<div class="reply-bar-content">
								<svg class="w-4 h-4 shrink-0" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
								<span class="reply-bar-label">Replying to</span>
								<span class="reply-bar-name">{replyToMessage.sender_full_name || replyToMessage.sender_username}</span>
								<span class="reply-bar-text">{formatPreview(replyToMessage.content)}</span>
							</div>
							<button class="reply-bar-close" onclick={cancelReply}>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
							</button>
						</div>
					{/if}
					<div class="message-input-box">
						<!-- Formatting toolbar -->
						<div class="formatting-toolbar">
							<button class="format-btn" title="Bold" onclick={() => insertFormat('**')}>
								<strong>B</strong>
							</button>
							<button class="format-btn" title="Italic" onclick={() => insertFormat('*')}>
								<em>I</em>
							</button>
							<button class="format-btn" title="Strikethrough" onclick={() => insertFormat('~~')}>
								<span style="text-decoration: line-through;">S</span>
							</button>
							<button class="format-btn" title="Inline Code" onclick={() => insertFormat('`')}>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
							</button>
							<button class="format-btn" title="Code Block" onclick={() => insertFormat('\n```\n', '\n```\n')}>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M8 10l3 3-3 3M13 16h3" /></svg>
							</button>
							<button class="format-btn" title="Link" onclick={() => insertFormat('[', '](url)')}>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" /><path stroke-linecap="round" stroke-linejoin="round" d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" /></svg>
							</button>
							<button class="format-btn" title="List" onclick={() => insertFormat('\n- ', '')}>
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>
							</button>
							<button class="format-btn" title="Quote" onclick={() => insertFormat('\n> ', '')}>
								<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>
							</button>
						</div>
						<!-- Input row -->
						<div class="input-row">
							<button class="attach-btn" title="Attach file">
								<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
							</button>
							{#if isRecording}
								<div class="recording-indicator">
									<span class="recording-dot"></span>
									<span class="recording-time">{formatRecordingTime(recordingTime)}</span>
									<span class="recording-label">Recording...</span>
								</div>
								<button class="stop-record-btn" title="Stop & Send" onclick={stopRecording}>
									<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
								</button>
							{:else}
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
								{#if newMessage.trim()}
									<button class="send-btn" disabled={sending} onclick={sendMessage} title="Send">
										<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
									</button>
								{:else}
									<button class="mic-btn" title="Record audio" onclick={startRecording}>
										<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
									</button>
								{/if}
							{/if}
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Details Panel -->
		{#if activeConvo && showProfilePanel}
			<div class="profile-panel">
				{#if activeConvo.type === 'direct'}
					{@const otherUser = activeConvo.participants.find(p => p.username !== userStore.user?.username)}
					{#if otherUser}
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
					{/if}
				{:else}
					<!-- Channel details -->
					<div class="flex flex-col items-center">
						<div class="channel-avatar">
							<span class="text-2xl font-bold" style="color: var(--color-primary);">#</span>
						</div>
						<h3 class="profile-name">{getConvoDisplayName(activeConvo)}</h3>
						{#if getConvoDescription(activeConvo)}
							<span class="profile-handle" style="color: var(--color-text-dim);">{getConvoDescription(activeConvo)}</span>
						{/if}
					</div>

					<div class="profile-section">
						<span class="profile-section-title">TYPE</span>
						<span class="text-[13px] capitalize" style="color: var(--color-text);">{activeConvo.type}</span>
					</div>

					<div class="profile-section">
						<span class="profile-section-title">MEMBERS ({activeConvo.participants.length})</span>
						<div class="members-list">
							{#each activeConvo.participants as member}
								<a href="/{member.username}" class="member-row">
									<Avatar username={member.username} size={28} />
									<div class="member-info">
										<span class="member-name">{member.full_name || member.username}</span>
										<span class="member-role">{member.role}</span>
									</div>
								</a>
							{/each}
						</div>
					</div>

					<div class="flex-1"></div>

					{#if activeConvo.type === 'repo' && activeConvo.repo_owner}
						<div class="profile-actions">
							<a href="/{activeConvo.repo_owner}/{activeConvo.repo_name}" class="profile-action-btn secondary">
								<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
								View Repo
							</a>
						</div>
					{/if}
				{/if}
			</div>
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
		min-height: 52px;
		margin: 2px 8px;
		padding: 8px 10px;
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
		background: rgba(6,182,212,0.12);
	}
	.dm-item-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.dm-item-top {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
	}
	.dm-item-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dm-item-name.unread {
		font-weight: 600;
		color: var(--color-text);
	}
	.dm-item-time {
		font-size: 11px;
		color: var(--color-text-dim);
		flex-shrink: 0;
		margin-left: 8px;
	}
	.dm-item-preview {
		font-size: 12px;
		color: var(--color-text-dim);
		opacity: 0.6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.dm-item-preview.unread {
		opacity: 0.9;
		color: var(--color-text);
	}
	.preview-you {
		color: var(--color-text-dim);
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

	/* === Message wrapper === */
	.message-wrapper {
		position: relative;
		padding: 2px 0;
		border-radius: 8px;
		transition: background 0.1s;
	}
	.message-wrapper-hover {
		background: rgba(255, 255, 255, 0.02);
	}

	/* === Reply context above message === */
	.reply-context {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 4px 0 2px 56px;
		font-size: 12px;
	}
	.reply-context-self {
		padding-left: 0;
		padding-right: 56px;
		justify-content: flex-end;
	}
	.reply-icon {
		width: 14px;
		height: 14px;
		color: var(--color-text-dim);
		opacity: 0.5;
		flex-shrink: 0;
	}
	.reply-author {
		font-weight: 600;
		color: var(--color-primary);
		opacity: 0.7;
	}
	.reply-text {
		color: var(--color-text-dim);
		opacity: 0.5;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* === Action toolbar (hover) === */
	.action-toolbar {
		position: absolute;
		top: -14px;
		right: 12px;
		display: flex;
		align-items: center;
		gap: 1px;
		padding: 2px 4px;
		border-radius: 8px;
		background: rgba(13, 17, 26, 0.97);
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 10;
		animation: toolbarFadeIn 100ms ease-out;
	}
	.action-toolbar-self {
		right: 12px;
	}
	.toolbar-btn {
		width: 30px;
		height: 30px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-dim);
		transition: background 0.1s, color 0.1s;
	}
	.toolbar-btn:hover {
		background: rgba(255, 255, 255, 0.08);
		color: var(--color-text);
	}
	.toolbar-btn-danger:hover {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
	}
	.toolbar-divider {
		width: 1px;
		height: 20px;
		background: rgba(255, 255, 255, 0.08);
		margin: 0 2px;
	}
	@keyframes toolbarFadeIn {
		from { opacity: 0; transform: translateY(4px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* === Reactions display === */
	.reactions-display {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		margin-top: 6px;
	}
	.reactions-self {
		justify-content: flex-end;
	}
	.reaction-active {
		background: rgba(6, 182, 212, 0.12);
		border-color: rgba(6, 182, 212, 0.3);
	}
	.reaction-count {
		font-size: 11px;
		color: var(--color-text-dim);
	}
	.reaction-active .reaction-count {
		color: var(--color-primary);
	}

	/* === Edit mode === */
	.edit-box {
		display: flex;
		flex-direction: column;
		gap: 8px;
		padding: 8px;
		border-radius: 12px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid rgba(6, 182, 212, 0.3);
	}
	.edit-textarea {
		width: 100%;
		background: transparent;
		border: none;
		outline: none;
		font-size: 15px;
		color: var(--color-text);
		resize: none;
		min-height: 24px;
		font-family: inherit;
		line-height: 1.5;
	}
	.edit-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
	}
	.edit-cancel {
		padding: 4px 12px;
		border-radius: 6px;
		font-size: 12px;
		color: var(--color-text-dim);
		transition: background 0.12s;
	}
	.edit-cancel:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.edit-save {
		padding: 4px 14px;
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		color: white;
		background: var(--color-primary);
		transition: background 0.12s;
	}
	.edit-save:hover {
		background: #22d3ee;
	}
	.msg-edited {
		font-size: 11px;
		color: var(--color-text-dim);
		opacity: 0.5;
	}

	/* === Reply bar above input === */
	.reply-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 16px;
		margin-bottom: 8px;
		border-radius: 12px;
		background: rgba(6, 182, 212, 0.06);
		border: 1px solid rgba(6, 182, 212, 0.15);
	}
	.reply-bar-content {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
		flex: 1;
	}
	.reply-bar-label {
		font-size: 12px;
		color: var(--color-text-dim);
		flex-shrink: 0;
	}
	.reply-bar-name {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-primary);
		flex-shrink: 0;
	}
	.reply-bar-text {
		font-size: 12px;
		color: var(--color-text-dim);
		opacity: 0.6;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.reply-bar-close {
		width: 28px;
		height: 28px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-dim);
		flex-shrink: 0;
		transition: background 0.12s;
	}
	.reply-bar-close:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	/* === Channel avatar (details panel) === */
	.channel-avatar {
		width: 80px;
		height: 80px;
		border-radius: 20px;
		background: rgba(6, 182, 212, 0.1);
		border: 1px solid rgba(6, 182, 212, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.members-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.member-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 6px 8px;
		border-radius: 8px;
		text-decoration: none;
		transition: background 0.12s;
	}
	.member-row:hover {
		background: rgba(255, 255, 255, 0.05);
	}
	.member-info {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.member-name {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.member-role {
		font-size: 11px;
		color: var(--color-text-dim);
		text-transform: capitalize;
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

	.bubble-self {
		background: var(--color-primary, #0e7490);
		color: white;
		padding: 10px 16px;
		border-radius: 20px 20px 4px 20px;
		font-size: 15px;
		line-height: 1.5;
		max-width: 480px;
		animation: iMsgSend 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
		word-break: break-word;
	}
	.msg-text {
		font-size: 15px;
		line-height: 1.5;
		color: var(--color-text);
		opacity: 0.9;
		background: rgba(255, 255, 255, 0.04);
		padding: 10px 16px;
		border-radius: 20px 20px 20px 4px;
		max-width: 480px;
		animation: iMsgReceive 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
		word-break: break-word;
	}

	/* iMessage spring animations */
	@keyframes iMsgSend {
		0% { transform: scale(0.3) translateY(20px); opacity: 0; }
		50% { transform: scale(1.05) translateY(-3px); opacity: 1; }
		75% { transform: scale(0.97) translateY(1px); }
		100% { transform: scale(1) translateY(0); }
	}
	@keyframes iMsgReceive {
		0% { transform: translateX(-30px) scale(0.7); opacity: 0; }
		50% { transform: translateX(4px) scale(1.03); opacity: 1; }
		75% { transform: translateX(-2px) scale(0.99); }
		100% { transform: translateX(0) scale(1); }
	}
	@keyframes messageSlideIn {
		from { opacity: 0; transform: translateY(8px); }
		to { opacity: 1; transform: translateY(0); }
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

	/* === Markdown in chat === */
	.chat-md :global(p) { margin: 0; }
	.chat-md :global(p + p) { margin-top: 4px; }
	.chat-md :global(strong) { font-weight: 700; }
	.chat-md :global(em) { font-style: italic; }
	.chat-md :global(del) { text-decoration: line-through; opacity: 0.7; }
	.chat-md :global(code) {
		padding: 2px 6px;
		border-radius: 4px;
		background: rgba(255,255,255,0.1);
		font-family: 'SF Mono', 'Fira Code', monospace;
		font-size: 13px;
	}
	.chat-md :global(pre) {
		margin: 6px 0;
		padding: 12px;
		border-radius: 10px;
		background: rgba(0,0,0,0.35);
		overflow-x: auto;
	}
	.chat-md :global(pre code) {
		padding: 0;
		background: transparent;
		font-size: 13px;
		line-height: 1.6;
	}
	.chat-md :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}
	.chat-md :global(ul), .chat-md :global(ol) {
		margin: 4px 0;
		padding-left: 20px;
	}
	.chat-md :global(li) { margin: 2px 0; }
	.chat-md :global(blockquote) {
		border-left: 3px solid var(--color-primary);
		padding: 4px 12px;
		margin: 6px 0;
		opacity: 0.85;
		border-radius: 0 6px 6px 0;
		background: rgba(255,255,255,0.03);
	}
	.chat-md :global(hr) {
		border: none;
		border-top: 1px solid rgba(255,255,255,0.1);
		margin: 8px 0;
	}
	/* Self bubble overrides */
	.bubble-self.chat-md :global(code) {
		background: rgba(255,255,255,0.18);
	}
	.bubble-self.chat-md :global(pre) {
		background: rgba(0,0,0,0.25);
	}
	.bubble-self.chat-md :global(a) {
		color: white;
	}
	.bubble-self.chat-md :global(blockquote) {
		border-left-color: rgba(255,255,255,0.5);
		background: rgba(255,255,255,0.08);
	}

	/* === Audio message === */
	.audio-msg {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 14px;
		border-radius: 20px 20px 20px 4px;
		background: rgba(255,255,255,0.04);
		max-width: 320px;
		animation: iMsgReceive 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	.audio-msg-self {
		border-radius: 20px 20px 4px 20px;
		background: var(--color-primary, #0e7490);
		animation: iMsgSend 400ms cubic-bezier(0.175, 0.885, 0.32, 1.275);
	}
	.audio-wave-icon {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(255,255,255,0.1);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--color-primary);
	}
	.audio-msg-self .audio-wave-icon {
		color: white;
		background: rgba(255,255,255,0.2);
	}
	.audio-player {
		height: 32px;
		flex: 1;
		min-width: 0;
		border-radius: 8px;
		filter: invert(0.85) hue-rotate(180deg);
	}
	.audio-msg-self .audio-player {
		filter: invert(0.15) hue-rotate(0deg);
	}

	/* === Recording indicator === */
	.recording-indicator {
		flex: 1;
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 0 8px;
	}
	.recording-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #ef4444;
		animation: recPulse 1s ease-in-out infinite;
	}
	@keyframes recPulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.8); }
	}
	.recording-time {
		font-size: 15px;
		font-weight: 600;
		color: var(--color-text);
		font-variant-numeric: tabular-nums;
	}
	.recording-label {
		font-size: 13px;
		color: var(--color-text-dim);
	}
	.stop-record-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: #ef4444;
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s;
	}
	.stop-record-btn:hover {
		background: #dc2626;
	}
	.mic-btn {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: rgba(255,255,255,0.06);
		color: var(--color-text-dim);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: background 0.15s, color 0.15s;
	}
	.mic-btn:hover {
		background: rgba(255,255,255,0.1);
		color: var(--color-text);
	}

	/* === Background picker === */
	.bg-picker {
		position: absolute;
		top: 44px;
		right: 0;
		width: 220px;
		padding: 12px;
		border-radius: 14px;
		background: rgba(13, 17, 26, 0.97);
		border: 1px solid rgba(255,255,255,0.1);
		box-shadow: 0 8px 32px rgba(0,0,0,0.4);
		z-index: 50;
		animation: toolbarFadeIn 150ms ease-out;
	}
	.bg-picker-title {
		display: block;
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-text-dim);
		margin-bottom: 10px;
	}
	.bg-picker-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 6px;
	}
	.bg-picker-item {
		width: 100%;
		aspect-ratio: 1;
		border-radius: 10px;
		border: 2px solid transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: border-color 0.15s, transform 0.15s;
		color: white;
	}
	.bg-picker-item:hover {
		transform: scale(1.08);
	}
	.bg-picker-active {
		border-color: var(--color-primary);
		box-shadow: 0 0 8px rgba(6,182,212,0.3);
	}

	/* === Reaction tapback animation === */
	.reaction-pill {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 2px 8px;
		border-radius: 12px;
		font-size: 13px;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.06);
		transition: background 0.12s, border-color 0.12s, transform 0.15s;
	}
	.reaction-pill:hover {
		background: rgba(255, 255, 255, 0.1);
		transform: scale(1.1);
	}
	.reaction-pill:active {
		transform: scale(0.9);
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
