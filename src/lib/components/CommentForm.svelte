<script lang="ts">
	let { onSubmit }: { onSubmit: (body: string) => Promise<void> } = $props();

	let body = $state('');
	let submitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!body.trim()) return;
		submitting = true;
		try {
			await onSubmit(body.trim());
			body = '';
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-3">
	<textarea
		bind:value={body}
		placeholder="Leave a comment..."
		rows="4"
		class="w-full px-4 py-3 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 resize-y focus:border-[var(--color-primary)]"
	></textarea>
	<div class="flex justify-end">
		<button
			type="submit"
			disabled={submitting || !body.trim()}
			class="px-4 py-2 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
			style="background-color: var(--color-primary);"
		>
			{submitting ? 'Commenting...' : 'Comment'}
		</button>
	</div>
</form>
