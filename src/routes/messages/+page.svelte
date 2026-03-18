<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { userStore } from '$lib/stores/user.svelte';
	import { wsStore } from '$lib/stores/websocket.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { messages } from '$lib/services/api';
	import type { Conversation, Message } from '$lib/types/message';
	import PageShell from '$lib/components/PageShell.svelte';

	import ChatSidebar from '$lib/components/chat/ChatSidebar.svelte';
	import ChatHeader from '$lib/components/chat/ChatHeader.svelte';
	import MessageList from '$lib/components/chat/MessageList.svelte';
	import MessageInput from '$lib/components/chat/MessageInput.svelte';
	import TypingIndicator from '$lib/components/chat/TypingIndicator.svelte';
	import ChatDetailsPanel from '$lib/components/chat/ChatDetailsPanel.svelte';
	import ChatEmptyState from '$lib/components/chat/ChatEmptyState.svelte';
	import DeleteConfirmModal from '$lib/components/chat/DeleteConfirmModal.svelte';
	import CreateChannelModal from '$lib/components/chat/CreateChannelModal.svelte';
	import CallModal from '$lib/components/chat/CallModal.svelte';
	import ForwardModal from '$lib/components/chat/ForwardModal.svelte';
	import type { CallInfo } from '$lib/types/message';
	import { clearUnread } from '$lib/stores/chatUnread.svelte';
	import { setDraft } from '$lib/stores/chatDrafts.svelte';

	// --- Core state ---
	let conversations = $state<Conversation[]>([]);
	let activeConvo = $state<Conversation | null>(null);
	let convoMessages = $state<Message[]>([]);
	let loading = $state(true);
	let msgLoading = $state(false);
	let sending = $state(false);
	let mobileShowChat = $state(false);
	let showProfilePanel = $state(false);
	let seenMessageIds = $state(new Set<number>());

	// --- Modals ---
	let showDeleteConfirm = $state<number | null>(null);
	let showCreateChannel = $state(false);

	// --- Edit ---
	let editingMessageId = $state<number | null>(null);
	let editContent = $state('');

	// --- Reply ---
	let replyToMessage = $state<Message | null>(null);

	// --- Forward ---
	let forwardMessage = $state<Message | null>(null);
	let showForwardModal = $state(false);

	// --- Call state ---
	let callInfo = $state<CallInfo | null>(null);
	let localStream = $state<MediaStream | null>(null);
	let remoteStream = $state<MediaStream | null>(null);
	let peerConnection = $state<RTCPeerConnection | null>(null);
	let micEnabled = $state(true);
	let cameraEnabled = $state(true);
	let pendingOffer = $state<string | null>(null);
	let pendingCallerId = $state<number | null>(null);

	// --- Typing ---
	let typingUsers = $state<Map<string, ReturnType<typeof setTimeout>>>(new Map());
	let typingDebounce: ReturnType<typeof setTimeout> | null = null;
	const typingUsernames = $derived([...typingUsers.keys()]);

	// --- Infinite scroll ---
	let loadingOlder = $state(false);
	let hasMoreMessages = $state(true);

	// --- Fetch generation (prevents race in selectConvo) ---
	let selectGeneration = 0;

	// --- WS ---
	let wsUnsubs: (() => void)[] = [];

	// --- Component refs ---
	let messageListRef = $state<MessageList>();
	let messageInputRef = $state<MessageInput>();
	let sidebarRef = $state<ChatSidebar>();

	// --- Derived ---
	const convoLayout = $derived<'flat' | 'bubble'>(activeConvo?.type === 'direct' ? 'bubble' : 'flat');
	const convoDisplayName = $derived(activeConvo ? getConvoDisplayName(activeConvo) : '');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await loadConversations();

		const targetUser = $page.url.searchParams.get('user');
		if (targetUser) {
			const existing = conversations.find(c =>
				c.type === 'direct' && c.participants.some(p => p.username === targetUser)
			);
			if (existing) {
				selectConvo(existing);
			} else {
				sidebarRef?.openNewChat(targetUser);
			}
		}

		// --- WebSocket listeners ---
		wsUnsubs.push(wsStore.on('chat_message', async (data: Message) => {
			const isMyMessage = data.sender_username === userStore.user?.username;

			// Update message list (only for others' messages on the active conversation)
			if (!isMyMessage && activeConvo && data.conversation_id === activeConvo.id) {
				clearTypingUser(data.sender_username);
				if (!seenMessageIds.has(data.id)) {
					convoMessages = [...convoMessages, data];
					seenMessageIds.add(data.id);
					seenMessageIds = new Set(seenMessageIds);
					await tick();
					if (messageListRef?.getIsNearBottom()) messageListRef.scrollToBottom();
				}
			}

			// Update sidebar (ALWAYS — for both own and others' messages)
			const convoIdx = conversations.findIndex(c => c.id === data.conversation_id);
			if (convoIdx >= 0) {
				const updated = { ...conversations[convoIdx] };
				updated.last_message = data;
				updated.updated_at = data.created_at;
				if (!isMyMessage && !(activeConvo && data.conversation_id === activeConvo.id)) {
					updated.unread_count = (updated.unread_count || 0) + 1;
				}
				conversations = [updated, ...conversations.filter(c => c.id !== data.conversation_id)];
			} else if (!isMyMessage) {
				loadConversations();
			}
		}));

		wsUnsubs.push(wsStore.on('chat_message_edit', (data: { id: number; conversation_id: number; content: string; sender_id: number }) => {
			if (activeConvo && data.conversation_id === activeConvo.id) {
				convoMessages = convoMessages.map(m =>
					m.id === data.id ? { ...m, content: data.content, edited: true } : m
				);
			}
			// Update sidebar last_message if this was the latest message
			conversations = conversations.map(c => {
				if (c.id === data.conversation_id && c.last_message?.id === data.id) {
					return { ...c, last_message: { ...c.last_message, content: data.content, edited: true } };
				}
				return c;
			});
		}));

		wsUnsubs.push(wsStore.on('chat_message_delete', (data: { id: number; conversation_id: number }) => {
			if (activeConvo && data.conversation_id === activeConvo.id) {
				convoMessages = convoMessages.filter(m => m.id !== data.id);
			}
			// Update sidebar if the deleted message was the last_message
			conversations = conversations.map(c => {
				if (c.id === data.conversation_id && c.last_message?.id === data.id) {
					// If we have messages loaded for this convo, use the new last one
					if (activeConvo?.id === data.conversation_id && convoMessages.length > 0) {
						return { ...c, last_message: convoMessages[convoMessages.length - 1] };
					}
					// Otherwise clear it — it'll refresh next time conversation is selected
					return { ...c, last_message: undefined };
				}
				return c;
			});
		}));

		wsUnsubs.push(wsStore.on('chat_message_react', (data: { message_id: number; conversation_id: number; user_id: number; username: string; emoji: string; added: boolean }) => {
			if (activeConvo && data.conversation_id === activeConvo.id) {
				// Bug fix: skip WS reaction update if current user (already applied optimistically)
				const isMe = data.user_id === userStore.user?.id;
				if (isMe) return;

				convoMessages = convoMessages.map(m => {
					if (m.id !== data.message_id) return m;
					let reactions = [...m.reactions];
					const existing = reactions.find(r => r.emoji === data.emoji);
					if (data.added) {
						if (existing) {
							reactions = reactions.map(r => r.emoji === data.emoji ? { ...r, count: r.count + 1 } : r);
						} else {
							reactions = [...reactions, { emoji: data.emoji, count: 1, reacted: false }];
						}
					} else {
						if (existing) {
							if (existing.count <= 1) {
								reactions = reactions.filter(r => r.emoji !== data.emoji);
							} else {
								reactions = reactions.map(r => r.emoji === data.emoji ? { ...r, count: r.count - 1 } : r);
							}
						}
					}
					return { ...m, reactions };
				});
			}
		}));

		wsUnsubs.push(wsStore.on('chat_typing', (data: { conversation_id: number; user_id: number; username: string }) => {
			if (activeConvo && data.conversation_id === activeConvo.id && data.username !== userStore.user?.username) {
				clearTypingUser(data.username);
				const timeout = setTimeout(() => {
					typingUsers.delete(data.username);
					typingUsers = new Map(typingUsers);
				}, 3000);
				typingUsers.set(data.username, timeout);
				typingUsers = new Map(typingUsers);
			}
		}));

		wsUnsubs.push(wsStore.on('message_unread', (data: { conversation_id: number; count: number }) => {
			// Only update if we're not currently viewing that conversation
			if (activeConvo && data.conversation_id === activeConvo.id) return;
			conversations = conversations.map(c =>
				c.id === data.conversation_id ? { ...c, unread_count: data.count } : c
			);
		}));

		wsUnsubs.push(wsStore.on('call_initiate', (data: { conversation_id: number; caller_id: number; caller_username: string }) => {
			callInfo = {
				conversationId: data.conversation_id,
				callerId: data.caller_id,
				callerUsername: data.caller_username,
				remoteUserId: data.caller_id,
				remoteUsername: data.caller_username,
				state: 'ringing',
				isAudioOnly: false,
			};
			pendingCallerId = data.caller_id;
		}));

		wsUnsubs.push(wsStore.on('call_offer', (data: { sender_user_id: number; conversation_id: number; sdp: string }) => {
			pendingOffer = data.sdp;
			pendingCallerId = data.sender_user_id;
		}));

		wsUnsubs.push(wsStore.on('call_answer', async (data: { sender_user_id: number; sdp: string }) => {
			if (peerConnection) {
				await peerConnection.setRemoteDescription(JSON.parse(data.sdp));
				callInfo = callInfo ? { ...callInfo, state: 'connected', startTime: Date.now() } : null;
			}
		}));

		wsUnsubs.push(wsStore.on('call_ice_candidate', async (data: { candidate: string }) => {
			if (peerConnection && data.candidate) {
				await peerConnection.addIceCandidate(JSON.parse(data.candidate));
			}
		}));

		wsUnsubs.push(wsStore.on('call_end', () => {
			endCallCleanup();
		}));

		wsUnsubs.push(wsStore.on('call_reject', () => {
			endCallCleanup();
		}));
	});

	onDestroy(() => {
		// Force-save draft before cleanup in case debounce hasn't fired yet
		if (activeConvo) {
			const draft = messageInputRef?.getCurrentDraft?.() || '';
			if (draft.trim()) {
				setDraft(activeConvo.id, draft);
			}
		}
		wsUnsubs.forEach(fn => fn());
		typingUsers.forEach(t => clearTimeout(t));
		if (typingDebounce) clearTimeout(typingDebounce);
		endCallCleanup();
	});

	function clearTypingUser(username: string) {
		const existing = typingUsers.get(username);
		if (existing) {
			clearTimeout(existing);
			typingUsers.delete(username);
			typingUsers = new Map(typingUsers);
		}
	}

	async function loadConversations() {
		loading = true;
		try {
			conversations = await messages.conversations();
		} catch {
			toastStore.error('Failed to load conversations');
			conversations = [];
		} finally {
			loading = false;
		}
	}

	async function selectConvo(convo: Conversation) {
		const gen = ++selectGeneration;
		activeConvo = convo;
		mobileShowChat = true;
		msgLoading = true;
		convoMessages = [];
		seenMessageIds = new Set();
		hasMoreMessages = true;
		typingUsers = new Map();
		editingMessageId = null;
		replyToMessage = null;
		if (typingDebounce) { clearTimeout(typingDebounce); typingDebounce = null; }

		// Clear unread badge on the selected conversation
		conversations = conversations.map(c =>
			c.id === convo.id ? { ...c, unread_count: 0 } : c
		);
		clearUnread(convo.id);
		messages.markRead(convo.id).catch(() => {});

		try {
			const loaded = await messages.messages(convo.id);
			if (gen !== selectGeneration) return; // stale response — discard
			seenMessageIds = new Set(loaded.map(m => m.id));
			convoMessages = loaded;
			hasMoreMessages = loaded.length >= 50;
		} catch {
			if (gen !== selectGeneration) return;
			toastStore.error('Failed to load messages');
			convoMessages = [];
			seenMessageIds = new Set();
		} finally {
			if (gen === selectGeneration) {
				msgLoading = false;
				await tick();
				messageListRef?.scrollToBottom();
				messageInputRef?.focus();
			}
		}
	}

	async function loadOlderMessages() {
		if (!activeConvo || loadingOlder || !hasMoreMessages || convoMessages.length === 0) return;
		loadingOlder = true;
		const oldestId = convoMessages[0].id;
		const scrollEl = messageListRef?.getScrollEl();
		const prevScrollHeight = scrollEl?.scrollHeight || 0;
		try {
			const older = await messages.messages(activeConvo.id, { before: oldestId });
			if (older.length === 0) {
				hasMoreMessages = false;
			} else {
				// Bug fix: dedup using seenMessageIds
				const newMsgs = older.filter(m => !seenMessageIds.has(m.id));
				newMsgs.forEach(m => seenMessageIds.add(m.id));
				seenMessageIds = new Set(seenMessageIds);
				convoMessages = [...newMsgs, ...convoMessages];
				hasMoreMessages = older.length >= 50;
				await tick();
				if (scrollEl) {
					scrollEl.scrollTop = scrollEl.scrollHeight - prevScrollHeight;
				}
			}
		} catch {
			hasMoreMessages = false;
		} finally {
			loadingOlder = false;
		}
	}

	async function handleSendMessage(data: { content: string; type: string; replyToId?: number }) {
		if (!activeConvo || sending) return;
		sending = true;

		if (data.type === 'audio' || data.type === 'image' || data.type === 'video') {
			try {
				const { id } = await messages.send(activeConvo.id, { content: data.content, type: data.type });
				const fresh = await messages.messages(activeConvo.id);
				fresh.forEach(m => seenMessageIds.add(m.id));
				seenMessageIds = new Set(seenMessageIds);
				convoMessages = fresh;
				await tick();
				messageListRef?.scrollToBottom();
			} catch {
				toastStore.error('Failed to send attachment');
			} finally {
				sending = false;
			}
			return;
		}

		replyToMessage = null;
		const optimisticId = -Date.now();
		const optimistic: Message = {
			id: optimisticId,
			conversation_id: activeConvo.id,
			sender_id: userStore.user?.id ?? 0,
			sender_username: userStore.user?.username ?? '',
			sender_full_name: userStore.user?.full_name ?? '',
			content: data.content,
			type: 'text',
			reply_to_id: data.replyToId,
			reactions: [],
			edited: false,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};
		convoMessages = [...convoMessages, optimistic];
		await tick();
		messageListRef?.scrollToBottom();

		try {
			const sendData: { content: string; reply_to_id?: number } = { content: data.content };
			if (data.replyToId) sendData.reply_to_id = data.replyToId;
			const { id } = await messages.send(activeConvo.id, sendData);
			seenMessageIds.add(id);
			seenMessageIds = new Set(seenMessageIds);
			convoMessages = convoMessages.map(m => m.id === optimisticId ? { ...m, id } : m);
		} catch {
			convoMessages = convoMessages.filter(m => m.id !== optimisticId);
			toastStore.error('Failed to send message');
		} finally {
			sending = false;
		}
	}

	async function reactToMessage(msgId: number, emoji: string) {
		if (!activeConvo) return;
		const prevMessages = convoMessages;
		// Optimistic local update
		convoMessages = convoMessages.map(m => {
			if (m.id !== msgId) return m;
			const reactions = [...m.reactions];
			const existing = reactions.find(r => r.emoji === emoji);
			if (existing) {
				if (existing.reacted) {
					if (existing.count <= 1) {
						return { ...m, reactions: reactions.filter(r => r.emoji !== emoji) };
					}
					return { ...m, reactions: reactions.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reacted: false } : r) };
				} else {
					return { ...m, reactions: reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reacted: true } : r) };
				}
			}
			return { ...m, reactions: [...reactions, { emoji, count: 1, reacted: true }] };
		});
		try {
			await messages.react(activeConvo.id, msgId, emoji);
		} catch {
			convoMessages = prevMessages;
			toastStore.error('Failed to react');
		}
	}

	function startEdit(msg: Message) {
		editingMessageId = msg.id;
		editContent = msg.content;
	}

	async function saveEdit() {
		if (!activeConvo || !editingMessageId || !editContent.trim()) return;
		const editId = editingMessageId;
		const trimmed = editContent.trim();
		try {
			await messages.edit(activeConvo.id, editId, { content: trimmed });
			convoMessages = convoMessages.map(m =>
				m.id === editId ? { ...m, content: trimmed, edited: true } : m
			);
			// Update sidebar last_message if edited message was the latest
			conversations = conversations.map(c => {
				if (c.id === activeConvo!.id && c.last_message?.id === editId) {
					return { ...c, last_message: { ...c.last_message, content: trimmed, edited: true } };
				}
				return c;
			});
		} catch {
			toastStore.error('Failed to edit message');
		}
		cancelEdit();
	}

	function cancelEdit() {
		editingMessageId = null;
		editContent = '';
	}

	async function confirmDelete() {
		if (!activeConvo || !showDeleteConfirm) return;
		const msgId = showDeleteConfirm;
		const convoId = activeConvo.id;
		showDeleteConfirm = null;
		// Mark as deleting for animation
		messageListRef?.markDeleting(msgId);
		// Wait for animation
		await new Promise(r => setTimeout(r, 300));
		try {
			await messages.remove(convoId, msgId);
			convoMessages = convoMessages.filter(m => m.id !== msgId);
		} catch {
			// Undo deleting state so message reappears
			messageListRef?.unmarkDeleting(msgId);
			toastStore.error('Failed to delete message');
		}
	}

	function handleEditKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			saveEdit();
		}
		if (e.key === 'Escape') cancelEdit();
	}

	function emitTyping() {
		if (!activeConvo) return;
		if (typingDebounce) return;
		messages.typing(activeConvo.id).catch(() => {});
		typingDebounce = setTimeout(() => { typingDebounce = null; }, 2000);
	}

	function handleReplyTargetClick(msgId: number) {
		messageListRef?.scrollToMessage(msgId);
	}

	// --- Call functions ---
	async function acquireMedia(): Promise<{ stream: MediaStream; audioOnly: boolean } | null> {
		if (!navigator.mediaDevices?.getUserMedia) {
			toastStore.error('Media devices not available (HTTPS required)');
			return null;
		}
		// Try video + audio first
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
			return { stream, audioOnly: false };
		} catch {
			// Fallback to audio-only
			try {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				return { stream, audioOnly: true };
			} catch {
				toastStore.error('Microphone access denied');
				return null;
			}
		}
	}

	function setupPeerConnection(stream: MediaStream, targetUserId: number, convoId: number): RTCPeerConnection {
		const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
		stream.getTracks().forEach(track => pc.addTrack(track, stream));
		pc.ontrack = (event) => { remoteStream = event.streams[0]; };
		pc.onicecandidate = (event) => {
			if (event.candidate) {
				wsStore.send('call_ice_candidate', {
					target_user_id: targetUserId,
					conversation_id: convoId,
					candidate: JSON.stringify(event.candidate),
				});
			}
		};
		return pc;
	}

	async function startCall() {
		if (!activeConvo) return;
		if (!wsStore.connected) { toastStore.error('Connection lost — cannot start call'); return; }
		const other = activeConvo.participants.find(p => p.username !== userStore.user?.username);
		if (!other) { toastStore.error('No other participant found'); return; }

		// 1. Show calling UI immediately — display the remote user's info
		callInfo = {
			conversationId: activeConvo.id,
			callerId: userStore.user?.id ?? 0,
			callerUsername: userStore.user?.username ?? '',
			remoteUserId: other.user_id,
			remoteUsername: other.full_name || other.username,
			state: 'calling',
			isAudioOnly: false,
		};

		try {
			// 2. Acquire media (with audio-only fallback)
			const media = await acquireMedia();
			if (!media) { callInfo = null; return; }
			localStream = media.stream;
			if (media.audioOnly) callInfo = callInfo ? { ...callInfo, isAudioOnly: true } : null;

			// 3. Notify server
			await messages.initiateCall(activeConvo.id);

			// 4. Set up WebRTC and create offer
			const pc = setupPeerConnection(media.stream, other.user_id, activeConvo.id);
			peerConnection = pc;
			const offer = await pc.createOffer();
			await pc.setLocalDescription(offer);

			// 5. Send offer to callee
			wsStore.send('call_offer', {
				target_user_id: other.user_id,
				conversation_id: activeConvo.id,
				sdp: JSON.stringify(offer),
			});
		} catch {
			toastStore.error('Failed to start call');
			endCallCleanup();
		}
	}

	async function acceptCall() {
		if (!callInfo || !pendingCallerId) return;
		if (!wsStore.connected) { toastStore.error('Connection lost — cannot accept call'); return; }
		if (!pendingOffer) { toastStore.error('Waiting for call data, try again...'); return; }
		const convoId = callInfo.conversationId;

		// 1. Show connecting UI
		callInfo = { ...callInfo, state: 'connecting' };

		try {
			// 2. Acquire media (with audio-only fallback)
			const media = await acquireMedia();
			if (!media) { rejectCall(); return; }
			localStream = media.stream;
			if (media.audioOnly) callInfo = callInfo ? { ...callInfo, isAudioOnly: true } : null;

			// 3. Set up WebRTC, process offer, create answer
			const pc = setupPeerConnection(media.stream, pendingCallerId, convoId);
			peerConnection = pc;
			await pc.setRemoteDescription(JSON.parse(pendingOffer));
			const answer = await pc.createAnswer();
			await pc.setLocalDescription(answer);

			// 4. Send answer to caller
			wsStore.send('call_answer', {
				target_user_id: pendingCallerId,
				conversation_id: convoId,
				sdp: JSON.stringify(answer),
			});

			callInfo = callInfo ? { ...callInfo, state: 'connected', startTime: Date.now() } : null;
			pendingOffer = null;
		} catch {
			toastStore.error('Failed to accept call');
			endCallCleanup();
		}
	}

	function endCall() {
		if (callInfo) {
			wsStore.send('call_end', {
				target_user_id: callInfo.remoteUserId,
				conversation_id: callInfo.conversationId,
			});
		}
		endCallCleanup();
	}

	function rejectCall() {
		if (callInfo && pendingCallerId) {
			wsStore.send('call_reject', {
				target_user_id: pendingCallerId,
				conversation_id: callInfo.conversationId,
			});
		}
		endCallCleanup();
	}

	function endCallCleanup() {
		if (peerConnection) {
			peerConnection.close();
			peerConnection = null;
		}
		if (localStream) {
			localStream.getTracks().forEach(t => t.stop());
			localStream = null;
		}
		remoteStream = null;
		callInfo = null;
		pendingOffer = null;
		pendingCallerId = null;
		micEnabled = true;
		cameraEnabled = true;
	}

	function toggleMic() {
		if (localStream) {
			localStream.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
			micEnabled = !micEnabled;
		}
	}

	function toggleCamera() {
		if (localStream) {
			localStream.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
			cameraEnabled = !cameraEnabled;
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

	async function handleCreateChannel(data: { name: string; type: 'group' | 'repo' | 'org'; participants: string[] }) {
		try {
			const result = await messages.createConversation({
				type: data.type,
				name: data.name,
				participants: data.participants
			});
			showCreateChannel = false;
			await loadConversations();
			const convo = conversations.find(c => c.id === result.id);
			if (convo) selectConvo(convo);
		} catch {
			toastStore.error('Failed to create channel');
		}
	}

	async function handleNewChat(created?: { id: number }) {
		await loadConversations();
		if (created) {
			const convo = conversations.find(c => c.id === created.id);
			if (convo) selectConvo(convo);
		}
	}

	function openNewChat() {
		sidebarRef?.openNewChat();
	}

	function handleForwardMessage(msg: Message) {
		forwardMessage = msg;
		showForwardModal = true;
	}

	async function executeForward(targetConvoId: number) {
		if (!forwardMessage) return;
		showForwardModal = false;
		try {
			await messages.send(targetConvoId, {
				content: forwardMessage.content,
				type: forwardMessage.type
			});
			toastStore.success('Message forwarded');
		} catch {
			toastStore.error('Failed to forward message');
		}
		forwardMessage = null;
	}

	async function handleDeleteConvo(convoId: number) {
		try {
			await messages.deleteConversation(convoId);
			conversations = conversations.filter(c => c.id !== convoId);
			if (activeConvo?.id === convoId) {
				activeConvo = null;
				convoMessages = [];
				mobileShowChat = false;
			}
			toastStore.success('Conversation deleted');
		} catch {
			toastStore.error('Failed to delete conversation');
		}
	}

	async function handleSearchResultClick(msgId: number) {
		if (!activeConvo) return;
		// Check if message is already loaded
		const alreadyLoaded = convoMessages.some(m => m.id === msgId);
		if (alreadyLoaded) {
			messageListRef?.scrollToMessage(msgId);
		} else {
			// Load a batch of messages around the target by using `before` with an ID after it
			msgLoading = true;
			try {
				// Load messages before this one (older) + the message itself
				const batch = await messages.messages(activeConvo.id, { before: msgId + 1, limit: 50 });
				if (batch.length > 0) {
					batch.forEach(m => seenMessageIds.add(m.id));
					seenMessageIds = new Set(seenMessageIds);
					convoMessages = batch;
					hasMoreMessages = batch.length >= 50;
					await tick();
					messageListRef?.scrollToMessage(msgId);
				} else {
					// Fallback: load latest messages
					const loaded = await messages.messages(activeConvo.id);
					loaded.forEach(m => seenMessageIds.add(m.id));
					seenMessageIds = new Set(seenMessageIds);
					convoMessages = loaded;
					hasMoreMessages = loaded.length >= 50;
					await tick();
					messageListRef?.scrollToMessage(msgId);
				}
			} catch {
				toastStore.error('Failed to load messages');
			} finally {
				msgLoading = false;
			}
		}
	}

	async function handleAddMember(convoId: number, username: string) {
		try {
			await messages.addParticipant(convoId, username);
			await loadConversations();
			// Refresh activeConvo with updated participant list
			if (activeConvo?.id === convoId) {
				const updated = conversations.find(c => c.id === convoId);
				if (updated) activeConvo = updated;
			}
			toastStore.success(`${username} added to conversation`);
		} catch {
			toastStore.error('Failed to add member');
		}
	}

	async function handleRemoveMember(convoId: number, username: string) {
		try {
			await messages.removeParticipant(convoId, username);
			await loadConversations();
			// Refresh activeConvo with updated participant list
			if (activeConvo?.id === convoId) {
				const updated = conversations.find(c => c.id === convoId);
				if (updated) activeConvo = updated;
			}
			toastStore.success(`${username} removed from conversation`);
		} catch {
			toastStore.error('Failed to remove member');
		}
	}

	function handlePageKeydown(e: KeyboardEvent) {
		// Arrow Up to edit last own message
		if (e.key === 'ArrowUp' && !editingMessageId && activeConvo) {
			const target = e.target as HTMLElement;
			const isInput = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT';
			if (isInput && target.closest('.chat-input')) {
				const textarea = target as HTMLTextAreaElement;
				if (textarea.value === '' || textarea.selectionStart === 0) {
					const myMsgs = convoMessages.filter(m => m.sender_username === userStore.user?.username && m.id > 0);
					if (myMsgs.length > 0) {
						e.preventDefault();
						startEdit(myMsgs[myMsgs.length - 1]);
					}
				}
			}
		}
	}
</script>

<svelte:window onkeydown={handlePageKeydown} />

<PageShell width="full">
	<div class="chat-wrapper">
		<ChatSidebar
			bind:this={sidebarRef}
			{conversations}
			activeConvoId={activeConvo?.id ?? null}
			{loading}
			mobileHidden={mobileShowChat}
			onselect={selectConvo}
			onnewchat={handleNewChat}
			oncreatechannel={() => { showCreateChannel = true; }}
			ondeleteconvo={handleDeleteConvo}
		/>

		<main class="chat-main {!mobileShowChat ? 'hidden lg:flex' : ''}" aria-label="Chat">
			{#if !activeConvo}
				<ChatEmptyState type="no-conversation" onNewChat={openNewChat} />
			{:else}
				<ChatHeader
					convo={activeConvo}
					showDetails={showProfilePanel}
					onback={() => { mobileShowChat = false; }}
					ontoggledetails={() => { showProfilePanel = !showProfilePanel; }}
					oncall={startCall}
					onsearchresult={handleSearchResultClick}
				/>

				<MessageList
					bind:this={messageListRef}
					messages={convoMessages}
					loading={msgLoading}
					{loadingOlder}
					{hasMoreMessages}
					{seenMessageIds}
					{editingMessageId}
					{editContent}
					layout={convoLayout}
					onscrolltop={loadOlderMessages}
					onreact={reactToMessage}
					onreply={(msg) => { replyToMessage = msg; messageInputRef?.focus(); }}
					onedit={startEdit}
					ondelete={(id) => { showDeleteConfirm = id; }}
					onsaveedit={saveEdit}
					oncanceledit={cancelEdit}
					oneditkeydown={handleEditKeydown}
					oneditcontentchange={(v) => { editContent = v; }}
					onreplytargetclick={handleReplyTargetClick}
					onforward={handleForwardMessage}
				/>

				<TypingIndicator usernames={typingUsernames} />

				<MessageInput
					bind:this={messageInputRef}
					{convoDisplayName}
					isDirect={activeConvo.type === 'direct'}
					{sending}
					{replyToMessage}
					conversationId={activeConvo.id}
					participants={activeConvo.participants}
					onsend={handleSendMessage}
					oncancelreply={() => { replyToMessage = null; }}
					onemittyping={emitTyping}
				/>
			{/if}
		</main>

		{#if activeConvo && showProfilePanel}
			<ChatDetailsPanel
				convo={activeConvo}
				onadmember={handleAddMember}
				onremovemember={handleRemoveMember}
			/>
		{/if}
	</div>

	<DeleteConfirmModal
		open={showDeleteConfirm !== null}
		onconfirm={confirmDelete}
		onclose={() => { showDeleteConfirm = null; }}
	/>

	<CreateChannelModal
		open={showCreateChannel}
		onclose={() => { showCreateChannel = false; }}
		oncreate={handleCreateChannel}
	/>

	<ForwardModal
		open={showForwardModal}
		message={forwardMessage}
		{conversations}
		currentConvoId={activeConvo?.id}
		onforward={executeForward}
		onclose={() => { showForwardModal = false; forwardMessage = null; }}
	/>

	{#if callInfo}
		<CallModal
			{callInfo}
			{localStream}
			{remoteStream}
			{micEnabled}
			{cameraEnabled}
			onaccept={acceptCall}
			onreject={rejectCall}
			onend={endCall}
			ontogglemic={toggleMic}
			ontogglecamera={toggleCamera}
		/>
	{/if}
</PageShell>

<style>
	.chat-wrapper {
		display: flex;
		height: calc(100dvh - 100px);
		gap: 8px;
		position: relative;
		min-width: 0;
	}
	.chat-main {
		flex: 1; display: flex; flex-direction: column; min-width: 0;
		background: var(--glass-bg);
		backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border);
		border-radius: 16px;
		box-shadow: 0 4px 24px color-mix(in srgb, var(--color-overlay, #000) 20%, transparent);
		position: relative;
		animation: chat-panel-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both;
	}
	@media (max-width: 1023px) {
		.chat-wrapper { height: calc(100dvh - 80px); gap: 0; }
		.chat-main { border-radius: 16px; }
	}
	@keyframes chat-panel-in {
		from { opacity: 0; transform: translateY(20px) scale(0.97); filter: blur(4px); }
		to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.chat-main { animation: none !important; }
	}
</style>
