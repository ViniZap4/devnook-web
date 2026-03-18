<script lang="ts">
	import type { Message } from '$lib/types/message';
	import { userStore } from '$lib/stores/user.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import QuickEmojiPicker from './QuickEmojiPicker.svelte';
	import LinkEmbed from './LinkEmbed.svelte';

	let {
		msg,
		groupStart = false,
		replyTarget = undefined,
		isNew = false,
		isEditing = false,
		editContent = '',
		layout = 'flat',
		isConsecutive = false,
		isDeleting = false,
		isHighlighted = false,
		onreact,
		onreply,
		onedit,
		ondelete,
		onsaveedit,
		oncanceledit,
		oneditkeydown,
		oneditcontentchange,
		onmediaload,
		onreplytargetclick,
		onforward
	}: {
		msg: Message;
		groupStart: boolean;
		replyTarget?: Message;
		isNew: boolean;
		isEditing: boolean;
		editContent: string;
		layout: 'flat' | 'bubble';
		isConsecutive: boolean;
		isDeleting: boolean;
		isHighlighted: boolean;
		onreact: (msgId: number, emoji: string) => void;
		onreply: (msg: Message) => void;
		onedit: (msg: Message) => void;
		ondelete: (msgId: number) => void;
		onsaveedit: () => void;
		oncanceledit: () => void;
		oneditkeydown: (e: KeyboardEvent) => void;
		oneditcontentchange: (value: string) => void;
		onmediaload: () => void;
		onreplytargetclick: (msgId: number) => void;
		onforward: (msg: Message) => void;
	} = $props();

	let showEmojiPicker = $state(false);
	const isMine = $derived(msg.sender_username === userStore.user?.username);
	const forceGroupStart = $derived(groupStart || !!replyTarget);
	const isBubble = $derived(layout === 'bubble');

	function escapeHtml(str: string): string {
		return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	function formatMessageContent(content: string): string {
		let text = escapeHtml(content);

		// Extract code blocks to placeholders first
		const codeBlocks: string[] = [];
		text = text.replace(/```([\s\S]*?)```/g, (_, code) => {
			codeBlocks.push(`<pre><code>${code}</code></pre>`);
			return `\x00CB${codeBlocks.length - 1}\x00`;
		});

		// Extract inline code
		const inlineCodes: string[] = [];
		text = text.replace(/`([^`\n]+)`/g, (_, code) => {
			inlineCodes.push(`<code>${code}</code>`);
			return `\x00IC${inlineCodes.length - 1}\x00`;
		});

		// Format text (safe now — code is extracted)
		text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
		text = text.replace(/(?<![\\*])\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
		text = text.replace(/(?<![\\_ ])\b_([^_\n]+)_\b(?!_)/g, '<em>$1</em>');
		text = text.replace(/~([^~\n]+)~/g, '<del>$1</del>');
		// Spoiler: ||text||
		text = text.replace(/\|\|([^|]+)\|\|/g, '<span class="spoiler" onclick="this.classList.toggle(\'revealed\')" role="button" tabindex="0">$1</span>');
		// @mentions
		text = text.replace(/@(\w+)/g, '<span class="mention">@$1</span>');

		// Better URL regex — avoid trailing punctuation
		text = text.replace(/(https?:\/\/[^\s<]+[^\s<.,;:!?"')\]])/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');

		text = text.replace(/\n/g, '<br>');

		// Restore inline code
		text = text.replace(/\x00IC(\d+)\x00/g, (_, idx) => inlineCodes[parseInt(idx)]);
		// Restore code blocks
		text = text.replace(/\x00CB(\d+)\x00/g, (_, idx) => codeBlocks[parseInt(idx)]);

		return text;
	}

	function extractUrls(content: string): string[] {
		// Strip code blocks and inline code before extracting URLs
		let text = content.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]+`/g, '');
		const urlRegex = /(https?:\/\/[^\s<]+[^\s<.,;:!?"')\]])/g;
		const matches = text.match(urlRegex);
		return matches ? matches.slice(0, 3) : [];
	}

	function formatHoverTime(dateStr: string): string {
		return new Date(dateStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
	}

	function formatPreview(content: string): string {
		if (!content) return '';
		return content.length > 40 ? content.slice(0, 40) + '...' : content;
	}

	function getAnimClass(): string {
		if (!isNew) return '';
		if (isBubble) {
			return isMine ? 'anim-send' : 'anim-receive';
		}
		return 'anim-flat-new';
	}

	function autofocusAction(node: HTMLTextAreaElement) {
		node.focus();
		node.style.height = 'auto';
		node.style.height = Math.min(node.scrollHeight, 120) + 'px';
	}
</script>

{#if msg.type === 'system'}
	<!-- === System message === -->
	<div class="system-msg" class:msg-deleting={isDeleting} data-msg-id={msg.id}>
		<span class="system-msg-text">{msg.content}</span>
	</div>
{:else if isBubble}
	<!-- === iMessage Bubble Layout === -->
	<div
		class="bubble-row {getAnimClass()}"
		class:bubble-row-mine={isMine}
		class:bubble-row-other={!isMine}
		class:bubble-row-group-start={forceGroupStart}
		class:msg-deleting={isDeleting}
		class:msg-highlighted={isHighlighted}
		data-msg-id={msg.id}
	>
		<!-- Avatar column for other's messages -->
		{#if !isMine}
			<div class="bubble-avatar">
				{#if forceGroupStart}
					<Avatar username={msg.sender_username} size={32} />
				{/if}
			</div>
		{/if}

		<div class="bubble-content" class:bubble-content-mine={isMine}>
			<!-- Reply context -->
			{#if replyTarget}
				<div
					class="reply-context"
					class:reply-mine={isMine}
					role="button"
					tabindex="0"
					onclick={() => replyTarget && onreplytargetclick(replyTarget.id)}
					onkeydown={(e) => { if (e.key === 'Enter') replyTarget && onreplytargetclick(replyTarget.id); }}
				>
					<svg class="reply-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
					</svg>
					<span class="reply-author">{replyTarget.sender_full_name || replyTarget.sender_username}</span>
					<span class="reply-text">{formatPreview(replyTarget.content)}</span>
				</div>
			{:else if msg.reply_to_id}
				<div class="reply-context reply-missing" class:reply-mine={isMine}>
					<svg class="reply-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
					</svg>
					<span class="reply-text">Original message not available</span>
				</div>
			{/if}

			{#if forceGroupStart && !isMine}
				<div class="bubble-sender">
					<span class="bubble-sender-name">{msg.sender_full_name || msg.sender_username}</span>
					<span class="bubble-sender-time"><RelativeTime date={msg.created_at} /></span>
				</div>
			{/if}

			<div
				class="msg-bubble"
				class:msg-bubble-mine={isMine}
				class:msg-bubble-other={!isMine}
				class:msg-bubble-continuation-mine={isMine && isConsecutive}
				class:msg-bubble-continuation-other={!isMine && isConsecutive}
			>
				{#if isEditing}
					<div class="edit-box">
						<textarea
							class="edit-textarea"
							value={editContent}
							oninput={(e) => {
								const t = e.currentTarget;
								oneditcontentchange(t.value);
								t.style.height = 'auto';
								t.style.height = Math.min(t.scrollHeight, 120) + 'px';
							}}
							onkeydown={oneditkeydown}
							rows="1"
							use:autofocusAction
						></textarea>
						<div class="edit-actions">
							<span class="edit-hint">Esc cancel / Enter save</span>
							<button class="edit-cancel" onclick={oncanceledit}>Cancel</button>
							<button class="edit-save" onclick={onsaveedit}>Save</button>
						</div>
					</div>
				{:else if msg.type === 'audio'}
					<div class="audio-msg">
						<div class="audio-icon">
							<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
							</svg>
						</div>
						<!-- svelte-ignore a11y_media_has_caption -->
						<audio controls preload="metadata" src={msg.content} class="audio-player"></audio>
					</div>
				{:else if msg.type === 'image'}
					<a href={msg.content} target="_blank" rel="noopener noreferrer" class="image-msg-link">
						<img src={msg.content} alt="Image message" class="image-msg" onload={onmediaload} />
					</a>
				{:else if msg.type === 'video'}
					<!-- svelte-ignore a11y_media_has_caption -->
					<video src={msg.content} controls class="video-msg" onloadeddata={onmediaload}></video>
				{:else}
					<div class="msg-text" class:msg-text-mine={isMine}>{@html formatMessageContent(msg.content)}</div>
					{#if msg.type === 'text'}
						{#each extractUrls(msg.content) as url}
							<LinkEmbed {url} />
						{/each}
					{/if}
				{/if}
			</div>

			{#if isMine && forceGroupStart}
				<div class="bubble-time-mine">
					<RelativeTime date={msg.created_at} />
					{#if msg.edited}<span class="edited-tag">(edited)</span>{/if}
				</div>
			{/if}

			{#if msg.id < 0}
				<span class="sending-indicator">Sending...</span>
			{/if}

			{#if msg.reactions && msg.reactions.length > 0}
				<div class="reactions-display">
					{#each msg.reactions as reaction}
						<button
							class="reaction-pill"
							class:reaction-active={reaction.reacted}
							onclick={() => onreact(msg.id, reaction.emoji)}
						>
							<span>{reaction.emoji}</span>
							<span class="reaction-count">{reaction.count}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Toolbar -->
		{#if msg.id > 0 && !isEditing}
			<div class="msg-toolbar" class:toolbar-mine={isMine}>
				<button class="toolbar-btn" aria-label="Reply" onclick={() => onreply(msg)}>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
					</svg>
				</button>
				<button class="toolbar-btn" aria-label="Forward message" onclick={() => onforward(msg)}>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</button>
				<div class="reaction-trigger-wrap">
					<button
						class="toolbar-btn"
						aria-label="Add reaction"
						onclick={(e) => { e.stopPropagation(); showEmojiPicker = !showEmojiPicker; }}
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
						</svg>
					</button>
					{#if showEmojiPicker}
						<QuickEmojiPicker
							onpick={(emoji) => { onreact(msg.id, emoji); showEmojiPicker = false; }}
							onclose={() => { showEmojiPicker = false; }}
						/>
					{/if}
				</div>
				{#if isMine}
					<div class="toolbar-divider"></div>
					<button class="toolbar-btn" aria-label="Edit message" onclick={() => onedit(msg)}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</button>
					<button class="toolbar-btn toolbar-btn-danger" aria-label="Delete message" onclick={() => ondelete(msg.id)}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				{/if}
			</div>
		{/if}
	</div>
{:else}
	<!-- === Slack Flat Layout === -->
	<div
		class="msg-row {getAnimClass()}"
		class:msg-row-group-start={forceGroupStart}
		class:msg-deleting={isDeleting}
		class:msg-highlighted={isHighlighted}
		data-msg-id={msg.id}
	>
		<div class="msg-gutter">
			{#if forceGroupStart}
				<Avatar username={msg.sender_username} size={36} />
			{:else}
				<time class="gutter-time" datetime={msg.created_at}>{formatHoverTime(msg.created_at)}</time>
			{/if}
		</div>

		<div class="msg-body">
			{#if replyTarget}
				<div
					class="reply-context"
					role="button"
					tabindex="0"
					onclick={() => replyTarget && onreplytargetclick(replyTarget.id)}
					onkeydown={(e) => { if (e.key === 'Enter') replyTarget && onreplytargetclick(replyTarget.id); }}
				>
					<svg class="reply-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
					</svg>
					<span class="reply-author">{replyTarget.sender_full_name || replyTarget.sender_username}</span>
					<span class="reply-text">{formatPreview(replyTarget.content)}</span>
				</div>
			{:else if msg.reply_to_id}
				<div class="reply-context reply-missing">
					<svg class="reply-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
					</svg>
					<span class="reply-text">Original message not available</span>
				</div>
			{/if}

			{#if forceGroupStart}
				<div class="msg-header">
					<span class="msg-name" class:msg-name-mine={isMine}>{msg.sender_full_name || msg.sender_username}</span>
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
						value={editContent}
						oninput={(e) => {
							const t = e.currentTarget;
							oneditcontentchange(t.value);
							t.style.height = 'auto';
							t.style.height = Math.min(t.scrollHeight, 120) + 'px';
						}}
						onkeydown={oneditkeydown}
						rows="1"
						use:autofocusAction
					></textarea>
					<div class="edit-actions">
						<span class="edit-hint">Escape to cancel, Enter to save</span>
						<button class="edit-cancel" onclick={oncanceledit}>Cancel</button>
						<button class="edit-save" onclick={onsaveedit}>Save</button>
					</div>
				</div>
			{:else if msg.type === 'audio'}
				<div class="audio-msg">
					<div class="audio-icon">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m-4 0h8m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
						</svg>
					</div>
					<!-- svelte-ignore a11y_media_has_caption -->
					<audio controls preload="metadata" src={msg.content} class="audio-player"></audio>
				</div>
			{:else if msg.type === 'image'}
				<a href={msg.content} target="_blank" rel="noopener noreferrer" class="image-msg-link">
					<img src={msg.content} alt="Image message" class="image-msg" onload={onmediaload} />
				</a>
			{:else if msg.type === 'video'}
				<!-- svelte-ignore a11y_media_has_caption -->
				<video src={msg.content} controls class="video-msg" onloadeddata={onmediaload}></video>
			{:else}
				<div class="msg-text">{@html formatMessageContent(msg.content)}</div>
				{#if msg.type === 'text'}
					{#each extractUrls(msg.content) as url}
						<LinkEmbed {url} />
					{/each}
				{/if}
			{/if}

			{#if msg.id < 0}
				<span class="sending-indicator">Sending...</span>
			{/if}

			{#if msg.reactions && msg.reactions.length > 0}
				<div class="reactions-display">
					{#each msg.reactions as reaction}
						<button
							class="reaction-pill"
							class:reaction-active={reaction.reacted}
							onclick={() => onreact(msg.id, reaction.emoji)}
						>
							<span>{reaction.emoji}</span>
							<span class="reaction-count">{reaction.count}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>

		{#if msg.id > 0 && !isEditing}
			<div class="msg-toolbar">
				<button class="toolbar-btn" aria-label="Reply" onclick={() => onreply(msg)}>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" />
					</svg>
				</button>
				<button class="toolbar-btn" aria-label="Forward message" onclick={() => onforward(msg)}>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
					</svg>
				</button>
				<div class="reaction-trigger-wrap">
					<button
						class="toolbar-btn"
						aria-label="Add reaction"
						onclick={(e) => { e.stopPropagation(); showEmojiPicker = !showEmojiPicker; }}
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
						</svg>
					</button>
					{#if showEmojiPicker}
						<QuickEmojiPicker
							onpick={(emoji) => { onreact(msg.id, emoji); showEmojiPicker = false; }}
							onclose={() => { showEmojiPicker = false; }}
						/>
					{/if}
				</div>
				{#if isMine}
					<div class="toolbar-divider"></div>
					<button class="toolbar-btn" aria-label="Edit message" onclick={() => onedit(msg)}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
						</svg>
					</button>
					<button class="toolbar-btn toolbar-btn-danger" aria-label="Delete message" onclick={() => ondelete(msg.id)}>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
						</svg>
					</button>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<style>
	/* === System message === */
	.system-msg {
		display: flex; justify-content: center; padding: 4px 20px;
	}
	.system-msg-text {
		font-size: 12px; color: var(--color-text-dim); opacity: 0.6;
		font-style: italic; text-align: center;
		padding: 4px 14px; border-radius: 12px;
		background: color-mix(in srgb, var(--color-text) 3%, transparent);
	}

	/* === Flat layout (Slack) === */
	.msg-row {
		position: relative; display: flex; align-items: flex-start;
		gap: 0; padding: 1px 20px; border-radius: 0;
		transition: background 0.1s;
	}
	.msg-row:hover { background: color-mix(in srgb, var(--color-text) 4%, transparent); }
	.msg-row-group-start { padding-top: 8px; margin-top: 4px; }
	.msg-gutter {
		width: 44px; flex-shrink: 0; display: flex;
		align-items: flex-start; justify-content: center; padding-top: 2px;
	}
	.gutter-time {
		font-size: 10px; color: var(--color-text-dim); opacity: 0;
		transition: opacity 0.15s; white-space: nowrap; font-style: normal; padding-top: 4px;
	}
	.msg-row:hover .gutter-time { opacity: 0.6; }
	.msg-body {
		flex: 1; min-width: 0; display: flex; flex-direction: column; padding: 0 8px;
	}
	.msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 2px; }
	.msg-name { font-size: 14px; font-weight: 600; color: var(--color-text); }
	.msg-name-mine { color: var(--color-primary); }
	.msg-time { font-size: 12px; color: var(--color-text-dim); }
	.msg-edited { font-size: 11px; color: var(--color-text-dim); opacity: 0.5; }

	/* === Bubble layout (iMessage) === */
	.bubble-row {
		position: relative; display: flex; align-items: flex-end;
		padding: 1px 20px; gap: 8px;
	}
	.bubble-row:hover { background: color-mix(in srgb, var(--color-text) 3%, transparent); }
	.bubble-row-group-start { padding-top: 6px; margin-top: 4px; }
	.bubble-row-mine { flex-direction: row-reverse; }
	.bubble-avatar { width: 32px; flex-shrink: 0; }
	.bubble-content {
		display: flex; flex-direction: column; max-width: 65%; min-width: 0;
	}
	.bubble-content-mine { align-items: flex-end; }
	.bubble-sender { display: flex; align-items: baseline; gap: 6px; margin-bottom: 2px; }
	.bubble-sender-name { font-size: 13px; font-weight: 600; color: var(--color-text); }
	.bubble-sender-time { font-size: 11px; color: var(--color-text-dim); }
	.bubble-time-mine {
		display: flex; align-items: center; gap: 4px;
		font-size: 11px; color: var(--color-text-dim); margin-top: 2px;
	}
	.edited-tag { font-size: 10px; opacity: 0.5; }

	.msg-bubble { padding: 10px 16px; border-radius: 20px; transition: background 0.15s; }
	.msg-bubble-mine {
		background: linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, var(--color-accent)));
	}
	.msg-bubble-other {
		background: var(--color-surface);
		border: 1px solid color-mix(in srgb, var(--color-text) 6%, transparent);
	}
	.msg-bubble-continuation-mine { }
	.msg-bubble-continuation-other { }

	/* === Shared text styles === */
	.msg-text {
		font-size: 15px; line-height: 1.5; color: var(--color-text); opacity: 0.9;
		word-break: break-word;
	}
	.msg-text-mine { color: white; opacity: 1; }
	.msg-text :global(a) { color: var(--color-primary); text-decoration: underline; text-underline-offset: 2px; }
	.msg-text-mine :global(a) { color: rgba(255,255,255,0.9); }
	.msg-text :global(strong) { font-weight: 700; }
	.msg-text :global(em) { font-style: italic; }
	.msg-text :global(del) { text-decoration: line-through; opacity: 0.7; }
	.msg-text :global(code) {
		padding: 2px 6px; border-radius: 4px; background: color-mix(in srgb, var(--color-text) 10%, transparent);
		font-family: 'JetBrains Mono', 'Fira Code', source-code-pro, Menlo, Monaco, Consolas, monospace; font-size: 13px;
	}
	.msg-text :global(pre) {
		margin: 4px 0; padding: 10px 14px; border-radius: 8px;
		background: color-mix(in srgb, var(--color-text) 8%, transparent); overflow-x: auto;
	}
	.msg-text :global(pre code) { padding: 0; background: transparent; font-size: 13px; line-height: 1.6; }
	.msg-text :global(.spoiler) {
		background: var(--color-text-dim); color: transparent; border-radius: 4px;
		padding: 0 4px; cursor: pointer; transition: background 0.2s, color 0.2s;
		user-select: none;
	}
	.msg-text :global(.spoiler.revealed) { background: color-mix(in srgb, var(--color-text) 10%, transparent); color: inherit; }
	.msg-text :global(.mention) { color: var(--color-primary); font-weight: 600; }

	/* === Reply context === */
	.reply-context {
		display: flex; align-items: center; gap: 6px;
		padding: 2px 0 4px; font-size: 12px; min-width: 0;
	}
	.reply-mine { justify-content: flex-end; }
	.reply-missing { opacity: 0.4; cursor: default; }
	.reply-icon { width: 14px; height: 14px; color: var(--color-text-dim); opacity: 0.5; flex-shrink: 0; }
	.reply-author { font-weight: 600; color: var(--color-primary); opacity: 0.7; flex-shrink: 0; }
	.reply-text { color: var(--color-text-dim); opacity: 0.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }

	/* === Media === */
	.image-msg-link { display: block; width: fit-content; text-decoration: none; }
	.image-msg {
		max-width: 320px; max-height: 300px; border-radius: 16px;
		object-fit: cover; cursor: pointer; display: block;
		transition: opacity 0.15s, transform 0.2s;
		animation: media-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	.image-msg:hover { opacity: 0.92; transform: scale(1.01); }
	.video-msg {
		max-width: 360px; max-height: 280px; border-radius: 16px;
		display: block; background: color-mix(in srgb, var(--color-text) 8%, transparent);
		animation: media-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes media-pop {
		0% { opacity: 0; transform: scale(0.9); border-radius: 24px; }
		100% { opacity: 1; transform: scale(1); border-radius: 16px; }
	}
	.audio-msg {
		display: flex; align-items: center; gap: 10px;
		padding: 8px 14px; border-radius: 8px;
		background: color-mix(in srgb, var(--color-text) 4%, transparent); max-width: 320px; width: fit-content;
	}
	.audio-icon {
		width: 36px; height: 36px; border-radius: 50%;
		background: color-mix(in srgb, var(--color-text) 10%, transparent);
		display: flex; align-items: center; justify-content: center;
		flex-shrink: 0; color: var(--color-primary);
	}
	.audio-player { height: 32px; flex: 1; min-width: 0; border-radius: 8px; color-scheme: dark; accent-color: var(--color-primary); }

	.sending-indicator { font-size: 10px; margin-top: 2px; display: block; color: var(--color-text-dim); opacity: 0.6; }

	/* === Reactions === */
	.reactions-display { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
	.reaction-pill {
		display: flex; align-items: center; gap: 4px; padding: 2px 8px;
		border-radius: 16px; font-size: 13px;
		background: color-mix(in srgb, var(--color-text) 5%, transparent); border: 1px solid var(--color-border);
		transition: background 0.12s, border-color 0.12s;
	}
	.reaction-pill:hover { background: color-mix(in srgb, var(--color-text) 10%, transparent); }
	.reaction-active { background: color-mix(in srgb, var(--color-primary) 12%, transparent); border-color: color-mix(in srgb, var(--color-primary) 30%, transparent); }
	.reaction-count { font-size: 11px; color: var(--color-text-dim); }
	.reaction-active .reaction-count { color: var(--color-primary); }

	/* === Edit mode === */
	.edit-box {
		display: flex; flex-direction: column; gap: 6px; padding: 8px;
		border-radius: 12px; background: color-mix(in srgb, var(--color-text) 4%, transparent); border: none;
	}
	.edit-textarea {
		width: 100%; background: transparent; border: none; outline: none;
		font-size: 15px; color: var(--color-text); resize: none;
		min-height: 24px; font-family: inherit; line-height: 1.5;
	}
	.edit-actions { display: flex; gap: 8px; align-items: center; justify-content: flex-end; }
	.edit-hint { font-size: 11px; color: var(--color-text-dim); opacity: 0.5; margin-right: auto; }
	.edit-cancel {
		padding: 4px 12px; border-radius: 10px; font-size: 12px;
		color: var(--color-text-dim); transition: background 0.12s;
	}
	.edit-cancel:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); }
	.edit-save {
		padding: 4px 14px; border-radius: 10px; font-size: 12px; font-weight: 500;
		color: white; background: var(--color-primary); transition: background 0.12s;
	}
	.edit-save:hover { background: var(--color-accent); }

	/* === Action toolbar === */
	.msg-toolbar {
		position: absolute; top: 0; right: 20px;
		display: none; align-items: center; gap: 1px; padding: 2px 4px;
		border-radius: 8px; background: var(--glass-bg);
		backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		box-shadow: 0 2px 8px color-mix(in srgb, var(--color-overlay, #000) 40%, transparent); z-index: 10;
		animation: toolbar-pop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	.toolbar-mine { right: auto; left: 20px; }
	.msg-row:hover .msg-toolbar, .msg-row:focus-within .msg-toolbar,
	.bubble-row:hover .msg-toolbar, .bubble-row:focus-within .msg-toolbar { display: flex; }
	.toolbar-btn {
		width: 30px; height: 30px; border-radius: 8px;
		display: flex; align-items: center; justify-content: center;
		color: var(--color-text-dim); transition: background 0.1s, color 0.1s;
	}
	.toolbar-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	.toolbar-btn:hover { background: color-mix(in srgb, var(--color-text) 8%, transparent); color: var(--color-text); }
	.toolbar-btn-danger:hover { background: color-mix(in srgb, var(--color-error) 15%, transparent); color: var(--color-error); }
	.toolbar-divider { width: 1px; height: 20px; background: var(--color-separator); margin: 0 2px; }
	.reaction-trigger-wrap { position: relative; }

	/* === Animations === */
	@keyframes toolbar-pop {
		0% { opacity: 0; transform: scale(0.85) translateY(6px); }
		100% { opacity: 1; transform: scale(1) translateY(0); }
	}

	/* Send animation — subtle slide up */
	.anim-send {
		animation: msg-send 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes msg-send {
		0% { opacity: 0; transform: translateY(8px) scale(0.96); }
		100% { opacity: 1; transform: translateY(0) scale(1); }
	}

	/* Receive animation — subtle slide in */
	.anim-receive {
		animation: msg-receive 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes msg-receive {
		0% { opacity: 0; transform: translateX(-6px) scale(0.97); }
		100% { opacity: 1; transform: translateX(0) scale(1); }
	}

	/* Flat new message */
	.anim-flat-new {
		animation: msg-flat-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	@keyframes msg-flat-in {
		from { opacity: 0; transform: translateY(6px); }
		to { opacity: 1; transform: translateY(0); }
	}

	/* Delete animation */
	.msg-deleting {
		animation: msg-delete 0.3s ease-out forwards;
	}
	@keyframes msg-delete {
		0% { opacity: 1; transform: scale(1); max-height: 200px; }
		100% { opacity: 0; transform: scale(0.85) translateX(10px); max-height: 0; overflow: hidden; padding-top: 0; padding-bottom: 0; margin-top: 0; margin-bottom: 0; }
	}

	/* Highlight animation */
	.msg-highlighted {
		animation: highlight-pulse 2s ease-out forwards;
	}
	@keyframes highlight-pulse {
		0% { background: color-mix(in srgb, var(--color-primary) 20%, transparent); box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 30%, transparent); }
		100% { background: transparent; box-shadow: none; }
	}

	/* Reply context clickable */
	.reply-context[role="button"] { cursor: pointer; border-radius: 8px; padding: 4px 8px; margin: -2px -4px; transition: background 0.12s; }
	.reply-context[role="button"]:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); }
	.reply-context[role="button"]:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: reduce) {
		.anim-send, .anim-receive, .anim-flat-new, .msg-deleting, .msg-highlighted { animation: none !important; }
	}
</style>
