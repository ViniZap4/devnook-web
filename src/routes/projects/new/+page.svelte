<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { projects } from '$lib/services/api';
	import PageShell from '$lib/components/PageShell.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	onMount(() => {
		if (!userStore.isLoggedIn) { goto('/'); }
	});

	let name = $state('');
	let description = $state('');
	let methodology = $state<'kanban' | 'scrum' | 'scrumban' | 'xp' | 'waterfall' | 'custom'>('kanban');
	let visibility = $state<'private' | 'members' | 'public'>('private');
	let color = $state('#6366f1');
	let submitting = $state(false);

	const presetColors = [
		'#6366f1', // indigo
		'#06b6d4', // cyan
		'#10b981', // emerald
		'#f59e0b', // amber
		'#ef4444', // red
		'#ec4899', // pink
	];

	const methodologyOptions = [
		{ value: 'kanban',    label: 'Kanban',    desc: 'Continuous flow with columns' },
		{ value: 'scrum',     label: 'Scrum',     desc: 'Time-boxed sprints with velocity' },
		{ value: 'scrumban',  label: 'Scrumban',  desc: 'Kanban + Scrum hybrid' },
		{ value: 'xp',        label: 'XP',        desc: 'Extreme Programming practices' },
		{ value: 'waterfall', label: 'Waterfall',  desc: 'Sequential phase-based workflow' },
		{ value: 'custom',    label: 'Custom',    desc: 'Define your own workflow' },
	] as const;

	const visibilityOptions = [
		{ value: 'private', label: 'Private',       desc: 'Only you can see this project' },
		{ value: 'members', label: 'Members Only',  desc: 'Visible to project members' },
		{ value: 'public',  label: 'Public',        desc: 'Visible to everyone' },
	] as const;

	let nameError = $derived(name.trim().length === 0 && name.length > 0 ? 'Name is required' : '');
	let canSubmit = $derived(name.trim().length > 0 && !submitting);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		if (!canSubmit) return;

		submitting = true;
		try {
			const result = await projects.create({
				name: name.trim(),
				description: description.trim() || undefined,
				methodology,
				visibility,
				color,
			});
			toastStore.success('Project created successfully');
			goto(`/projects/${result.slug}/board`);
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to create project');
			submitting = false;
		}
	}
</script>

