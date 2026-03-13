<script lang="ts">
	let { usernames }: { usernames: string[] } = $props();

	function formatText(names: string[]): string {
		if (names.length === 0) return '';
		if (names.length === 1) return `${names[0]} is typing`;
		if (names.length === 2) return `${names[0]} and ${names[1]} are typing`;
		return `${names[0]} and ${names.length - 1} others are typing`;
	}
</script>

{#if usernames.length > 0}
	<div class="typing-indicator">
		<div class="typing-dots">
			<span class="dot"></span><span class="dot"></span><span class="dot"></span>
		</div>
		<span class="typing-text">{formatText(usernames)}</span>
	</div>
{/if}

<style>
	.typing-indicator {
		display: flex; align-items: center; gap: 8px;
		padding: 4px 20px; flex-shrink: 0;
	}
	.typing-dots { display: flex; gap: 3px; align-items: center; }
	.dot {
		width: 6px; height: 6px; border-radius: 50%;
		background: var(--color-text-dim); opacity: 0.5;
		animation: typing-bounce 1.2s ease-in-out infinite;
	}
	.dot:nth-child(2) { animation-delay: 0.15s; }
	.dot:nth-child(3) { animation-delay: 0.3s; }
	@keyframes typing-bounce {
		0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
		30% { transform: translateY(-6px); opacity: 1; }
	}
	.typing-text { font-size: 12px; color: var(--color-text-dim); opacity: 0.7; }
	@media (prefers-reduced-motion: reduce) {
		.dot { animation: none !important; }
	}
</style>
