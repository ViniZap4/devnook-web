<script lang="ts">
	import type { Message, Conversation } from '$lib/types/message';
	import { userStore } from '$lib/stores/user.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let {
		open,
		message,
		conversations,
		currentConvoId = 0,
		onforward,
		onclose
	}: {
		open: boolean;
		message: Message | null;
		conversations: Conversation[];
		currentConvoId?: number;
		onforward: (targetConvoId: number) => void;
		onclose: () => void;
	} = $props();

	let searchQuery = $state('');

	const filtered = $derived(
		(searchQuery.trim() === ''
			? conversations
			: conversations.filter((c) =>
					getDisplayName(c).toLowerCase().includes(searchQuery.toLowerCase())
				)
		).filter((c) => c.id !== currentConvoId)
	);

	function getDisplayName(convo: Conversation): string {
		if (convo.name) return convo.name;
		if (convo.type === 'repo') return `${convo.repo_owner}/${convo.repo_name}`;
		if (convo.type === 'org') return convo.org_name || '';
		if (convo.type === 'issue') return `Issue #${convo.issue_number}`;
		const other = convo.participants.find((p) => p.username !== userStore.user?.username);
		return other?.full_name || other?.username || 'Chat';
	}

	function getOtherParticipant(convo: Conversation) {
		return convo.participants.find((p) => p.username !== userStore.user?.username);
	}

	function truncateContent(content: string, max = 80): string {
		if (!content) return '';
		return content.length > max ? content.slice(0, max) + '...' : content;
	}

	function handleClose() {
		searchQuery = '';
		onclose();
	}

	function handleForward(convoId: number) {
		searchQuery = '';
		onforward(convoId);
	}
</script>

<Modal {open} title="Forward Message" onclose={handleClose}>
	<div class="forward-body">
		<!-- Message preview -->
		{#if message}
			<div class="msg-preview">
				<div class="msg-preview-label">Forwarding</div>
				<div class="msg-preview-sender">{message.sender_full_name || message.sender_username}</div>
				<div class="msg-preview-content">{truncateContent(message.content)}</div>
			</div>
		{/if}

		<!-- Search -->
		<div class="search-wrap">
			<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
				<circle cx="11" cy="11" r="8" />
				<path stroke-linecap="round" d="m21 21-4.3-4.3" />
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search conversations..."
				class="form-input"
				aria-label="Search conversations"
			/>
		</div>

		<!-- Conversation list -->
		<div class="convo-list" aria-label="Conversations to forward to">
			{#if filtered.length === 0}
				<p class="empty-msg">No conversations found.</p>
			{:else}
				{#each filtered as convo (convo.id)}
					{@const isDirect = convo.type === 'direct'}
					{@const other = isDirect ? getOtherParticipant(convo) : null}
					<button
						class="convo-item"
						type="button"
						onclick={() => handleForward(convo.id)}
					>
						<div class="convo-avatar">
							{#if isDirect && other}
								<Avatar username={other.username} size={32} />
							{:else}
								<div class="channel-icon" aria-hidden="true">
									<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
									</svg>
								</div>
							{/if}
						</div>
						<div class="convo-info">
							<span class="convo-name">{getDisplayName(convo)}</span>
							{#if !isDirect && convo.type}
								<span class="convo-type">{convo.type}</span>
							{/if}
						</div>
						<svg class="forward-arrow" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
						</svg>
					</button>
				{/each}
			{/if}
		</div>
	</div>
</Modal>

<style>
	.forward-body {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	/* Message preview */
	.msg-preview {
		padding: 10px 14px;
		border-radius: 10px;
		background: rgba(255, 255, 255, 0.04);
		border: 1px solid var(--glass-border);
		border-left: 3px solid var(--color-primary);
	}

	.msg-preview-label {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-weight: 600;
		color: var(--color-primary);
		margin-bottom: 4px;
	}

	.msg-preview-sender {
		font-size: 13px;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 2px;
	}

	.msg-preview-content {
		font-size: 13px;
		color: var(--color-text-dim);
		opacity: 0.8;
		line-height: 1.4;
		word-break: break-word;
	}

	/* Search */
	.search-wrap {
		position: relative;
	}

	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		width: 14px;
		height: 14px;
		color: var(--color-text-dim);
		opacity: 0.5;
		pointer-events: none;
	}

	.form-input {
		width: 100%;
		padding: 10px 14px 10px 34px;
		font-size: 14px;
		border-radius: 12px;
		border: 1px solid var(--glass-border);
		background: var(--color-surface);
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
		border-color: var(--color-primary);
	}

	/* List */
	.convo-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		max-height: 240px;
		overflow-y: auto;
		border-radius: 10px;
		scrollbar-width: thin;
		scrollbar-color: var(--glass-border) transparent;
	}

	.convo-list::-webkit-scrollbar {
		width: 4px;
	}

	.convo-list::-webkit-scrollbar-track {
		background: transparent;
	}

	.convo-list::-webkit-scrollbar-thumb {
		background: var(--glass-border);
		border-radius: 2px;
	}

	.convo-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 10px;
		border-radius: 10px;
		text-align: left;
		transition: background 0.12s;
		width: 100%;
	}

	.convo-item:hover {
		background: rgba(255, 255, 255, 0.06);
	}

	.convo-avatar {
		flex-shrink: 0;
	}

	.channel-icon {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--glass-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-dim);
	}

	.convo-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 1px;
	}

	.convo-name {
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.convo-type {
		font-size: 11px;
		color: var(--color-text-dim);
		opacity: 0.6;
		text-transform: capitalize;
	}

	.forward-arrow {
		width: 16px;
		height: 16px;
		color: var(--color-text-dim);
		opacity: 0.4;
		flex-shrink: 0;
		transition: opacity 0.12s, color 0.12s;
	}

	.convo-item:hover .forward-arrow {
		opacity: 1;
		color: var(--color-primary);
	}

	.empty-msg {
		font-size: 13px;
		color: var(--color-text-dim);
		opacity: 0.5;
		text-align: center;
		padding: 20px 0;
	}
</style>
