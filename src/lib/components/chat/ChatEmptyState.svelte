<script lang="ts">
	let {
		type = 'no-conversation',
		onNewChat
	}: {
		type?: 'no-conversation' | 'no-messages';
		onNewChat?: () => void;
	} = $props();
</script>

{#if type === 'no-conversation'}
	<div class="flex-1 flex items-center justify-center">
		<div class="empty-container">
			<div class="icon-ring">
				<div class="icon-inner">
					<svg class="w-8 h-8" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
					</svg>
				</div>
			</div>
			<p class="title">Select a conversation</p>
			<p class="subtitle">Choose from the sidebar or start a new chat.</p>
			{#if onNewChat}
				<button class="action-btn" onclick={onNewChat}>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					Start a new conversation
				</button>
			{/if}
		</div>
	</div>
{:else}
	<div class="flex-1 flex items-center justify-center py-20">
		<div class="empty-container">
			<div class="msg-icon">
				<svg class="w-10 h-10" style="color: var(--color-primary); opacity: 0.5;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
				</svg>
			</div>
			<p class="title">No messages yet</p>
			<p class="subtitle">Be the first to break the silence.</p>
		</div>
	</div>
{/if}

<style>
	.empty-container {
		text-align: center;
		max-width: 320px;
		animation: emptyFadeIn 500ms ease-out;
	}
	.icon-ring {
		width: 72px; height: 72px; margin: 0 auto 20px; border-radius: 50%;
		background: color-mix(in srgb, var(--color-primary) 8%, transparent); display: flex; align-items: center; justify-content: center;
	}
	.icon-inner {
		width: 56px; height: 56px; border-radius: 50%;
		background: color-mix(in srgb, var(--color-primary) 12%, transparent); display: flex; align-items: center; justify-content: center;
	}
	.msg-icon {
		width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 16px;
		background: color-mix(in srgb, var(--color-primary) 8%, transparent); display: flex; align-items: center; justify-content: center;
	}
	.title { font-size: 16px; font-weight: 600; color: var(--color-text); }
	.subtitle { font-size: 13px; margin-top: 4px; color: var(--color-text-dim); }
	.action-btn {
		margin-top: 20px; display: inline-flex; align-items: center; gap: 8px;
		padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
		color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 10%, transparent);
		border: 1px solid color-mix(in srgb, var(--color-primary) 20%, transparent); transition: background 0.15s, border-color 0.15s;
	}
	.action-btn:hover { background: color-mix(in srgb, var(--color-primary) 18%, transparent); border-color: color-mix(in srgb, var(--color-primary) 35%, transparent); }
	@keyframes emptyFadeIn {
		from { opacity: 0; transform: translateY(12px); }
		to { opacity: 1; transform: translateY(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.empty-container { animation: none !important; }
	}
</style>
