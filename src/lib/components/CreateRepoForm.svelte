<script lang="ts">
	import { reposStore } from '$lib/stores/repos.svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';

	let name = $state('');
	let description = $state('');
	let isPrivate = $state(false);
	let defaultBranch = $state('main');
	let autoInit = $state(false);
	let gitignoreTemplate = $state('');
	let license = $state('');
	let error = $state('');
	let submitting = $state(false);

	const gitignoreOptions = ['None', 'Go', 'Node', 'Python', 'Rust', 'Java', 'Ruby', 'Swift'];
	const licenseOptions = ['None', 'MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-2-Clause', 'ISC', 'Unlicense'];

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (!name.trim()) return;
		error = '';
		submitting = true;
		try {
			await reposStore.create({
				name: name.trim(),
				description,
				is_private: isPrivate,
				default_branch: defaultBranch.trim() || 'main',
				auto_init: autoInit,
				gitignore_template: gitignoreTemplate || undefined,
				license: license || undefined
			});
			toastStore.success('Repository created successfully');
			goto(`/${userStore.user?.username}/${name.trim()}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create repository';
			toastStore.error(err instanceof Error ? err.message : 'Failed to create repository');
		} finally {
			submitting = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="space-y-5 max-w-lg">
	<!-- Repository name -->
	<div>
		<label for="repo-name" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Repository name
		</label>
		<input
			id="repo-name"
			type="text"
			bind:value={name}
			placeholder="my-project"
			class="w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 placeholder:opacity-30 focus:border-[var(--color-primary)]"
			style="border-color: var(--glass-border); background: #0f1629; color: var(--color-text);"
			required
		/>
	</div>

	<!-- Description -->
	<div>
		<label for="repo-desc" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Description <span class="opacity-40">(optional)</span>
		</label>
		<input
			id="repo-desc"
			type="text"
			bind:value={description}
			placeholder="A short description"
			class="w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 placeholder:opacity-30 focus:border-[var(--color-primary)]"
			style="border-color: var(--glass-border); background: #0f1629; color: var(--color-text);"
		/>
	</div>

	<!-- Separator -->
	<div class="border-t" style="border-color: var(--glass-border);"></div>

	<!-- Default branch -->
	<div>
		<label for="repo-branch" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Default branch
		</label>
		<input
			id="repo-branch"
			type="text"
			bind:value={defaultBranch}
			placeholder="main"
			class="w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 placeholder:opacity-30 focus:border-[var(--color-primary)]"
			style="border-color: var(--glass-border); background: #0f1629; color: var(--color-text);"
		/>
	</div>

	<!-- Visibility toggle -->
	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={() => { isPrivate = !isPrivate; }}
			class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {isPrivate ? 'bg-[var(--color-primary)]' : 'bg-[rgba(255,255,255,0.06)]'}"
			aria-label="Toggle repository visibility"
		>
			<span class="inline-block h-4 w-4 rounded-full bg-white transition-transform {isPrivate ? 'translate-x-6' : 'translate-x-1'}"></span>
		</button>
		<span class="text-sm text-[var(--color-text)]">{isPrivate ? 'Private' : 'Public'}</span>
	</div>

	<!-- Initialize with README toggle -->
	<div class="flex items-center gap-3">
		<button
			type="button"
			onclick={() => { autoInit = !autoInit; }}
			class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors {autoInit ? 'bg-[var(--color-primary)]' : 'bg-[rgba(255,255,255,0.06)]'}"
			aria-label="Toggle initialize with README"
		>
			<span class="inline-block h-4 w-4 rounded-full bg-white transition-transform {autoInit ? 'translate-x-6' : 'translate-x-1'}"></span>
		</button>
		<span class="text-sm text-[var(--color-text)]">Initialize with README</span>
	</div>

	<!-- Separator -->
	<div class="border-t" style="border-color: var(--glass-border);"></div>

	<!-- .gitignore template -->
	<div>
		<label for="repo-gitignore" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			Add .gitignore <span class="opacity-40">(optional)</span>
		</label>
		<div class="relative">
			<select
				id="repo-gitignore"
				bind:value={gitignoreTemplate}
				class="w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 appearance-none focus:border-[var(--color-primary)]"
				style="border-color: var(--glass-border); background: #0f1629; color: var(--color-text);"
			>
				{#each gitignoreOptions as option}
					<option value={option === 'None' ? '' : option}>{option}</option>
				{/each}
			</select>
			<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
				<svg class="h-4 w-4 opacity-40" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>
	</div>

	<!-- License -->
	<div>
		<label for="repo-license" class="block text-sm font-medium text-[var(--color-text)] mb-2">
			License <span class="opacity-40">(optional)</span>
		</label>
		<div class="relative">
			<select
				id="repo-license"
				bind:value={license}
				class="w-full px-3 py-2.5 text-sm rounded-xl border transition-all duration-200 appearance-none focus:border-[var(--color-primary)]"
				style="border-color: var(--glass-border); background: #0f1629; color: var(--color-text);"
			>
				{#each licenseOptions as option}
					<option value={option === 'None' ? '' : option}>{option}</option>
				{/each}
			</select>
			<div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
				<svg class="h-4 w-4 opacity-40" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
				</svg>
			</div>
		</div>
	</div>

	{#if error}
		<p class="text-sm" style="color: var(--color-error);">{error}</p>
	{/if}

	<button
		type="submit"
		disabled={submitting || !name.trim()}
		class="px-6 py-2.5 text-sm font-medium rounded-xl text-white transition-all duration-200 hover:brightness-110 disabled:opacity-40"
		style="background: var(--color-primary);"
	>
		{submitting ? 'Creating...' : 'Create repository'}
	</button>
</form>
