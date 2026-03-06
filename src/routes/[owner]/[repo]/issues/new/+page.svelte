<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { issues, labels as labelsApi, milestones as milestonesApi } from '$lib/services/api';
	import { toastStore } from '$lib/stores/toast.svelte';
	import type { Label, Milestone } from '$lib/types/issue';
	import { onMount } from 'svelte';
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

	onMount(async () => {
		try {
			const [l, m] = await Promise.all([
				labelsApi.list(owner, repoName),
				milestonesApi.list(owner, repoName)
			]);
			repoLabels = l;
			repoMilestones = m.filter(ms => ms.state === 'open');
		} catch {
			// ignore
		}
	});

	function toggleLabel(id: number) {
		if (selectedLabels.includes(id)) {
			selectedLabels = selectedLabels.filter(l => l !== id);
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
			toastStore.success('Issue created');
			goto(`/${owner}/${repoName}/issues/${result.number}`);
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to create issue');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-5 content-reveal">
	<div class="flex items-center gap-2 text-sm page-header">
		<a href="/{owner}/{repoName}/issues" class="animated-link font-medium" style="color: var(--color-primary);">Issues</a>
		<svg class="w-3 h-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
		<h2 class="font-bold" style="color: var(--color-text);">New Issue</h2>
	</div>

	<form onsubmit={handleSubmit} class="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-6">
		<!-- Main form -->
		<div class="flex flex-col gap-4">
			<div class="card p-5 card-animate stagger-1">
				<label for="issue-title" class="section-title mb-2 block">Title</label>
				<input
					id="issue-title"
					type="text"
					bind:value={title}
					placeholder="Issue title"
					class="w-full px-4 py-2.5 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
					style="border-color: var(--color-border); color: var(--color-text);"
					required
				/>
			</div>

			<div class="card p-5 card-animate stagger-2">
				<div class="flex items-center justify-between mb-2">
					<label for="issue-body" class="section-title">Description</label>
					<div class="flex items-center gap-1 glass-subtle rounded-lg p-0.5">
						<button
							type="button"
							class="px-2.5 py-1 text-[0.625rem] rounded-md transition-all duration-200"
							style="
								color: {!previewMode ? 'var(--color-primary)' : 'var(--color-text-dim)'};
								background: {!previewMode ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'};
								font-weight: {!previewMode ? '600' : '400'};
							"
							onclick={() => { previewMode = false; }}
						>Write</button>
						<button
							type="button"
							class="px-2.5 py-1 text-[0.625rem] rounded-md transition-all duration-200"
							style="
								color: {previewMode ? 'var(--color-primary)' : 'var(--color-text-dim)'};
								background: {previewMode ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'};
								font-weight: {previewMode ? '600' : '400'};
							"
							onclick={() => { previewMode = true; }}
						>Preview</button>
					</div>
				</div>

				{#if previewMode}
					<div class="min-h-[200px] px-4 py-3 rounded-xl animate-fade-up-sm" style="border: 1px solid var(--color-border);">
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
						rows="10"
						class="w-full px-4 py-3 text-sm rounded-xl border bg-transparent font-mono transition-all duration-200 focus:border-[var(--color-primary)] resize-y"
						style="border-color: var(--color-border); color: var(--color-text);"
					></textarea>
				{/if}
			</div>

			<div class="card-animate stagger-3">
				<button
					type="submit"
					disabled={submitting || !title.trim()}
					class="btn-glow flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
					{submitting ? 'Submitting...' : 'Submit new issue'}
				</button>
			</div>
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-4">
			<!-- Labels -->
			{#if repoLabels.length > 0}
				<div class="card p-4 sidebar-animate" style="animation-delay: 0.15s;">
					<h3 class="section-title mb-3">Labels</h3>
					<div class="flex flex-col gap-1">
						{#each repoLabels as label}
							<button
								type="button"
								class="flex items-center gap-2 text-xs px-2.5 py-2 rounded-lg w-full text-left hover-slide transition-all duration-200"
								style="color: var(--color-text); background: {selectedLabels.includes(label.id) ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent'};"
								onclick={() => toggleLabel(label.id)}
							>
								<span class="w-3 h-3 rounded-full shrink-0 transition-transform duration-200" style="background-color: {label.color}; {selectedLabels.includes(label.id) ? 'transform: scale(1.2);' : ''}"></span>
								<span class="flex-1">{label.name}</span>
								{#if selectedLabels.includes(label.id)}
									<svg class="w-3.5 h-3.5 shrink-0" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
								{/if}
							</button>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Milestone -->
			{#if repoMilestones.length > 0}
				<div class="card p-4 sidebar-animate" style="animation-delay: 0.25s;">
					<h3 class="section-title mb-3">Milestone</h3>
					<select
						bind:value={selectedMilestone}
						class="w-full px-2.5 py-2 text-xs rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
						style="border-color: var(--color-border); color: var(--color-text);"
					>
						<option value={undefined}>None</option>
						{#each repoMilestones as m}
							<option value={m.id}>{m.title}</option>
						{/each}
					</select>
				</div>
			{/if}

			<!-- Assignee -->
			<div class="card p-4 sidebar-animate" style="animation-delay: 0.35s;">
				<h3 class="section-title mb-3">Assignee</h3>
				<input
					type="text"
					bind:value={assignee}
					placeholder="Username"
					class="w-full px-2.5 py-2 text-xs rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
					style="border-color: var(--color-border); color: var(--color-text);"
				/>
			</div>
		</div>
	</form>
</div>
