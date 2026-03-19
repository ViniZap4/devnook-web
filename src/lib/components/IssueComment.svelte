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
			// ignore – parent shows toast
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

	function handleEditKeydown(e: KeyboardEvent) {
		if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
			e.preventDefault();
			handleSave();
		}
		if (e.key === 'Escape') {
			editing = false;
		}
	}
</script>

<div class="card overflow-hidden animate-fade-up-sm group">
	<!-- Comment header -->
	<div
		class="flex items-center gap-2 px-4 py-2.5 border-b"
		style="border-color: var(--glass-border); background: rgba(255,255,255,0.02);"
	>
		<!-- Avatar -->
		<a
			href="/{comment.author}"
			class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[0.55rem] font-bold transition-transform duration-200 hover:scale-110"
			style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); color: white;"
			title={comment.author}
		>
			{comment.author.charAt(0).toUpperCase()}
		</a>

		<!-- Author + time -->
		<a href="/{comment.author}" class="animated-link text-sm font-medium" style="color: var(--color-text);">
			{comment.author}
		</a>
		<span class="text-xs" style="color: var(--color-text-dim);">
			commented <RelativeTime date={comment.created_at} />
		</span>
		{#if comment.updated_at && comment.updated_at !== comment.created_at}
			<span class="text-xs" style="color: var(--color-text-dim); opacity: 0.5;">· edited</span>
		{/if}

		<!-- Actions (only for comment author, appear on hover) -->
		{#if canModify}
			<div class="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
				{#if onEdit && !editing}
					<button
						class="text-xs px-2.5 py-1 rounded-lg glass-subtle transition-all duration-200 press-scale"
						style="color: var(--color-text-dim);"
						onclick={() => { editBody = comment.body; editing = true; confirmDelete = false; }}
					>Edit</button>
				{/if}
				{#if onDelete}
					{#if confirmDelete}
						<button
							class="text-xs px-2.5 py-1 rounded-lg font-medium transition-all duration-200 press-scale"
							style="color: var(--color-error); background: var(--color-error-subtle);"
							onclick={handleDelete}
							disabled={deleting}
						>{deleting ? 'Deleting...' : 'Confirm'}</button>
						<button
							class="text-xs px-2.5 py-1 rounded-lg glass-subtle transition-all duration-200 press-scale"
							style="color: var(--color-text-dim);"
							onclick={() => { confirmDelete = false; }}
						>Cancel</button>
					{:else}
						<button
							class="text-xs px-2.5 py-1 rounded-lg glass-subtle transition-all duration-200 press-scale"
							style="color: var(--color-text-dim);"
							onclick={() => { confirmDelete = true; editing = false; }}
						>Delete</button>
					{/if}
				{/if}
			</div>
		{/if}
	</div>

	<!-- Body / edit area -->
	{#if editing}
		<div class="p-4 flex flex-col gap-3 animate-fade-up-sm">
			<textarea
				bind:value={editBody}
				rows={5}
				onkeydown={handleEditKeydown}
				class="w-full px-4 py-3 text-sm rounded-xl border resize-y bg-transparent font-mono transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
				style="border-color: var(--glass-border); color: var(--color-text);"
				placeholder="Write a comment..."
			></textarea>
			<div class="flex items-center gap-2">
				<button
					onclick={handleSave}
					disabled={saving || !editBody.trim()}
					class="btn-glow px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all duration-200 disabled:opacity-40"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
				>{saving ? 'Saving...' : 'Update comment'}</button>
				<button
					onclick={() => { editing = false; }}
					class="px-4 py-2 text-xs rounded-xl glass-subtle transition-all duration-200 press-scale"
					style="color: var(--color-text-dim);"
				>Cancel</button>
				<span class="text-[0.6rem] ml-auto" style="color: var(--color-text-dim); opacity: 0.6;">
					Ctrl+Enter to save · Esc to cancel
				</span>
			</div>
		</div>
	{:else}
		<div class="p-4" style="color: var(--color-text);">
			<MarkdownRenderer content={comment.body} />
		</div>
	{/if}
</div>
