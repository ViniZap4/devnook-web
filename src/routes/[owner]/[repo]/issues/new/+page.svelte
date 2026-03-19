<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { issues, labels as labelsApi, milestones as milestonesApi } from '$lib/services/api';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Label, Milestone } from '$lib/types/issue';
	import MarkdownRenderer from '$lib/components/MarkdownRenderer.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let title = $state('');
	let body = $state('');
	let submitting = $state(false);
	let previewMode = $state(false);

	let repoLabels = $state<Label[]>([]);
	let repoMilestones = $state<Milestone[]>([]);
	let selectedLabels = $state<number[]>([]);
	let selectedMilestone = $state<number | undefined>(undefined);
	let assignee = $state('');

	let fetchId = 0;

	$effect(() => {
		const _owner = owner;
		const _repo = repoName;
		const id = ++fetchId;

		Promise.all([
			labelsApi.list(_owner, _repo),
			milestonesApi.list(_owner, _repo)
		]).then(([l, m]) => {
			if (id !== fetchId) return;
			repoLabels = l;
			repoMilestones = m.filter((ms) => ms.state === 'open');
		}).catch(() => {});
	});

	function toggleLabel(id: number) {
		if (selectedLabels.includes(id)) {
			selectedLabels = selectedLabels.filter((l) => l !== id);
		} else {
			selectedLabels = [...selectedLabels, id];
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!title.trim()) return;
		submitting = true;
		try {
			const result = await issues.create(owner, repoName, {
				title: title.trim(),
				body,
				label_ids: selectedLabels.length > 0 ? selectedLabels : undefined,
				milestone_id: selectedMilestone || undefined,
				assignee_id: undefined
			});
			toastStore.success('Issue created successfully');
			goto(`/${owner}/${repoName}/issues/${result.number}`);
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to create issue');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-5 content-reveal">
	<!-- Breadcrumb -->
	<div class="flex items-center gap-2 text-sm page-header">
		<a href="/{owner}/{repoName}/issues" class="animated-link font-medium" style="color: var(--color-primary);">Issues</a>
		<svg class="w-3 h-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
		<h2 class="font-bold" style="color: var(--color-text);">New Issue</h2>
	</div>

	<form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
		<!-- Main form -->
		<div class="flex flex-col gap-4">
			<!-- Title -->
			<div class="card p-5 card-animate stagger-1">
				<label for="issue-title" class="section-title mb-2 block">Title <span style="color: var(--color-error);">*</span></label>
				<input
					id="issue-title"
					type="text"
					bind:value={title}
					placeholder="Issue title"
					class="w-full px-4 py-2.5 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
					style="border-color: var(--glass-border); color: var(--color-text);"
					required
				/>
			</div>

			<!-- Body / Description -->
			<div class="card p-5 card-animate stagger-2">
				<div class="flex items-center justify-between mb-2">
					<label for="issue-body" class="section-title">Description</label>
					<div class="flex items-center gap-1 glass-subtle rounded-lg p-0.5">
						<button
							type="button"
							class="px-2.5 py-1 text-[0.625rem] rounded-md transition-all duration-200"
							style="
								color: {!previewMode ? 'var(--color-primary)' : 'var(--color-text-dim)'};
								background: {!previewMode ? 'var(--color-primary-subtle)' : 'transparent'};
								font-weight: {!previewMode ? '600' : '400'};
							"
							onclick={() => { previewMode = false; }}
						>Write</button>
						<button
							type="button"
							class="px-2.5 py-1 text-[0.625rem] rounded-md transition-all duration-200"
							style="
								color: {previewMode ? 'var(--color-primary)' : 'var(--color-text-dim)'};
								background: {previewMode ? 'var(--color-primary-subtle)' : 'transparent'};
								font-weight: {previewMode ? '600' : '400'};
							"
							onclick={() => { previewMode = true; }}
						>Preview</button>
					</div>
				</div>

				{#if previewMode}
					<div class="card min-h-[200px] px-4 py-3 animate-fade-up-sm">
						{#if body.trim()}
							<MarkdownRenderer content={body} />
						{:else}
							<p class="text-sm italic" style="color: var(--color-text-dim);">Nothing to preview</p>
						{/if}
					</div>
				{:else}
					<textarea
						id="issue-body"
						bind:value={body}
						placeholder="Describe the issue... (Markdown supported)"
						rows="12"
						class="w-full px-4 py-3 text-sm rounded-xl border bg-transparent font-mono transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none resize-y"
						style="border-color: var(--glass-border); color: var(--color-text);"
					></textarea>
					<p class="mt-1.5 text-xs" style="color: var(--color-text-dim);">Markdown is supported</p>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex items-center gap-3 card-animate stagger-3">
				<button
					type="submit"
					disabled={submitting || !title.trim()}
					class="btn-glow flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
				>
					{#if submitting}
						<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
						Submitting...
					{:else}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
						Submit new issue
					{/if}
				</button>
				<a
					href="/{owner}/{repoName}/issues"
					class="px-4 py-2.5 text-sm rounded-xl glass-subtle transition-all hover:scale-[1.02] active:scale-[0.98]"
					style="color: var(--color-text-dim);"
				>
					Cancel
				</a>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-4">
			<!-- Labels -->
			<div class="card p-4 sidebar-animate" style="animation-delay: 0.1s;">
				<h3 class="section-title mb-3">Labels</h3>
				{#if repoLabels.length === 0}
					<p class="text-xs" style="color: var(--color-text-dim);">No labels defined</p>
				{:else}
					<div class="flex flex-col gap-1">
						{#each repoLabels as label}
							<button
								type="button"
								class="flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg w-full text-left transition-all duration-200 press-scale"
								style="color: var(--color-text); background: {selectedLabels.includes(label.id) ? 'var(--color-primary-subtle)' : 'transparent'};"
								onclick={() => toggleLabel(label.id)}
							>
								<span
									class="w-3 h-3 rounded-full shrink-0 transition-transform duration-200"
									style="background-color: {label.color}; {selectedLabels.includes(label.id) ? 'transform: scale(1.25);' : ''}"
								></span>
								<span class="flex-1 truncate">{label.name}</span>
								{#if selectedLabels.includes(label.id)}
									<svg class="w-3.5 h-3.5 shrink-0" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
								{/if}
							</button>
						{/each}
					</div>
					{#if selectedLabels.length > 0}
						<div class="mt-3 flex flex-wrap gap-1.5">
							{#each repoLabels.filter(l => selectedLabels.includes(l.id)) as label}
								<span
									class="text-[0.625rem] px-2 py-0.5 rounded-full font-medium"
									style="background-color: color-mix(in srgb, {label.color} 10%, var(--color-surface)); color: {label.color}; border: 1px solid color-mix(in srgb, {label.color} 19%, var(--color-surface));"
								>{label.name}</span>
							{/each}
						</div>
					{/if}
				{/if}
			</div>

			<!-- Milestone -->
			<div class="card p-4 sidebar-animate" style="animation-delay: 0.2s;">
				<h3 class="section-title mb-3">Milestone</h3>
				{#if repoMilestones.length === 0}
					<p class="text-xs" style="color: var(--color-text-dim);">No open milestones</p>
				{:else}
					<select
						bind:value={selectedMilestone}
						class="w-full px-2.5 py-2 text-xs rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
						style="border-color: var(--glass-border); color: var(--color-text);"
					>
						<option value={undefined}>None</option>
						{#each repoMilestones as m}
							<option value={m.id}>{m.title}</option>
						{/each}
					</select>
				{/if}
			</div>

			<!-- Assignee -->
			<div class="card p-4 sidebar-animate" style="animation-delay: 0.3s;">
				<h3 class="section-title mb-3">Assignee</h3>
				<input
					type="text"
					bind:value={assignee}
					placeholder="Username"
					class="w-full px-2.5 py-2 text-xs rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)] focus:outline-none"
					style="border-color: var(--glass-border); color: var(--color-text);"
				/>
				<p class="mt-1.5 text-[0.6rem]" style="color: var(--color-text-dim);">Enter a collaborator's username</p>
			</div>
		</div>
	</form>
</div>
