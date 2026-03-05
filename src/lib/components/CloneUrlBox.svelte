<script lang="ts">
	import { copyTextToClipboard } from '$lib/util/copyTextToClipboard';
	import CopyIcon from '$lib/assets/icons/CopyIcon.svelte';

	let { url }: { url: string } = $props();
	let copied = $state(false);

	async function handleCopy() {
		await copyTextToClipboard(url);
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}
</script>

<div class="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
	<code class="text-xs text-[var(--color-text)] opacity-70 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{url}</code>
	<button
		onclick={handleCopy}
		class="text-[var(--color-text)] opacity-50 hover:opacity-100 transition-opacity shrink-0"
		title="Copy clone URL"
	>
		{#if copied}
			<span class="text-green-400 text-xs">Copied!</span>
		{:else}
			<CopyIcon size={14} />
		{/if}
	</button>
</div>
