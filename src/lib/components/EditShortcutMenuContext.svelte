<script lang="ts">
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import { copyTextToClipboard } from '$lib/util/copyTextToClipboard';
	import ContextMenu from './ContextMenu.svelte';

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

<ContextMenu x={ctx.x} y={ctx.y} onclose={close}>
	<button class="ctx-item" onclick={openEditShortcut}>Edit</button>
	<button class="ctx-item ctx-danger" onclick={handleDelete}>Delete</button>
	<div class="ctx-divider"></div>
	<a class="ctx-item" href={ctx.shortcut.url} target="_blank" rel="noopener noreferrer" onclick={close}>Open in new tab</a>
	<button class="ctx-item" onclick={handleCopyAddress}>Copy link</button>
</ContextMenu>

<style>
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
		background-color: rgba(255, 255, 255, 0.06);
	}
	.ctx-danger:hover {
		background-color: var(--color-error-subtle);
		color: var(--color-error);
	}
	.ctx-divider {
		height: 1px;
		margin: 0.25rem 0.5rem;
		background: var(--glass-border);
	}
</style>
