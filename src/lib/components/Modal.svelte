<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		open = false,
		title = '',
		onclose,
		children
	}: {
		open: boolean;
		title?: string;
		onclose: () => void;
		children: Snippet;
	} = $props();

	let overlayEl = $state<HTMLDivElement | null>(null);

	function handleOverlayClick(e: MouseEvent) {
		if (e.target === overlayEl) onclose();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		bind:this={overlayEl}
		class="fixed inset-0 z-50 flex items-center justify-center modal-overlay"
		onclick={handleOverlayClick}
	>
		<div class="modal-card modal-content-enter">
			<div class="flex items-center justify-between mb-5">
				<h2 class="text-[var(--color-text)]">{title}</h2>
				<button
					class="close-btn"
					onclick={onclose}
					aria-label="Close modal"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none">
						<path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
					</svg>
				</button>
			</div>
			{@render children()}
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(8px);
		animation: modal-overlay-in 0.25s ease both;
	}

	.modal-content-enter {
		animation: modal-content-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
	}

	.modal-card {
		width: 100%;
		max-width: 26rem;
		margin: 1rem;
		padding: 1.5rem;
		border-radius: 1.25rem;
		background-color: var(--color-background);
		border: 1px solid var(--color-surface-hover);
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5), 0 0 0 1px var(--color-surface) inset;
		backdrop-filter: blur(32px) saturate(1.4);
	}
	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border-radius: 0.5rem;
		color: var(--color-text);
		opacity: 0.4;
		transition: opacity 0.15s, background-color 0.15s, transform 0.15s;
	}
	.close-btn:hover {
		opacity: 1;
		background-color: var(--color-surface-hover);
		transform: rotate(90deg);
	}
</style>
