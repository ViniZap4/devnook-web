<script lang="ts">
	import { tick } from 'svelte';
	import type { Message } from '$lib/types/message';
	import Spinner from '$lib/components/Spinner.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';
	import MessageRow from './MessageRow.svelte';
	import ChatEmptyState from './ChatEmptyState.svelte';

	let {
		messages: msgs,
		loading = false,
		loadingOlder = false,
		hasMoreMessages = true,
		seenMessageIds,
		editingMessageId = null,
		editContent = '',
		layout = 'flat',
		onscrolltop,
		onreact,
		onreply,
		onedit,
		ondelete,
		onsaveedit,
		oncanceledit,
		oneditkeydown,
		oneditcontentchange,
		onreplytargetclick,
		onforward
	}: {
		messages: Message[];
		loading: boolean;
		loadingOlder: boolean;
		hasMoreMessages: boolean;
		seenMessageIds: Set<number>;
		editingMessageId: number | null;
		editContent: string;
		layout: 'flat' | 'bubble';
		onscrolltop: () => void;
		onreact: (msgId: number, emoji: string) => void;
		onreply: (msg: Message) => void;
		onedit: (msg: Message) => void;
		ondelete: (msgId: number) => void;
		onsaveedit: () => void;
		oncanceledit: () => void;
		oneditkeydown: (e: KeyboardEvent) => void;
		oneditcontentchange: (value: string) => void;
		onreplytargetclick: (msgId: number) => void;
		onforward: (msg: Message) => void;
	} = $props();

	let scrollEl = $state<HTMLElement>();
	let showScrollBtn = $state(false);
	let isNearBottom = $state(true);
	let deletingIds = $state(new Set<number>());
	let highlightedMessageId = $state<number | null>(null);

	function getDateLabel(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
		const diffDays = Math.round((today.getTime() - msgDay.getTime()) / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return 'Yesterday';
		return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
	}

	function shouldShowDateDivider(allMsgs: Message[], idx: number): boolean {
		if (idx === 0) return true;
		const curr = new Date(allMsgs[idx].created_at).toDateString();
		const prev = new Date(allMsgs[idx - 1].created_at).toDateString();
		return curr !== prev;
	}

	function isGroupStart(allMsgs: Message[], idx: number): boolean {
		if (idx === 0) return true;
		if (shouldShowDateDivider(allMsgs, idx)) return true;
		const curr = allMsgs[idx];
		const prev = allMsgs[idx - 1];
		if (curr.sender_username !== prev.sender_username) return true;
		const gap = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
		return gap > 5 * 60 * 1000;
	}

	function isConsecutive(allMsgs: Message[], idx: number): boolean {
		if (idx === 0) return false;
		const curr = allMsgs[idx];
		const prev = allMsgs[idx - 1];
		if (curr.sender_username !== prev.sender_username) return false;
		if (shouldShowDateDivider(allMsgs, idx)) return false;
		const gap = new Date(curr.created_at).getTime() - new Date(prev.created_at).getTime();
		return gap <= 5 * 60 * 1000;
	}

	function getReplyTarget(replyToId: number | undefined): Message | undefined {
		if (!replyToId) return undefined;
		return msgs.find(m => m.id === replyToId);
	}

	function handleScroll() {
		if (!scrollEl) return;
		const distFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
		isNearBottom = distFromBottom < 100;
		showScrollBtn = distFromBottom > 300;

		if (scrollEl.scrollTop < 100 && !loadingOlder && hasMoreMessages && msgs.length > 0) {
			onscrolltop();
		}
	}

	function handleMediaLoad() {
		if (isNearBottom) scrollToBottom();
	}

	export function scrollToBottom() {
		if (scrollEl) scrollEl.scrollTop = scrollEl.scrollHeight;
	}

	export function getScrollEl() {
		return scrollEl;
	}

	export function getIsNearBottom() {
		return isNearBottom;
	}

	export function scrollToMessage(msgId: number) {
		if (!scrollEl) return;
		const el = scrollEl.querySelector(`[data-msg-id="${msgId}"]`);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			highlightedMessageId = msgId;
			setTimeout(() => {
				highlightedMessageId = null;
			}, 2000);
		}
	}

	export function markDeleting(msgId: number) {
		deletingIds.add(msgId);
		deletingIds = new Set(deletingIds);
	}

	export function unmarkDeleting(msgId: number) {
		deletingIds.delete(msgId);
		deletingIds = new Set(deletingIds);
	}
</script>

