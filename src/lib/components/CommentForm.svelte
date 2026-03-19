<script lang="ts">
	let { onSubmit }: { onSubmit: (body: string) => Promise<void> } = $props();

	let body = $state('');
	let submitting = $state(false);

	async function handleSubmit(e?: Event) {
		if (e) e.preventDefault();
		if (!body.trim() || submitting) return;
		submitting = true;
		try {
			await onSubmit(body.trim());
			body = '';
		} finally {
			submitting = false;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSubmit();
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-3">
	<textarea
		bind:value={body}
		onkeydown={handleKeydown}
		placeholder="Write a comment..."
		rows={4}
		class="w-full px-4 py-3 text-sm rounded-xl border resize-y bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
		style="border-color: var(--glass-border); color: var(--color-text);"
	></textarea>
	<div class="flex items-center justify-between gap-3">
		<span class="text-[0.625rem]" style="color: var(--color-text-dim); opacity: 0.6;">
			Markdown supported · Ctrl+Enter to submit
		</span>
		<button
			type="submit"
			disabled={submitting || !body.trim()}
			class="btn-glow px-5 py-2 text-sm font-semibold rounded-xl text-white transition-all duration-200 press-scale disabled:opacity-40 disabled:pointer-events-none"
			style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
		>
			{submitting ? 'Commenting...' : 'Comment'}
		</button>
	</div>
</form>