<PageShell width="narrow">
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div class="flex items-center gap-3 page-header">
			<a
				href="/projects"
				class="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-200"
				style="color: var(--color-text-dim);"
				onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
				onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = ''}
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
				</svg>
			</a>
			<div
				class="w-10 h-10 rounded-xl flex items-center justify-center"
				style="background: var(--color-primary-subtle);"
			>
				<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
			</div>
			<div>
				<h1 class="text-xl font-bold" style="color: var(--color-text);">New Project</h1>
				<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Set up your project workflow</p>
			</div>
		</div>

		<!-- Form -->
		<form onsubmit={handleSubmit} class="card p-6 flex flex-col gap-5 animate-fade-up-sm">

			<!-- Name -->
			<div>
				<label class="block text-xs font-semibold mb-1.5" style="color: var(--color-text);">
					Project name <span style="color: var(--color-error);">*</span>
				</label>
				<input
					type="text"
					bind:value={name}
					placeholder="My Awesome Project"
					required
					autofocus
					class="w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all duration-200 focus:border-[var(--color-primary)]"
					style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
				/>
				{#if nameError}
					<p class="text-xs mt-1" style="color: var(--color-error);">{nameError}</p>
				{/if}
			</div>

			<!-- Description -->
			<div>
				<label class="block text-xs font-semibold mb-1.5" style="color: var(--color-text);">
					Description <span class="font-normal" style="color: var(--color-text-dim);">(optional)</span>
				</label>
				<textarea
					bind:value={description}
					placeholder="What is this project about?"
					rows="3"
					class="w-full px-3 py-2.5 text-sm rounded-xl border outline-none transition-all duration-200 resize-none focus:border-[var(--color-primary)]"
					style="background: var(--color-surface); border-color: var(--glass-border); color: var(--color-text);"
				></textarea>
			</div>

			<!-- Methodology -->
			<div>
				<label class="block text-xs font-semibold mb-2" style="color: var(--color-text);">
					Methodology
				</label>
				<div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
					{#each methodologyOptions as opt}
						{@const isSelected = methodology === opt.value}
						<button
							type="button"
							onclick={() => methodology = opt.value}
							class="flex flex-col gap-0.5 p-3 rounded-xl border text-left transition-all duration-200"
							style="
								background: {isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)'};
								border-color: {isSelected ? 'var(--color-primary)' : 'var(--glass-border)'};
							"
						>
							<span class="text-xs font-semibold" style="color: {isSelected ? 'var(--color-primary)' : 'var(--color-text)'};">
								{opt.label}
							</span>
							<span class="text-[0.625rem] leading-snug" style="color: var(--color-text-dim);">
								{opt.desc}
							</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Visibility -->
			<div>
				<label class="block text-xs font-semibold mb-2" style="color: var(--color-text);">
					Visibility
				</label>
				<div class="flex flex-col gap-2">
					{#each visibilityOptions as opt}
						{@const isSelected = visibility === opt.value}
						<!-- svelte-ignore a11y_no_noninteractive_element_to_interactive_role -->
						<label
							class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200"
							style="
								background: {isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)'};
								border-color: {isSelected ? 'var(--color-primary)' : 'var(--glass-border)'};
							"
						>
							<input
								type="radio"
								name="visibility"
								value={opt.value}
								bind:group={visibility}
								class="sr-only"
							/>
							<div
								class="w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors duration-200"
								style="border-color: {isSelected ? 'var(--color-primary)' : 'var(--color-text-dim)'};"
							>
								{#if isSelected}
									<div class="w-2 h-2 rounded-full" style="background: var(--color-primary);"></div>
								{/if}
							</div>
							<div class="min-w-0">
								<p class="text-xs font-semibold" style="color: {isSelected ? 'var(--color-primary)' : 'var(--color-text)'};">
									{opt.label}
								</p>
								<p class="text-[0.625rem]" style="color: var(--color-text-dim);">{opt.desc}</p>
							</div>
						</label>
					{/each}
				</div>
			</div>

			<!-- Color -->
			<div>
				<label class="block text-xs font-semibold mb-2" style="color: var(--color-text);">
					Color
				</label>
				<div class="flex items-center gap-3">
					{#each presetColors as preset}
						<button
							type="button"
							onclick={() => color = preset}
							class="w-7 h-7 rounded-full transition-all duration-200 focus:outline-none"
							style="
								background: {preset};
								box-shadow: {color === preset ? `0 0 0 3px var(--color-bg), 0 0 0 5px ${preset}` : 'none'};
								transform: {color === preset ? 'scale(1.15)' : 'scale(1)'};
							"
							title={preset}
							aria-label="Select color {preset}"
						></button>
					{/each}

					<!-- Custom color input -->
					<label class="relative flex items-center justify-center w-7 h-7 rounded-full border-2 border-dashed cursor-pointer transition-all duration-200 hover:scale-110" style="border-color: var(--color-text-dim);" title="Custom color">
						<svg class="w-3 h-3" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						<input
							type="color"
							bind:value={color}
							class="absolute inset-0 opacity-0 cursor-pointer w-full h-full rounded-full"
							aria-label="Custom color picker"
						/>
					</label>

					<!-- Current color preview -->
					<div class="flex items-center gap-1.5 ml-1">
						<div class="w-5 h-5 rounded-full" style="background: {color};"></div>
						<span class="text-xs font-mono" style="color: var(--color-text-dim);">{color}</span>
					</div>
				</div>
			</div>

			<!-- Divider -->
			<div class="border-t" style="border-color: var(--glass-border);"></div>

			<!-- Actions -->
			<div class="flex items-center justify-end gap-3">
				<a
					href="/projects"
					class="px-4 py-2 text-sm rounded-xl transition-colors duration-200"
					style="color: var(--color-text-dim);"
				>
					Cancel
				</a>
				<button
					type="submit"
					disabled={!canSubmit}
					class="btn-glow flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
				>
					{#if submitting}
						<Spinner size="xs" />
						Creating...
					{:else}
						Create Project
					{/if}
				</button>
			</div>
		</form>
	</div>
</PageShell>
