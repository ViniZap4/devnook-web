<script lang="ts">
	import Spinner from '$lib/components/Spinner.svelte';

	let {
		onpick,
		onclose
	}: {
		onpick: (url: string) => void;
		onclose: () => void;
	} = $props();

	// ---------------------------------------------------------------------------
	// Tenor API key resolution — never hardcoded, graceful degradation
	// ---------------------------------------------------------------------------
	const tenorApiKey: string | undefined =
		(typeof window !== 'undefined' && (window as any).__TENOR_API_KEY) ||
		(import.meta.env.VITE_TENOR_API_KEY ?? undefined);

	interface TenorGif {
		id: string;
		title: string;
		media_formats: {
			gif?: { url: string };
			tinygif?: { url: string };
			nanogif?: { url: string };
		};
	}

	const TRENDING_TERMS = ['excited', 'thumbs up', 'celebration', 'applause', 'laughing'];

	let searchQuery = $state('');
	let gifs = $state<TenorGif[]>([]);
	let loading = $state(false);
	let error = $state('');
	let containerEl = $state<HTMLDivElement | null>(null);
	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let currentFetchId = 0;

	// ---------------------------------------------------------------------------
	// Fetch logic
	// ---------------------------------------------------------------------------
	async function fetchGifs(q: string) {
		if (!tenorApiKey) return;

		const fetchId = ++currentFetchId;
		loading = true;
		error = '';

		try {
			const endpoint =
				q.trim()
					? `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(q)}&key=${tenorApiKey}&limit=20&media_filter=gif`
					: `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(TRENDING_TERMS[Math.floor(Math.random() * TRENDING_TERMS.length)])}&key=${tenorApiKey}&limit=20&media_filter=gif`;

			const res = await fetch(endpoint);

			if (fetchId !== currentFetchId) return; // stale response

			if (!res.ok) {
				error = `Tenor API error: ${res.status}`;
				gifs = [];
				return;
			}

			const data = await res.json();
			gifs = (data.results ?? []) as TenorGif[];
		} catch (err) {
			if (fetchId !== currentFetchId) return;
			error = 'Failed to load GIFs. Check your connection.';
			gifs = [];
		} finally {
			if (fetchId === currentFetchId) loading = false;
		}
	}

	// Load trending on mount
	$effect(() => {
		if (tenorApiKey) {
			fetchGifs('');
		}
	});

	// Debounced search
	$effect(() => {
		const q = searchQuery;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			if (tenorApiKey) fetchGifs(q);
		}, 300);

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
		};
	});

	// ---------------------------------------------------------------------------
	// Outside-click / Escape
	// ---------------------------------------------------------------------------
	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (containerEl && !containerEl.contains(target)) {
			onclose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function handlePick(gif: TenorGif) {
		const url =
			gif.media_formats.gif?.url ??
			gif.media_formats.tinygif?.url ??
			gif.media_formats.nanogif?.url;
		if (url) onpick(url);
	}

	// Split GIFs into two columns for a basic masonry layout
	const col1 = $derived(gifs.filter((_, i) => i % 2 === 0));
	const col2 = $derived(gifs.filter((_, i) => i % 2 === 1));
</script>

<svelte:document onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="gif-picker" bind:this={containerEl} role="dialog" aria-label="GIF picker">
	<!-- Search -->
	<div class="search-row">
		<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" />
			<path stroke-linecap="round" d="m21 21-4.3-4.3" />
		</svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search GIFs..."
			class="search-input"
			aria-label="Search GIFs"
		/>
		{#if searchQuery}
			<button class="search-clear" onclick={() => { searchQuery = ''; }} aria-label="Clear search">
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	<!-- Body -->
	<div class="gif-body">
		{#if !tenorApiKey}
			<div class="no-key-msg">
				<svg class="no-key-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
				</svg>
				<p class="no-key-title">GIFs not configured</p>
				<p class="no-key-desc">
					Set <code>VITE_TENOR_API_KEY</code> in your environment or assign
					<code>window.__TENOR_API_KEY</code> to enable GIF search via the Tenor API.
				</p>
			</div>
		{:else if loading}
			<div class="loader">
				<Spinner size="md" />
			</div>
		{:else if error}
			<div class="error-msg">
				<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
				</svg>
				<span>{error}</span>
			</div>
		{:else if gifs.length === 0}
			<div class="empty-msg">
				<span>No GIFs found{searchQuery ? ` for "${searchQuery}"` : ''}.</span>
			</div>
		{:else}
			<div class="gif-grid">
				<div class="gif-col">
					{#each col1 as gif (gif.id)}
						{@const thumbUrl = gif.media_formats.tinygif?.url ?? gif.media_formats.nanogif?.url ?? gif.media_formats.gif?.url}
						{#if thumbUrl}
							<button
								class="gif-item"
								title={gif.title || 'GIF'}
								aria-label={gif.title || 'GIF'}
								onclick={() => handlePick(gif)}
							>
								<img
									src={thumbUrl}
									alt={gif.title || 'GIF'}
									loading="lazy"
									decoding="async"
								/>
							</button>
						{/if}
					{/each}
				</div>
				<div class="gif-col">
					{#each col2 as gif (gif.id)}
						{@const thumbUrl = gif.media_formats.tinygif?.url ?? gif.media_formats.nanogif?.url ?? gif.media_formats.gif?.url}
						{#if thumbUrl}
							<button
								class="gif-item"
								title={gif.title || 'GIF'}
								aria-label={gif.title || 'GIF'}
								onclick={() => handlePick(gif)}
							>
								<img
									src={thumbUrl}
									alt={gif.title || 'GIF'}
									loading="lazy"
									decoding="async"
								/>
							</button>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	</div>

	<!-- Tenor attribution (required by Tenor API ToS) -->
	{#if tenorApiKey && gifs.length > 0}
		<div class="tenor-attr" aria-label="Powered by Tenor">
			<svg viewBox="0 0 100 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
				<text x="0" y="18" font-size="14" font-family="sans-serif" fill="currentColor" font-weight="600">Powered by Tenor</text>
			</svg>
		</div>
	{/if}
</div>

<style>
	.gif-picker {
		position: absolute;
		bottom: calc(100% + 8px);
		right: 0;
		width: 340px;
		max-height: 400px;
		display: flex;
		flex-direction: column;
		border-radius: 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(24px);
		-webkit-backdrop-filter: blur(24px);
		border: 1px solid var(--glass-border);
		box-shadow: 0 12px 40px color-mix(in srgb, var(--color-overlay, #000) 40%, transparent), 0 4px 12px color-mix(in srgb, var(--color-overlay, #000) 20%, transparent);
		z-index: 40;
		overflow: hidden;
		animation: picker-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	/* Search */
	.search-row {
		position: relative;
		padding: 10px 10px 8px;
		border-bottom: 1px solid var(--glass-border);
		flex-shrink: 0;
	}

	.search-icon {
		position: absolute;
		left: 20px;
		top: 50%;
		transform: translateY(-50%);
		margin-top: 1px;
		width: 14px;
		height: 14px;
		color: var(--color-text-dim);
		opacity: 0.5;
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		padding: 7px 28px 7px 32px;
		font-size: 13px;
		border-radius: 8px;
		border: 1px solid var(--glass-border);
		background: color-mix(in srgb, var(--color-text) 5%, transparent);
		color: var(--color-text);
		outline: none;
		font-family: inherit;
		transition: border-color 0.15s, background 0.15s;
	}

	.search-input::placeholder {
		color: var(--color-text-dim);
		opacity: 0.5;
	}

	.search-input:focus {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-text) 7%, transparent);
	}

	.search-clear {
		position: absolute;
		right: 18px;
		top: 50%;
		transform: translateY(-50%);
		margin-top: 1px;
		color: var(--color-text-dim);
		opacity: 0.5;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: 4px;
		transition: opacity 0.12s, background 0.12s;
	}

	.search-clear:hover {
		opacity: 1;
		background: color-mix(in srgb, var(--color-text) 8%, transparent);
	}

	/* Body scroll area */
	.gif-body {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		scrollbar-width: thin;
		scrollbar-color: var(--glass-border) transparent;
	}

	.gif-body::-webkit-scrollbar {
		width: 4px;
	}

	.gif-body::-webkit-scrollbar-track {
		background: transparent;
	}

	.gif-body::-webkit-scrollbar-thumb {
		background: var(--glass-border);
		border-radius: 2px;
	}

	/* Masonry two-column grid */
	.gif-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 6px;
		align-items: start;
	}

	.gif-col {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gif-item {
		display: block;
		width: 100%;
		border-radius: 8px;
		overflow: hidden;
		cursor: pointer;
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
		transition: opacity 0.15s, transform 0.15s;
	}

	.gif-item:hover {
		opacity: 0.85;
		transform: scale(1.02);
	}

	.gif-item:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}

	.gif-item img {
		display: block;
		width: 100%;
		height: auto;
		border-radius: 8px;
		object-fit: cover;
	}

	/* States */
	.loader {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 0;
	}

	.error-msg {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 16px 8px;
		font-size: 13px;
		color: var(--color-error);
	}

	.empty-msg {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 32px 8px;
		font-size: 13px;
		color: var(--color-text-dim);
		opacity: 0.6;
	}

	/* No API key state */
	.no-key-msg {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
		padding: 24px 16px;
		text-align: center;
	}

	.no-key-icon {
		width: 36px;
		height: 36px;
		color: var(--color-text-dim);
		opacity: 0.4;
	}

	.no-key-title {
		font-size: 14px;
		font-weight: 600;
		color: var(--color-text);
	}

	.no-key-desc {
		font-size: 12px;
		color: var(--color-text-dim);
		opacity: 0.7;
		line-height: 1.5;
	}

	.no-key-desc code {
		font-family: 'JetBrains Mono', 'Fira Code', monospace;
		font-size: 11px;
		padding: 1px 5px;
		border-radius: 4px;
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid var(--glass-border);
		color: var(--color-primary);
	}

	/* Tenor attribution */
	.tenor-attr {
		flex-shrink: 0;
		padding: 4px 10px 6px;
		border-top: 1px solid var(--glass-border);
		display: flex;
		align-items: center;
		justify-content: flex-end;
		color: var(--color-text-dim);
		opacity: 0.35;
		font-size: 10px;
	}

	.tenor-attr svg {
		height: 14px;
		width: auto;
	}

	@keyframes picker-pop {
		0% {
			opacity: 0;
			transform: scale(0.92) translateY(8px);
		}
		100% {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.gif-picker {
			animation: none !important;
		}

		.gif-item {
			transition: opacity 0.1s !important;
		}

		.gif-item:hover {
			transform: none !important;
		}
	}
</style>
