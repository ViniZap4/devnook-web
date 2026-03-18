<script lang="ts">
	import { createPersistedState } from '$lib/stores/persisted.svelte';
	import { EMOJI_CATEGORIES, type EmojiEntry } from '$lib/data/emojis';

	let {
		onpick,
		onclose
	}: {
		onpick: (emoji: string) => void;
		onclose: () => void;
	} = $props();

	const MAX_RECENT = 24;

	const recentState = createPersistedState<string[]>('devnook:recent-emojis', []);

	let searchQuery = $state('');
	let activeCategoryId = $state('smileys');
	let containerEl = $state<HTMLDivElement | null>(null);
	let gridEl = $state<HTMLDivElement | null>(null);

	const searchResults = $derived<EmojiEntry[]>(
		searchQuery.trim().length < 1
			? []
			: EMOJI_CATEGORIES.flatMap((cat) =>
					cat.emojis.filter((e) => e.name.toLowerCase().includes(searchQuery.toLowerCase()))
				).slice(0, 60)
	);

	const recentEmojis = $derived<EmojiEntry[]>(
		recentState.value
			.map((emoji) => {
				const all = EMOJI_CATEGORIES.flatMap((c) => c.emojis);
				const found = all.find((e) => e.emoji === emoji);
				return found ?? { emoji, name: 'recent' };
			})
			.slice(0, MAX_RECENT)
	);

	const activeCategory = $derived(
		EMOJI_CATEGORIES.find((c) => c.id === activeCategoryId) ?? EMOJI_CATEGORIES[0]
	);

	function pickEmoji(emoji: string) {
		const prev = recentState.value.filter((e) => e !== emoji);
		recentState.value = [emoji, ...prev].slice(0, MAX_RECENT);
		onpick(emoji);
	}

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (containerEl && !containerEl.contains(target)) {
			onclose();
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}

	function selectCategory(id: string) {
		activeCategoryId = id;
		searchQuery = '';
		if (gridEl) gridEl.scrollTop = 0;
	}
</script>

<svelte:document onclick={handleClickOutside} onkeydown={handleKeydown} />

<div class="emoji-picker" bind:this={containerEl} role="dialog" aria-label="Emoji picker">
	<!-- Search -->
	<div class="search-row">
		<svg class="search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
			<circle cx="11" cy="11" r="8" />
			<path stroke-linecap="round" d="m21 21-4.3-4.3" />
		</svg>
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search emoji..."
			class="search-input"
			aria-label="Search emoji"
		/>
		{#if searchQuery}
			<button class="search-clear" onclick={() => { searchQuery = ''; }} aria-label="Clear search">
				<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	<!-- Category tabs -->
	{#if !searchQuery}
		<div class="category-tabs" role="tablist" aria-label="Emoji categories">
			{#each EMOJI_CATEGORIES as cat (cat.id)}
				<button
					class="cat-tab"
					class:active={activeCategoryId === cat.id}
					role="tab"
					aria-selected={activeCategoryId === cat.id}
					aria-label={cat.label}
					title={cat.label}
					onclick={() => selectCategory(cat.id)}
				>
					{cat.icon}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Emoji grid -->
	<div class="emoji-grid-wrap" bind:this={gridEl}>
		{#if searchQuery}
			{#if searchResults.length === 0}
				<p class="empty-msg">No emoji found for "{searchQuery}"</p>
			{:else}
				<div class="emoji-grid">
					{#each searchResults as entry (entry.emoji + entry.name)}
						<button
							class="emoji-btn"
							title={entry.name}
							aria-label={entry.name}
							onclick={() => pickEmoji(entry.emoji)}
						>
							{entry.emoji}
						</button>
					{/each}
				</div>
			{/if}
		{:else}
			{#if recentEmojis.length > 0}
				<p class="section-label">Recently used</p>
				<div class="emoji-grid">
					{#each recentEmojis as entry (entry.emoji)}
						<button
							class="emoji-btn"
							title={entry.name}
							aria-label={entry.name}
							onclick={() => pickEmoji(entry.emoji)}
						>
							{entry.emoji}
						</button>
					{/each}
				</div>
				<div class="section-divider"></div>
			{/if}
			<p class="section-label">{activeCategory.label}</p>
			<div class="emoji-grid">
				{#each activeCategory.emojis as entry (entry.emoji + entry.name)}
					<button
						class="emoji-btn"
						title={entry.name}
						aria-label={entry.name}
						onclick={() => pickEmoji(entry.emoji)}
					>
						{entry.emoji}
					</button>
				{/each}
			</div>
		{/if}
	</div>
</div>

<style>
	.emoji-picker {
		position: absolute;
		bottom: calc(100% + 8px);
		right: 0;
		width: 320px;
		max-height: 360px;
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
		width: 14px;
		height: 14px;
		color: var(--color-text-dim);
		opacity: 0.5;
		pointer-events: none;
		/* correct for padding-top of row */
		margin-top: 1px;
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

	/* Category tabs */
	.category-tabs {
		display: flex;
		align-items: center;
		padding: 4px 8px;
		gap: 2px;
		border-bottom: 1px solid var(--glass-border);
		flex-shrink: 0;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.category-tabs::-webkit-scrollbar {
		display: none;
	}

	.cat-tab {
		width: 30px;
		height: 30px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 16px;
		flex-shrink: 0;
		transition: background 0.12s, transform 0.12s;
		opacity: 0.65;
	}

	.cat-tab:hover {
		background: color-mix(in srgb, var(--color-text) 8%, transparent);
		opacity: 1;
		transform: scale(1.1);
	}

	.cat-tab.active {
		background: color-mix(in srgb, var(--color-primary) 18%, transparent);
		opacity: 1;
	}

	/* Grid scroll area */
	.emoji-grid-wrap {
		flex: 1;
		overflow-y: auto;
		padding: 8px;
		scrollbar-width: thin;
		scrollbar-color: var(--glass-border) transparent;
	}

	.emoji-grid-wrap::-webkit-scrollbar {
		width: 4px;
	}

	.emoji-grid-wrap::-webkit-scrollbar-track {
		background: transparent;
	}

	.emoji-grid-wrap::-webkit-scrollbar-thumb {
		background: var(--glass-border);
		border-radius: 2px;
	}

	.section-label {
		font-size: 10px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-dim);
		opacity: 0.6;
		padding: 4px 2px 6px;
	}

	.section-divider {
		height: 1px;
		background: var(--glass-border);
		margin: 6px 0 8px;
	}

	.emoji-grid {
		display: grid;
		grid-template-columns: repeat(8, 1fr);
		gap: 2px;
	}

	.emoji-btn {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		transition: background 0.1s, transform 0.1s;
		line-height: 1;
	}

	.emoji-btn:hover {
		background: color-mix(in srgb, var(--color-text) 10%, transparent);
		transform: scale(1.2);
	}

	.emoji-btn:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 1px;
	}

	.empty-msg {
		font-size: 13px;
		color: var(--color-text-dim);
		text-align: center;
		padding: 24px 8px;
		opacity: 0.6;
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
		.emoji-picker {
			animation: none !important;
		}

		.emoji-btn,
		.cat-tab {
			transition: background 0.1s !important;
			transform: none !important;
		}

		.emoji-btn:hover,
		.cat-tab:hover {
			transform: none !important;
		}
	}
</style>
