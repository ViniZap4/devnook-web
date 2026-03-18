<script module lang="ts">
	import type { LinkPreviewData } from '$lib/services/api';

	// Shared across all LinkEmbed instances
	const previewCache = new Map<string, LinkPreviewData | null>();
</script>

<script lang="ts">
	import { onMount } from 'svelte';
	import { links } from '$lib/services/api';

	let { url }: { url: string } = $props();

	let preview = $state<LinkPreviewData | null>(null);
	let loading = $state(true);
	let failed = $state(false);

	onMount(async () => {
		if (previewCache.has(url)) {
			preview = previewCache.get(url) ?? null;
			loading = false;
			return;
		}
		try {
			const data = await links.preview(url);
			if (data.title || data.description) {
				preview = data;
				previewCache.set(url, data);
			} else {
				previewCache.set(url, null);
			}
		} catch {
			failed = true;
			previewCache.set(url, null);
		} finally {
			loading = false;
		}
	});

	function getFaviconUrl(domain: string): string {
		return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
	}
</script>

{#if loading}
	<div class="link-embed link-skeleton">
		<div class="skeleton-bar w60"></div>
		<div class="skeleton-bar w80"></div>
		<div class="skeleton-bar w40"></div>
	</div>
{:else if preview && !failed}
	<a href={preview.url} target="_blank" rel="noopener noreferrer" class="link-embed">
		<div class="embed-body">
			<div class="embed-domain">
				<img src={getFaviconUrl(preview.domain)} alt="" class="embed-favicon" />
				<span>{preview.domain}</span>
			</div>
			{#if preview.title}
				<div class="embed-title">{preview.title}</div>
			{/if}
			{#if preview.description}
				<div class="embed-desc">{preview.description}</div>
			{/if}
		</div>
		{#if preview.image_url}
			<img src={preview.image_url} alt="" class="embed-thumb" />
		{/if}
	</a>
{/if}

<style>
	.link-embed {
		display: flex; gap: 12px; margin-top: 6px; padding: 10px 14px;
		border-radius: 10px; border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-text) 3%, transparent); text-decoration: none;
		max-width: 400px; overflow: hidden;
		transition: background 0.12s, border-color 0.12s;
	}
	.link-embed:hover { background: color-mix(in srgb, var(--color-text) 6%, transparent); border-color: color-mix(in srgb, var(--color-text) 12%, transparent); }
	.embed-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
	.embed-domain {
		display: flex; align-items: center; gap: 6px;
		font-size: 12px; color: var(--color-text-dim);
	}
	.embed-favicon { width: 16px; height: 16px; border-radius: 2px; flex-shrink: 0; }
	.embed-title {
		font-size: 14px; font-weight: 600; color: var(--color-primary);
		display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
	}
	.embed-desc {
		font-size: 13px; color: var(--color-text-dim); opacity: 0.7;
		display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
	}
	.embed-thumb {
		width: 80px; height: 80px; border-radius: 8px; object-fit: cover; flex-shrink: 0;
	}
	.link-skeleton { flex-direction: column; gap: 8px; }
	.skeleton-bar {
		height: 12px; border-radius: 4px; background: color-mix(in srgb, var(--color-text) 6%, transparent);
		animation: skeleton-pulse 1.5s ease-in-out infinite;
	}
	.w60 { width: 60%; }
	.w80 { width: 80%; }
	.w40 { width: 40%; }
	@keyframes skeleton-pulse {
		0%, 100% { opacity: 0.4; }
		50% { opacity: 0.8; }
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton-bar, .link-embed { animation: none !important; transition: none !important; }
	}
</style>
