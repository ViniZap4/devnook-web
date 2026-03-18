<script lang="ts">
	import Modal from '$lib/components/Modal.svelte';

	let {
		open = false,
		onconfirm,
		onclose
	}: {
		open: boolean;
		onconfirm: () => void;
		onclose: () => void;
	} = $props();
</script>

<Modal {open} title="" onclose={onclose}>
	<div class="body">
		<svg class="w-10 h-10 mx-auto mb-3" style="color: var(--color-error); opacity: 0.8;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
			<path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
		</svg>
		<h3 class="text-[16px] font-semibold mb-1" style="color: var(--color-text);">Delete message?</h3>
		<p class="text-[13px] mb-5" style="color: var(--color-text-dim);">This can't be undone.</p>
		<div class="flex gap-3 justify-center">
			<button class="btn-cancel" onclick={onclose}>Cancel</button>
			<button class="btn-delete" onclick={onconfirm}>Delete</button>
		</div>
	</div>
</Modal>

<style>
	.body { text-align: center; }
	.btn-cancel {
		padding: 8px 18px; border-radius: 8px; font-size: 13px; font-weight: 500;
		color: var(--color-text-dim); background: color-mix(in srgb, var(--color-text) 6%, transparent);
		border: 1px solid var(--color-border); transition: background 0.15s;
	}
	.btn-cancel:hover { background: color-mix(in srgb, var(--color-text) 10%, transparent); }
	.btn-delete {
		padding: 8px 20px; border-radius: 8px; font-size: 13px; font-weight: 500;
		color: white; background: var(--color-error); transition: background 0.15s;
	}
	.btn-delete:hover { background: color-mix(in srgb, var(--color-error) 85%, black); }
</style>
