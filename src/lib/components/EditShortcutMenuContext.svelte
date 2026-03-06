<script lang="ts">
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import { copyTextToClipboard } from '$lib/util/copyTextToClipboard';
	import { clickOutside } from '$lib/actions/clickOutside';

	let { onedit }: { onedit: () => void } = $props();

	let ctx = $derived(shortcutsStore.contextMenu!);

	function close() {
		shortcutsStore.contextMenu = null;
	}

	function handleCopyAddress() {
		copyTextToClipboard(ctx.shortcut.url);
		close();
	}

	async function handleDelete() {
		if (confirm(`Delete "${ctx.shortcut.title}" shortcut?`)) {
			try {
				await shortcutsStore.remove(ctx.shortcut.id);
			} catch {
				// error shown via toast in store
			}
			close();
		}
	}

	function openEditShortcut() {
		shortcutsStore.editShortcut = { ...ctx.shortcut };
		close();
		onedit();
	}
</script>

<div
	use:clickOutside={close}
	class="ctx-menu"
	style="
		top: {ctx.y}px;
		left: {ctx.x}px;
		--ctx-accent: var(--color-primary);
	"
>
	<button class="ctx-item" onclick={openEditShortcut}>Edit</button>
	<button class="ctx-item ctx-danger" onclick={handleDelete}>Delete</button>
	<div class="ctx-divider"></div>
	<a class="ctx-item" href={ctx.shortcut.url} target="_blank" rel="noopener noreferrer" onclick={close}>Open in new tab</a>
	<button class="ctx-item" onclick={handleCopyAddress}>Copy link</button>
</div>

<style>
	.ctx-menu {
		position: fixed;
		z-index: 50;
		display: flex;
		flex-direction: column;
		min-width: 10rem;
		padding: 0.375rem;
		border-radius: 0.75rem;
		background-color: var(--color-background);
		border: 1px solid var(--color-surface-hover);
		box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--color-surface) inset;
		backdrop-filter: blur(24px) saturate(1.4);
		animation: scale-in-center 0.15s ease;
	}
	.ctx-item {
		display: block;
		width: 100%;
		padding: 0.5rem 0.75rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		color: var(--color-text);
		text-align: left;
		text-decoration: none;
		transition: background-color 0.1s;
	}
	.ctx-item:hover {
		background-color: var(--color-surface-hover);
	}
	.ctx-danger:hover {
		background-color: color-mix(in srgb, var(--color-error) 15%, transparent);
		color: #ff6b6b;
	}
	.ctx-divider {
		height: 1px;
		margin: 0.25rem 0.5rem;
		background: var(--color-surface-hover);
	}
</style>
