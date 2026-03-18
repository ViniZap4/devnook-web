<script lang="ts">
	import type { ConversationParticipant } from '$lib/types/message';
	import Avatar from '$lib/components/Avatar.svelte';

	let {
		participants,
		query,
		selectedIndex,
		onselect
	}: {
		participants: ConversationParticipant[];
		query: string;
		selectedIndex: number;
		onselect: (username: string) => void;
	} = $props();

	const MAX_RESULTS = 5;

	const filtered = $derived(
		query.trim() === ''
			? participants.slice(0, MAX_RESULTS)
			: participants
					.filter((p) => {
						const q = query.toLowerCase();
						return (
							p.username.toLowerCase().includes(q) ||
							(p.full_name && p.full_name.toLowerCase().includes(q))
						);
					})
					.slice(0, MAX_RESULTS)
	);
</script>

{#if filtered.length > 0}
	<div class="mention-dropdown" role="menu" aria-label="Mention suggestions">
		{#each filtered as participant, i (participant.user_id)}
				<button
				class="mention-item"
				class:active={i === selectedIndex}
				type="button"
				aria-label="Mention {participant.username}"
				onclick={() => onselect(participant.username)}
			>
				<Avatar username={participant.username} size={28} />
				<div class="mention-info">
					<span class="mention-fullname">{participant.full_name || participant.username}</span>
					<span class="mention-username">@{participant.username}</span>
				</div>
			</button>
		{/each}
	</div>
{/if}

<style>
	.mention-dropdown {
		position: absolute;
		bottom: 100%;
		left: 0;
		right: 0;
		margin-bottom: 6px;
		border-radius: 12px;
		background: var(--glass-bg);
		backdrop-filter: blur(20px);
		-webkit-backdrop-filter: blur(20px);
		border: 1px solid var(--glass-border);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3);
		overflow: hidden;
		z-index: 30;
		animation: mention-pop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	.mention-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 8px 12px;
		cursor: pointer;
		transition: background 0.12s;
	}

	.mention-item:hover,
	.mention-item.active {
		background: rgba(var(--color-primary-rgb, 6 182 212) / 0.12);
	}

	.mention-item.active {
		background: color-mix(in srgb, var(--color-primary) 14%, transparent);
	}

	.mention-info {
		display: flex;
		flex-direction: column;
		gap: 1px;
		min-width: 0;
	}

	.mention-fullname {
		font-size: 13px;
		font-weight: 500;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.mention-username {
		font-size: 11px;
		color: var(--color-text-dim);
		opacity: 0.7;
	}

	.mention-item.active .mention-fullname {
		color: var(--color-primary);
	}

	@keyframes mention-pop {
		0% {
			opacity: 0;
			transform: translateY(4px) scale(0.97);
		}
		100% {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.mention-dropdown {
			animation: none !important;
		}
	}
</style>
