<script lang="ts">
	import type { Message } from '$lib/types/message';
	import FormatToolbar from './FormatToolbar.svelte';

	let {
		convoDisplayName = '',
		isDirect = false,
		sending = false,
		replyToMessage = null,
		onsend,
		oncancelreply,
		onemittyping
	}: {
		convoDisplayName: string;
		isDirect: boolean;
		sending: boolean;
		replyToMessage: Message | null;
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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			sendMessage();
		}
		if (e.key === 'Escape') {
			if (replyToMessage) oncancelreply();
		}
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

	export function focus() {
		textareaEl?.focus();
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

	<div class="message-input-box">
		<FormatToolbar {textareaEl} currentValue={newMessage} oninsert={(val) => { newMessage = val; }} />
		<div class="input-row">
			<input bind:this={fileInputEl} type="file" accept="image/*,video/*" class="hidden" onchange={handleFileSelect} />
			<button class="attach-btn" aria-label="Attach image or video" onclick={() => fileInputEl?.click()}>
				<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
				</svg>
			</button>
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
					}}
				></textarea>
				{#if newMessage.trim() || attachPreview}
					<button class="send-btn" disabled={sending} aria-label="Send message" onclick={sendMessage}>
						<svg class="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
						</svg>
					</button>
				{:else}
					<button class="mic-btn" aria-label="Record audio message" onclick={startRecording}>
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
						</svg>
					</button>
				{/if}
			{/if}
		</div>
	</div>
	<p class="input-hint">Press <kbd>Enter</kbd> to send &middot; <kbd>Shift + Enter</kbd> for new line</p>
</footer>

<style>
	.chat-input { padding: 12px 20px; flex-shrink: 0; }

	/* Reply bar */
	.reply-bar {
		display: flex; align-items: center; justify-content: space-between;
		padding: 8px 16px; margin-bottom: 8px; border-radius: 8px;
		background: rgba(6,182,212,0.06); border: 1px solid rgba(6,182,212,0.15);
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
	.reply-bar-close:hover { background: rgba(255,255,255,0.06); }

	/* Attachment preview */
	.attach-preview-bar {
		display: flex; align-items: center; gap: 10px;
		padding: 8px 12px; margin-bottom: 8px; border-radius: 8px;
		background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
	}
	.attach-thumb { width: 48px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
	.attach-thumb-video { width: 80px; height: 48px; border-radius: 8px; object-fit: cover; flex-shrink: 0; background: rgba(0,0,0,0.3); }
	.attach-filename { flex: 1; min-width: 0; font-size: 13px; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.attach-cancel {
		width: 28px; height: 28px; border-radius: 6px;
		display: flex; align-items: center; justify-content: center;
		color: var(--color-text-dim); flex-shrink: 0; transition: background 0.12s;
	}
	.attach-cancel:hover { background: rgba(239,68,68,0.15); color: #ef4444; }

	/* Input box */
	.message-input-box {
		border: 1px solid var(--glass-border, rgba(255,255,255,0.08));
		border-radius: 8px; background: rgba(255,255,255,0.06);
		overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s;
	}
	.message-input-box:focus-within {
		border-color: rgba(6,182,212,0.5);
		box-shadow: 0 0 0 2px rgba(6,182,212,0.1);
	}
	.input-row { padding: 10px 12px; display: flex; align-items: center; gap: 10px; }
	.attach-btn {
		width: 32px; height: 32px; border-radius: 6px;
		background: rgba(255,255,255,0.05); color: var(--color-text-dim);
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; transition: background 0.15s, color 0.15s;
	}
	.attach-btn:hover { background: rgba(255,255,255,0.1); color: var(--color-text); }
	.text-input {
		flex: 1; min-width: 0; background: transparent; border: none; outline: none;
		font-size: 15px; color: var(--color-text); resize: none;
		min-height: 24px; max-height: 120px; font-family: inherit;
		transition: height 0.15s ease;
	}
	.text-input::placeholder { color: var(--color-text-dim); }
	.send-btn {
		width: 36px; height: 36px; border-radius: 6px;
		background: var(--color-primary); color: white;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; transition: background 0.15s;
	}
	.send-btn:hover:not(:disabled) { background: #22d3ee; }
	.send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
	.mic-btn {
		width: 36px; height: 36px; border-radius: 6px;
		background: rgba(255,255,255,0.06); color: var(--color-text-dim);
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; transition: background 0.15s, color 0.15s;
	}
	.mic-btn:hover { background: rgba(255,255,255,0.1); color: var(--color-text); }
	.input-hint {
		font-size: 11px; color: var(--color-text-dim); opacity: 0.4;
		text-align: center; margin-top: 6px;
	}
	.input-hint kbd {
		display: inline-block; padding: 1px 5px; border-radius: 4px;
		border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.05);
		font-family: inherit; font-size: 10px;
	}

	/* Recording */
	.recording-indicator { flex: 1; display: flex; align-items: center; gap: 10px; padding: 0 8px; }
	.recording-dot {
		width: 10px; height: 10px; border-radius: 50%; background: #ef4444;
		animation: recPulse 1s ease-in-out infinite;
	}
	@keyframes recPulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.8); }
	}
	.recording-time { font-size: 15px; font-weight: 600; color: var(--color-text); font-variant-numeric: tabular-nums; }
	.recording-label { font-size: 13px; color: var(--color-text-dim); }
	.stop-record-btn {
		width: 36px; height: 36px; border-radius: 6px; background: #ef4444; color: white;
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; transition: background 0.15s;
	}
	.stop-record-btn:hover { background: #dc2626; }
	@media (prefers-reduced-motion: reduce) {
		.recording-dot { animation: none !important; }
	}
</style>
