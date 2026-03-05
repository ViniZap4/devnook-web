<script lang="ts">
	import type { IssueComment } from '$lib/types/issue';
	import RelativeTime from './RelativeTime.svelte';
	import MarkdownRenderer from './MarkdownRenderer.svelte';

	let {
		comment,
		currentUser = '',
		onEdit,
		onDelete
	}: {
		comment: IssueComment;
		currentUser?: string;
		onEdit?: (id: number, body: string) => Promise<void>;
		onDelete?: (id: number) => Promise<void>;
	} = $props();

	let editing = $state(false);
	let editBody = $state('');
	let saving = $state(false);
	let confirmDelete = $state(false);
	let deleting = $state(false);

	const canModify = $derived(currentUser === comment.author && (onEdit || onDelete));

	async function handleSave() {
		if (!editBody.trim() || !onEdit) return;
		saving = true;
		try {
			await onEdit(comment.id, editBody.trim());
			editing = false;
		} catch {
			// ignore
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!onDelete) return;
		deleting = true;
		try {
			await onDelete(comment.id);
		} catch {
			deleting = false;
		}
	}
</script>

<div class="rounded-lg border border-[var(--color-border)] overflow-hidden">
	<div class="flex items-center gap-2 px-4 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
		<span class="text-sm text-[var(--color-text)] font-medium">{comment.author}</span>
		<span class="text-xs text-[var(--color-text)] opacity-40">
			commented <RelativeTime date={comment.created_at} />
		</span>
		{#if comment.updated_at && comment.updated_at !== comment.created_at}
			<span class="text-xs text-[var(--color-text)] opacity-30">· edited</span>
		{/if}
		{#if canModify}
			<div class="ml-auto flex items-center gap-2">
				{#if onEdit && !editing}
					<button
						class="text-xs hover:underline"
						style="color: var(--color-text-dim);"
						onclick={() => { editBody = comment.body; editing = true; confirmDelete = false; }}
					>Edit</button>
				{/if}
				{#if onDelete}
					{#if confirmDelete}
						<button
							class="text-xs font-medium"
							style="color: var(--color-error);"
							onclick={handleDelete}
							disabled={deleting}
						>{deleting ? 'Deleting...' : 'Confirm delete'}</button>
						<button
							class="text-xs"
							style="color: var(--color-text-dim);"
							onclick={() => { confirmDelete = false; }}
						>Cancel</button>
					{:else}
						<button
							class="text-xs hover:underline"
							style="color: var(--color-text-dim);"
							onclick={() => { confirmDelete = true; editing = false; }}
						>Delete</button>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
	{#if editing}
		<div class="p-4 flex flex-col gap-2">
			<textarea
				bind:value={editBody}
				rows={4}
				class="w-full px-3 py-2 text-sm rounded-lg border resize-y"
				style="border-color: var(--color-border); background-color: var(--color-surface); color: var(--color-text);"
			></textarea>
			<div class="flex items-center gap-2">
				<button
					onclick={handleSave}
					disabled={saving || !editBody.trim()}
					class="px-3 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-40"
					style="background-color: var(--color-primary);"
				>{saving ? 'Saving...' : 'Update comment'}</button>
				<button
					onclick={() => { editing = false; }}
					class="px-3 py-1.5 text-xs rounded-lg"
					style="color: var(--color-text-dim);"
				>Cancel</button>
			</div>
		</div>
	{:else}
		<div class="p-4 text-[var(--color-text)]">
			<MarkdownRenderer content={comment.body} />
		</div>
	{/if}
</div>