<section bind:this={scrollEl} class="messages-scroll" aria-label="Messages" onscroll={handleScroll}>
	{#if loadingOlder}
		<div class="flex justify-center py-3">
			<Spinner size="sm" />
		</div>
	{/if}

	{#if loading}
		<div class="skeleton-container">
			{#each Array(8) as _, i}
				<div class="skeleton-row" style="animation-delay: {i * 60}ms;">
					<Skeleton width="36px" height="36px" rounded="rounded-full" />
					<div class="skeleton-body">
						<div class="flex gap-3 items-center">
							<Skeleton width="{80 + Math.random() * 60}px" height="14px" rounded="rounded" />
							<Skeleton width="40px" height="12px" rounded="rounded" />
						</div>
						<Skeleton width="{120 + Math.random() * 200}px" height="16px" rounded="rounded" />
						{#if i % 3 === 0}
							<Skeleton width="{80 + Math.random() * 140}px" height="16px" rounded="rounded" />
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else if msgs.length === 0}
		<ChatEmptyState type="no-messages" />
	{:else}
		{#each msgs as msg, i (msg.id)}
			{@const groupStart = isGroupStart(msgs, i)}
			{@const replyTarget = getReplyTarget(msg.reply_to_id)}
			{@const consecutive = isConsecutive(msgs, i)}

			{#if shouldShowDateDivider(msgs, i)}
				<div class="date-sep">
					<div class="date-sep-line"></div>
					<span class="date-sep-label">{getDateLabel(msg.created_at)}</span>
					<div class="date-sep-line"></div>
				</div>
			{/if}

			<MessageRow
				{msg}
				{groupStart}
				{replyTarget}
				isNew={!seenMessageIds.has(msg.id)}
				isEditing={editingMessageId === msg.id}
				{editContent}
				{layout}
				isConsecutive={consecutive}
				isDeleting={deletingIds.has(msg.id)}
				isHighlighted={highlightedMessageId === msg.id}
				{onreact}
				{onreply}
				{onedit}
				{ondelete}
				{onsaveedit}
				{oncanceledit}
				{oneditkeydown}
				{oneditcontentchange}
				onmediaload={handleMediaLoad}
				{onreplytargetclick}
				{onforward}
			/>
		{/each}
	{/if}
</section>

{#if showScrollBtn}
	<button class="scroll-bottom-btn" aria-label="Scroll to bottom" onclick={() => scrollToBottom()}>
		<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
		</svg>
	</button>
{/if}

<style>
	.messages-scroll {
		flex: 1; overflow-y: auto; overflow-x: hidden;
		padding: 12px 0; display: flex; flex-direction: column; gap: 0; min-height: 0;
		position: relative;
	}
	.date-sep { display: flex; align-items: center; gap: 16px; margin: 20px 20px 12px; }
	.date-sep-line { flex: 1; height: 1px; background: var(--color-separator); }
	.date-sep-label {
		font-size: 11px; font-weight: 600; color: var(--color-text-dim);
		padding: 4px 14px; border-radius: 20px;
		background: var(--color-surface); border: none;
		backdrop-filter: blur(12px);
		letter-spacing: 0.02em;
	}
	.skeleton-container {
		padding: 16px 20px; display: flex; flex-direction: column; gap: 16px;
		flex: 1;
	}
	.skeleton-row {
		display: flex; gap: 12px; align-items: flex-start;
		animation: fade-up 0.4s ease both;
	}
	.skeleton-body {
		flex: 1; display: flex; flex-direction: column; gap: 6px;
	}
	.scroll-bottom-btn {
		position: absolute; bottom: 80px; right: 24px;
		width: 40px; height: 40px; border-radius: 14px;
		background: var(--glass-bg); border: 1px solid var(--glass-border);
		backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
		color: var(--color-text-dim); display: flex; align-items: center; justify-content: center;
		box-shadow: 0 4px 12px color-mix(in srgb, var(--color-overlay, #000) 30%, transparent); transition: background 0.15s, color 0.15s, transform 0.15s;
		z-index: 5; animation: scroll-btn-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both;
	}
	.scroll-bottom-btn:hover { background: color-mix(in srgb, var(--color-primary) 15%, transparent); color: var(--color-primary); transform: translateY(-2px); }
	@keyframes scroll-btn-in {
		from { opacity: 0; transform: scale(0.8); }
		to { opacity: 1; transform: scale(1); }
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton-row, .scroll-bottom-btn { animation: none !important; }
	}
</style>
