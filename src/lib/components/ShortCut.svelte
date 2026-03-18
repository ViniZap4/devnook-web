<script lang="ts">
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import PlusIcon from '$lib/assets/icons/PlusIcon.svelte';

	let {
		id,
		title,
		url,
		isCreate = false,
		oncreate
	}: {
		id?: number;
		title?: string;
		url?: string;
		isCreate?: boolean;
		oncreate?: () => void;
	} = $props();

	const parsed = $derived(url ? new URL(url) : null);
	const urlIcon = $derived(parsed ? `https://${parsed.hostname}/favicon.ico` : '');

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		if (id !== undefined && title && url) {
			shortcutsStore.contextMenu = { x: e.x, y: e.y, shortcut: { id, title, url } };
		}
	}
</script>

{#if isCreate}
	<button class="shortcut-card create" onclick={oncreate} style="--accent: var(--color-primary);">
		<div class="shortcut-icon create-icon">
			<PlusIcon />
		</div>
		<span class="shortcut-name create-label">Add new</span>
	</button>
{:else}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<a
		class="shortcut-card"
		href={parsed?.href}
		target="_blank"
		rel="noopener noreferrer"
		oncontextmenu={handleContextMenu}
		style="--accent: var(--color-primary);"
	>
		<!-- svelte-ignore a11y_missing_attribute -->
		<object class="shortcut-icon" data={urlIcon} type="image/png" aria-label="{title} icon">
			<span class="shortcut-fallback" style="background: var(--color-primary-subtle); color: var(--color-primary);">
				{title?.[0]?.toUpperCase() ?? ''}{title && title.length > 1 ? title[1].toLowerCase() : ''}
			</span>
		</object>
		<span class="shortcut-name">{title}</span>
	</a>
{/if}

<style>
	.shortcut-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 0.75rem;
		border-radius: 1rem;
		text-decoration: none;
		transition: transform 0.2s, background-color 0.2s;
		width: 5.5rem;
	}
	.shortcut-card:hover {
		transform: translateY(-2px);
		background-color: rgba(255, 255, 255, 0.06);
	}
	.shortcut-icon {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.75rem;
		background: rgba(255, 255, 255, 0.06);
		padding: 0.375rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.shortcut-fallback {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
		border-radius: 0.5rem;
		font-weight: 700;
		font-size: 0.875rem;
	}
	.shortcut-name {
		font-size: 0.75rem;
		color: var(--color-text);
		opacity: 0.6;
		text-align: center;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 100%;
	}

	/* Create variant styles */
	.shortcut-card.create {
		background: none;
	}
	.create-icon {
		background: none;
		padding: 0;
		border: 2px dashed var(--glass-border);
		transition: border-color 0.2s;
	}
	.shortcut-card.create:hover .create-icon {
		border-color: var(--accent);
	}
	.create-icon :global(svg) {
		width: 45%;
		height: 45%;
		opacity: 0.5;
	}
	.shortcut-card.create:hover .create-icon :global(svg) {
		opacity: 0.8;
	}
	.create-label {
		opacity: 0.4;
	}
</style>
