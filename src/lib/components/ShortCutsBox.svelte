<script lang="ts">
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import ShortCut from './ShortCut.svelte';
	import EditShortcutMenuContext from './EditShortcutMenuContext.svelte';
	import ShortcutModal from './ShortcutModal.svelte';

	let modalOpen = $state(false);

	function openCreate() {
		shortcutsStore.editShortcut = null;
		modalOpen = true;
	}

	function openEdit() {
		modalOpen = true;
	}
</script>

<section class="card p-6 animate-fade-up">
	<div class="flex items-center gap-2 mb-4">
		<svg class="w-4 h-4" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
		</svg>
		<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Shortcuts</h2>
	</div>
	<div class="grid grid-cols-[repeat(auto-fill,5.5rem)] gap-1.5">
		{#each shortcutsStore.shortcuts as shortcut (shortcut.id)}
			<ShortCut id={shortcut.id} title={shortcut.title} url={shortcut.url} />
		{/each}
		<ShortCut isCreate oncreate={openCreate} />
	</div>
	{#if shortcutsStore.contextMenu}
		<EditShortcutMenuContext onedit={openEdit} />
	{/if}
</section>

<ShortcutModal open={modalOpen} onclose={() => { modalOpen = false; }} />
