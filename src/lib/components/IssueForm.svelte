<script lang="ts">
	let { onSubmit }: { onSubmit: (title: string, body: string) => Promise<void> } = $props();

	let title = $state('');
	let body = $state('');
	let submitting = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;
		submitting = true;
		try {
			await onSubmit(title.trim(), body);
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4 max-w-2xl">
	<div>
		<label for="issue-title" class="block text-sm font-medium text-[var(--color-text)] mb-2">Title</label>
		<input
			id="issue-title"
			type="text"
			bind:value={title}
			placeholder="Issue title"
			class="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 focus:border-[var(--color-primary)]"
			required
		/>
	</div>

	<div>
		<label for="issue-body" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Description <span class="opacity-40">(Markdown supported)</span>
		</label>
		<textarea
			id="issue-body"
			bind:value={body}
			placeholder="Describe the issue..."
			rows="8"
			class="w-full px-4 py-3 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:opacity-30 resize-y focus:border-[var(--color-primary)]"
		></textarea>
	</div>

	<div>
		<button
			type="submit"
			disabled={submitting || !title.trim()}
			class="px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-opacity disabled:opacity-40"
			style="background-color: var(--color-primary);"
		>
			{submitting ? 'Submitting...' : 'Submit new issue'}
		</button>
	</div>
</form>
