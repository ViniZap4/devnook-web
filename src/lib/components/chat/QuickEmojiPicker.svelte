<script lang="ts">
	let {
		onpick,
		onclose
	}: {
		onpick: (emoji: string) => void;
		onclose: () => void;
	} = $props();

	const emojis = ['\u{1F44D}', '\u{2764}\u{FE0F}', '\u{1F604}', '\u{1F389}', '\u{1F440}', '\u{1F680}'];

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (!target.closest('.quick-emoji-popup')) {
			onclose();
		}
	}
</script>

<svelte:document onclick={handleClickOutside} />

<div class="quick-emoji-popup">
	{#each emojis as emoji}
		<button
			class="emoji-btn"
			aria-label="React with {emoji}"
			onclick={(e) => { e.stopPropagation(); onpick(emoji); }}
		>{emoji}</button>
	{/each}
</div>

<style>
	.quick-emoji-popup {
		position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%);
		display: flex; gap: 2px; padding: 4px 6px; border-radius: 8px;
		background: var(--color-surface); border: 1px solid var(--glass-border);
		box-shadow: 0 4px 16px color-mix(in srgb, var(--color-overlay, #000) 50%, transparent); z-index: 20;
		animation: toolbar-pop 0.15s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}
	.emoji-btn {
		width: 30px; height: 30px; border-radius: 8px;
		display: flex; align-items: center; justify-content: center; font-size: 17px;
		transition: background 0.1s, transform 0.1s;
	}
	.emoji-btn:hover { background: color-mix(in srgb, var(--color-text) 10%, transparent); transform: scale(1.15); }
	.emoji-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	@keyframes toolbar-pop {
		0% { opacity: 0; transform: translateX(-50%) scale(0.8) translateY(4px); }
		100% { opacity: 1; transform: translateX(-50%) scale(1) translateY(0); }
	}
	@media (prefers-reduced-motion: reduce) {
		.quick-emoji-popup { animation: none !important; }
	}
</style>
