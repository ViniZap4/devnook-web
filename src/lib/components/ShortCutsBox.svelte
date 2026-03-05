<script lang="ts">
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import ShortCut from './ShortCut.svelte';
	import NewShortCut from './NewShortCut.svelte';
	import EditShortcutMenuContext from './EditShortcutMenuContext.svelte';
	import CreateShortcutModal from './CreateShortcutModal.svelte';
	import EditShortcutModal from './EditShortcutModal.svelte';

	let createModalOpen = $state(false);
	let editModalOpen = $state(false);
</script>

<section class="card p-6 animate-pop-in">
	<div class="flex items-center gap-2 mb-4">
		<svg class="w-4 h-4" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
		</svg>
		<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Shortcuts</h2>
	</div>
	<div class="grid grid-cols-[repeat(auto-fill,5.5rem)] gap-1">
		{#each shortcutsStore.shortcuts as shortcut, i (shortcut.id)}
			<div style="animation: pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-delay: {i * 50}ms;">
				<ShortCut id={shortcut.id} link={shortcut.link} name={shortcut.name} />
			</div>
		{/each}
		<NewShortCut oncreate={() => { createModalOpen = true; }} />
	</div>
	{#if shortcutsStore.contextMenu}
		<EditShortcutMenuContext onedit={() => { editModalOpen = true; }} />
	{/if}
</section>

<CreateShortcutModal open={createModalOpen} onclose={() => { createModalOpen = false; }} />
<EditShortcutModal open={editModalOpen} onclose={() => { editModalOpen = false; }} />
