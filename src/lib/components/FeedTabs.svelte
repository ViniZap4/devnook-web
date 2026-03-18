<script lang="ts">
	import SlidingIndicator from './SlidingIndicator.svelte';

	let {
		activeTab = $bindable(''),
		tabs = []
	}: {
		activeTab: string;
		tabs: { id: string; label: string }[];
	} = $props();

	let containerEl = $state<HTMLElement>();

	let activeIndex = $derived(tabs.findIndex(t => t.id === activeTab));
</script>

<div bind:this={containerEl} class="feed-tabs">
	<SlidingIndicator
		{containerEl}
		{activeIndex}
		selector="[data-feed-tab]"
		direction="horizontal"
		class="feed-tab-indicator"
	/>

	{#each tabs as tab}
		<button
			data-feed-tab
			class="feed-tab"
			class:active={activeTab === tab.id}
			onclick={() => { activeTab = tab.id; }}
		>
			{tab.label}
		</button>
	{/each}
</div>

<style>
	.feed-tabs {
		display: flex;
		position: relative;
	}

	.feed-tab {
		flex: 1;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 14px;
		font-weight: 500;
		color: var(--color-text-dim);
		transition: color 0.15s;
		position: relative;
		z-index: 1;
	}

	.feed-tab:hover:not(.active) {
		color: var(--color-text);
	}

	.feed-tab.active {
		color: var(--color-primary);
	}

	:global(.feed-tab-indicator) {
		height: 2px !important;
		top: auto !important;
		bottom: 0 !important;
		background: var(--color-primary) !important;
		border-radius: 1px !important;
	}
</style>
