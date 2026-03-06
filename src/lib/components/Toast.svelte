<script lang="ts">
	import { toastStore } from '$lib/stores/toast.svelte';
</script>

{#if toastStore.items.length > 0}
	<div class="toast-container">
		{#each toastStore.items as toast (toast.id)}
			<div
				class="toast flex items-center gap-3 px-4 py-3 rounded-xl glass-strong text-sm"
				style="min-width: 280px; max-width: 400px; color: var(--color-text);"
				role="alert"
			>
				{#if toast.type === 'success'}
					<svg class="w-4 h-4 shrink-0" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
				{:else if toast.type === 'error'}
					<svg class="w-4 h-4 shrink-0" style="color: var(--color-error);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" d="M15 9l-6 6M9 9l6 6" /></svg>
				{:else if toast.type === 'warning'}
					<svg class="w-4 h-4 shrink-0" style="color: var(--color-warning);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
				{:else}
					<svg class="w-4 h-4 shrink-0" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path stroke-linecap="round" d="M12 16v-4m0-4h.01" /></svg>
				{/if}
				<span class="flex-1">{toast.message}</span>
				<button
					class="shrink-0 opacity-40 hover:opacity-100 transition-opacity"
					onclick={() => toastStore.dismiss(toast.id)}
					aria-label="Dismiss"
				>
					<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
				</button>
			</div>
		{/each}
	</div>
{/if}
