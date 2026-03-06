<script lang="ts">
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';

	let { id, title, url }: { id: number; title: string; url: string } = $props();

	const parsed = $derived(new URL(url));
	const urlIcon = $derived(`https://${parsed.hostname}/favicon.ico`);

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		shortcutsStore.contextMenu = { x: e.x, y: e.y, shortcut: { id, title, url } };
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<a
	class="shortcut-card"
	href={parsed.href}
	target="_blank"
	rel="noopener noreferrer"
	oncontextmenu={handleContextMenu}
	style="--accent: var(--color-primary);"
>
	<!-- svelte-ignore a11y_missing_attribute -->
	<object class="shortcut-icon" data={urlIcon} type="image/png" aria-label="{title} icon">
		<span class="shortcut-fallback" style="background: linear-gradient(135deg, var(--color-primary)40, var(--color-secondary)40); color: var(--color-primary);">
			{title[0].toUpperCase()}{title.length > 1 ? title[1].toLowerCase() : ''}
		</span>
	</object>
	<span class="shortcut-name">{title}</span>
</a>

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
		background-color: var(--color-surface-hover);
	}
	.shortcut-icon {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.75rem;
		background: var(--color-surface-hover);
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
</style>
