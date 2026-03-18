<script lang="ts">
	import { onDestroy } from 'svelte';
	import type { Message, ConversationParticipant } from '$lib/types/message';
	import { getDraft, setDraft, clearDraft } from '$lib/stores/chatDrafts.svelte';
	import MentionDropdown from './MentionDropdown.svelte';
	import EmojiPicker from './EmojiPicker.svelte';
	import GifPicker from './GifPicker.svelte';

	let {
		convoDisplayName = '',
		isDirect = false,
		sending = false,
		replyToMessage = null,
		conversationId = 0,
		participants = [],
		onsend,
		oncancelreply,
		onemittyping
	}: {
		convoDisplayName: string;
		isDirect: boolean;
		sending: boolean;
		replyToMessage: Message | null;
		conversationId: number;
		participants: ConversationParticipant[];
		onsend: (data: { content: string; type: string; replyToId?: number }) => void;
		oncancelreply: () => void;
		onemittyping: () => void;
	} = $props();

	let newMessage = $state('');
	let textareaEl = $state<HTMLTextAreaElement>();
	let fileInputEl = $state<HTMLInputElement>();

	// Audio recording
	let isRecording = $state(false);
	let mediaRecorder: MediaRecorder | null = null;
	let audioChunks: Blob[] = [];
	let recordingTime = $state(0);
	let recordingInterval: ReturnType<typeof setInterval> | null = null;

	// Attachment preview
	let attachPreview = $state<{ dataUrl: string; type: 'image' | 'video'; name: string } | null>(null);

	// @mention autocomplete
	let mentionQuery = $state('');
	let mentionActive = $state(false);
	let mentionIndex = $state(0);
	let mentionStartPos = $state(0);

	// Emoji & GIF pickers
	let showEmojiPicker = $state(false);
	let showGifPicker = $state(false);

	// Draft save/restore
	let draftSaveTimer: ReturnType<typeof setTimeout> | null = null;
	let prevConvoId = 0;

	// Restore draft on conversationId change
	$effect(() => {
		if (conversationId > 0 && conversationId !== prevConvoId) {
			// Save draft for previous convo before switching
			if (prevConvoId > 0 && newMessage.trim()) {
				setDraft(prevConvoId, newMessage);
			}
			prevConvoId = conversationId;
			// Restore draft for new convo
			const draft = getDraft(conversationId);
			newMessage = draft || '';
			if (textareaEl) textareaEl.style.height = 'auto';
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		// Mention navigation
		if (mentionActive) {
			if (e.key === 'ArrowDown') { e.preventDefault(); mentionIndex = Math.min(mentionIndex + 1, 4); return; }
			if (e.key === 'ArrowUp') { e.preventDefault(); mentionIndex = Math.max(mentionIndex - 1, 0); return; }
			if (e.key === 'Tab' || e.key === 'Enter') {
				e.preventDefault();
				// Let the dropdown handle the selection via filtering
				const filtered = participants.filter(p => {
					const q = mentionQuery.toLowerCase();
					return p.username.toLowerCase().includes(q) || (p.full_name && p.full_name.toLowerCase().includes(q));
				}).slice(0, 5);
				if (filtered[mentionIndex]) selectMention(filtered[mentionIndex].username);
				return;
			}
			if (e.key === 'Escape') { e.preventDefault(); mentionActive = false; return; }
		}
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
		if (e.key === 'Escape') {
			if (showEmojiPicker) { showEmojiPicker = false; return; }
			if (showGifPicker) { showGifPicker = false; return; }
			if (replyToMessage) oncancelreply();
		}
	}

	function detectMention() {
		if (!textareaEl) return;
		const pos = textareaEl.selectionStart;
		const text = newMessage.slice(0, pos);
		const match = text.match(/@(\w*)$/);
		if (match) {
			mentionActive = true;
			mentionQuery = match[1];
			mentionStartPos = pos - match[0].length;
			mentionIndex = 0;
		} else {
			mentionActive = false;
		}
	}

	function selectMention(username: string) {
		const before = newMessage.slice(0, mentionStartPos);
		const after = newMessage.slice(textareaEl?.selectionStart ?? mentionStartPos);
		newMessage = before + '@' + username + ' ' + after;
		mentionActive = false;
		requestAnimationFrame(() => {
			if (textareaEl) {
				const newPos = mentionStartPos + username.length + 2;
				textareaEl.selectionStart = newPos;
				textareaEl.selectionEnd = newPos;
				textareaEl.focus();
			}
		});
	}

	function saveDraftDebounced() {
		if (draftSaveTimer) clearTimeout(draftSaveTimer);
		draftSaveTimer = setTimeout(() => {
			if (conversationId > 0) setDraft(conversationId, newMessage);
		}, 500);
	}

	function sendMessage() {
		if (attachPreview && !sending) {
			const { dataUrl, type } = attachPreview;
			attachPreview = null;
			onsend({ content: dataUrl, type });
			requestAnimationFrame(() => textareaEl?.focus());
			return;
		}
		if (!newMessage.trim() || sending) return;
		const content = newMessage;
		const replyId = replyToMessage?.id;
		newMessage = '';
		if (conversationId > 0) clearDraft(conversationId);
		if (textareaEl) textareaEl.style.height = 'auto';
		onsend({ content, type: 'text', replyToId: replyId });
		requestAnimationFrame(() => textareaEl?.focus());
	}

	function handlePaste(e: ClipboardEvent) {
		const items = e.clipboardData?.items;
		if (!items) return;
		for (const item of Array.from(items)) {
			if (item.type.startsWith('image/')) {
				e.preventDefault();
				const file = item.getAsFile();
				if (!file) continue;
				const reader = new FileReader();
				reader.onloadend = () => {
					attachPreview = { dataUrl: reader.result as string, type: 'image', name: 'pasted-image.png' };
				};
				reader.readAsDataURL(file);
				break;
			}
		}
	}

	function handleFileSelect(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		const isVideo = file.type.startsWith('video/');
		const reader = new FileReader();
		reader.onloadend = () => {
			attachPreview = { dataUrl: reader.result as string, type: isVideo ? 'video' : 'image', name: file.name };
		};
		reader.readAsDataURL(file);
		input.value = '';
	}

	async function startRecording() {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
			mediaRecorder = new MediaRecorder(stream);
			audioChunks = [];
			mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunks.push(e.data); };
			mediaRecorder.onstop = () => {
				const blob = new Blob(audioChunks, { type: 'audio/webm' });
				const reader = new FileReader();
				reader.onloadend = () => {
					onsend({ content: reader.result as string, type: 'audio' });
				};
				reader.readAsDataURL(blob);
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

	function formatPreview(content: string): string {
		if (!content) return '';
		return content.length > 40 ? content.slice(0, 40) + '...' : content;
	}

	onDestroy(() => {
		if (mediaRecorder && mediaRecorder.state !== 'inactive') {
			mediaRecorder.stop();
		}
		if (recordingInterval) {
			clearInterval(recordingInterval);
		}
		if (draftSaveTimer) clearTimeout(draftSaveTimer);
	});

	export function focus() {
		textareaEl?.focus();
	}

	export function getCurrentDraft(): string {
		return newMessage;
	}
</script>

<footer class="chat-input">
	{#if replyToMessage}
		<div class="reply-bar">
			<div class="reply-bar-content">
				<svg class="w-4 h-4 shrink-0" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
				</svg>
				<span class="reply-bar-label">Replying to</span>
				<span class="reply-bar-name">{replyToMessage.sender_full_name || replyToMessage.sender_username}</span>
				<span class="reply-bar-text">{formatPreview(replyToMessage.content)}</span>
			</div>
			<button class="reply-bar-close" aria-label="Cancel reply" onclick={oncancelreply}>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}

	{#if attachPreview}
		<div class="attach-preview-bar">
			{#if attachPreview.type === 'image'}
				<img src={attachPreview.dataUrl} alt="Preview" class="attach-thumb" />
			{:else}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video src={attachPreview.dataUrl} class="attach-thumb-video"></video>
			{/if}
			<span class="attach-filename">{attachPreview.name}</span>
			<button class="attach-cancel" aria-label="Remove attachment" onclick={() => { attachPreview = null; }}>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}

	{#if mentionActive && participants.length > 0}
		<div class="mention-anchor">
			<MentionDropdown
				{participants}
				query={mentionQuery}
				selectedIndex={mentionIndex}
				onselect={selectMention}
			/>
		</div>
	{/if}
	<input bind:this={fileInputEl} type="file" accept="image/*,video/*" class="hidden" onchange={handleFileSelect} />
	<div class="message-input-box">
		<div class="input-row">
			{#if isRecording}
				<div class="recording-indicator">
					<span class="recording-dot"></span>
					<span class="recording-time">{formatRecordingTime(recordingTime)}</span>
					<span class="recording-label">Recording...</span>
				</div>
				<button class="stop-record-btn" aria-label="Stop recording and send" onclick={stopRecording}>
					<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
				</button>
			{:else}
				<textarea
					bind:this={textareaEl}
					bind:value={newMessage}
					placeholder="Message {isDirect ? convoDisplayName : '#' + convoDisplayName}..."
					class="text-input"
					rows="1"
					onkeydown={handleKeydown}
					onpaste={handlePaste}
					oninput={(e) => {
						const target = e.currentTarget;
						target.style.height = 'auto';
						target.style.height = Math.min(target.scrollHeight, 120) + 'px';
						onemittyping();
						detectMention();
						saveDraftDebounced();
					}}
				></textarea>
				<div class="input-actions">
					<button class="action-btn" aria-label="Attach" onclick={() => fileInputEl?.click()}>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
					</button>
					<div class="picker-wrap">
						<button class="action-btn" aria-label="Emoji" onclick={() => { showEmojiPicker = !showEmojiPicker; showGifPicker = false; }}>
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
							</svg>
						</button>
						{#if showEmojiPicker}
							<EmojiPicker
								onpick={(emoji) => { newMessage += emoji; showEmojiPicker = false; textareaEl?.focus(); }}
								onclose={() => { showEmojiPicker = false; }}
							/>
						{/if}
					</div>
					<div class="picker-wrap">
						<button class="action-btn" aria-label="GIF" onclick={() => { showGifPicker = !showGifPicker; showEmojiPicker = false; }}>
							<span class="gif-label">GIF</span>
						</button>
						{#if showGifPicker}
							<GifPicker
								onpick={(url) => { showGifPicker = false; onsend({ content: url, type: 'image' }); }}
								onclose={() => { showGifPicker = false; }}
							/>
						{/if}
					</div>
				</div>
				{#if newMessage.trim() || attachPreview}
					<button class="send-btn" disabled={sending} aria-label="Send" onclick={sendMessage}>
						<svg class="w-[16px] h-[16px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
						</svg>
					</button>
				{:else}
					<button class="action-btn mic-action" aria-label="Voice" onclick={startRecording}>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
						</svg>
					</button>
				{/if}
			{/if}
		</div>
	</div>
</footer>

<style>
	.chat-input { padding: 0 16px 16px; flex-shrink: 0; }

	/* Reply bar */
	.reply-bar {
		display: flex; align-items: center; justify-content: space-between;
		padding: 8px 16px; margin-bottom: 8px; border-radius: 12px;
		background: color-mix(in srgb, var(--color-primary) 6%, transparent); border: none;
	}
	.reply-bar-content { display: flex; align-items: center; gap: 8px; min-width: 0; flex: 1; }
	.reply-bar-label { font-size: 12px; color: var(--color-text-dim); flex-shrink: 0; }
	.reply-bar-name { font-size: 13px; font-weight: 600; color: var(--color-primary); flex-shrink: 0; }
	.reply-bar-text { font-size: 12px; color: var(--color-text-dim); opacity: 0.6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
	.reply-bar-close {
		width: 28px; height: 28px; border-radius: 6px;
		display: flex; align-items: center; justify-content: center;
		color: var(--color-text-dim); flex-shrink: 0; transition: background 0.12s;
	}
	.reply-bar-close:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); }

	/* Attachment preview */
	.attach-preview-bar {
		display: flex; align-items: center; gap: 10px;
		padding: 8px 12px; margin-bottom: 8px; border-radius: 12px;
		background: color-mix(in srgb, var(--color-text) 4%, transparent); border: none;
	}
	.attach-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
	.attach-thumb-video { width: 80px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: color-mix(in srgb, var(--color-text) 8%, transparent); }
	.attach-filename { flex: 1; min-width: 0; font-size: 13px; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.attach-cancel {
		width: 28px; height: 28px; border-radius: 6px;
		display: flex; align-items: center; justify-content: center;
		color: var(--color-text-dim); flex-shrink: 0; transition: background 0.12s;
	}
	.attach-cancel:hover { background: color-mix(in srgb, var(--color-error) 15%, transparent); color: var(--color-error); }

	/* Input box */
	.message-input-box {
		border: none;
		border-radius: 20px;
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
		transition: background 0.25s;
	}
	.mention-anchor { position: relative; }
	.message-input-box:focus-within {
		background: color-mix(in srgb, var(--color-text) 5%, transparent);
	}
	.input-row { padding: 6px 6px 6px 18px; display: flex; align-items: flex-end; gap: 4px; }
	.input-actions {
		display: flex; align-items: center; gap: 0;
		flex-shrink: 0; margin-bottom: 2px;
	}
	.text-input {
		flex: 1; min-width: 0; background: transparent; border: none; outline: none;
		font-size: 15px; color: var(--color-text); resize: none;
		min-height: 24px; max-height: 120px; font-family: inherit;
		line-height: 1.5;
	}
	.text-input:focus, .text-input:focus-visible {
		outline: none; box-shadow: none;
	}
	.text-input::placeholder { color: var(--color-text-dim); opacity: 0.5; }
	.action-btn {
		width: 32px; height: 32px; border-radius: 10px;
		background: transparent; color: var(--color-text-dim);
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; transition: background 0.15s, color 0.15s;
	}
	.action-btn:hover { background: color-mix(in srgb, var(--color-text) 8%, transparent); color: var(--color-text); }
	.send-btn {
		width: 34px; height: 34px; border-radius: 50%;
		background: var(--color-primary); color: white;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; transition: background 0.15s, transform 0.2s;
	}
	.send-btn:hover:not(:disabled) { background: var(--color-accent); transform: scale(1.08); }
	.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

	/* Recording */
	.recording-indicator { flex: 1; display: flex; align-items: center; gap: 10px; padding: 0 8px; }
	.recording-dot {
		width: 10px; height: 10px; border-radius: 50%; background: var(--color-error);
		animation: recPulse 1s ease-in-out infinite;
	}
	@keyframes recPulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.8); }
	}
	.recording-time { font-size: 15px; font-weight: 600; color: var(--color-text); font-variant-numeric: tabular-nums; }
	.recording-label { font-size: 13px; color: var(--color-text-dim); }
	.stop-record-btn {
		width: 36px; height: 36px; border-radius: 12px; background: var(--color-error); color: white;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; transition: background 0.15s;
	}
	.stop-record-btn:hover { background: color-mix(in srgb, var(--color-error) 85%, black); }
	.picker-wrap { position: relative; }
	.gif-label {
		font-size: 11px; font-weight: 700; letter-spacing: 0.02em;
		color: var(--color-text-dim); line-height: 1;
	}
	.action-btn:hover .gif-label { color: var(--color-text); }
	@media (prefers-reduced-motion: reduce) {
		.recording-dot { animation: none !important; }
	}
</style>
