<script lang="ts">
	import { page } from '$app/stores';
	import { repos } from '$lib/services/api';
	import type { CommitDetail } from '$lib/types/repository';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	const owner = $derived($page.params.owner!);
	const repo = $derived($page.params.repo!);
	const hash = $derived($page.params.hash!);

	let commit = $state<CommitDetail | null>(null);
	let loading = $state(true);
	let fetchId = 0;
	let collapsedFiles = $state<Record<string, boolean>>({});

	const totalAdditions = $derived(
		commit?.diff?.reduce((sum, file) =>
			sum + file.hunks.reduce((hSum, hunk) =>
				hSum + hunk.lines.filter(l => l.startsWith('+')).length, 0), 0) ?? 0
	);

	const totalDeletions = $derived(
		commit?.diff?.reduce((sum, file) =>
			sum + file.hunks.reduce((hSum, hunk) =>
				hSum + hunk.lines.filter(l => l.startsWith('-')).length, 0), 0) ?? 0
	);

	const filesChanged = $derived(commit?.diff?.length ?? 0);

	function toggleFile(filename: string) {
		collapsedFiles = { ...collapsedFiles, [filename]: !collapsedFiles[filename] };
	}

	function getFileName(file: { from_file: string; to_file: string }) {
		return file.to_file || file.from_file;
	}

	function getFileAdditions(file: { hunks: { lines: string[] }[] }) {
		return file.hunks.reduce((sum, hunk) => sum + hunk.lines.filter(l => l.startsWith('+')).length, 0);
	}

	function getFileDeletions(file: { hunks: { lines: string[] }[] }) {
		return file.hunks.reduce((sum, hunk) => sum + hunk.lines.filter(l => l.startsWith('-')).length, 0);
	}

	function scrollToFile(filename: string) {
		const el = document.getElementById(`diff-${filename}`);
		if (el) {
			// Make sure the file is expanded
			if (collapsedFiles[filename]) {
				collapsedFiles = { ...collapsedFiles, [filename]: false };
			}
			setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
		}
	}

	$effect(() => {
		const _owner = owner;
		const _repo = repo;
		const _hash = hash;
		const id = ++fetchId;

		loading = true;
		commit = null;
		collapsedFiles = {};

		repos.commitDetail(_owner, _repo, _hash).then(data => {
			if (id !== fetchId) return;
			commit = data;
		}).catch(() => {
			// ignore
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});
</script>

{#if loading}
	<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Loading commit...</div>
{:else if commit}
	<div class="flex flex-col gap-6 animate-fade-up">
		<!-- Back link -->
		<a
			href="/{owner}/{repo}/commits"
			class="inline-flex items-center gap-1.5 text-sm hover:underline w-fit"
			style="color: var(--color-primary);"
		>
			<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
				<path fill-rule="evenodd" d="M7.78 12.53a.75.75 0 0 1-1.06 0L2.47 8.28a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L4.81 7h7.44a.75.75 0 0 1 0 1.5H4.81l2.97 2.97a.75.75 0 0 1 0 1.06Z" />
			</svg>
			Back to commits
		</a>

		<!-- Commit header card -->
		<div class="card p-5">
			<div class="flex items-start gap-4">
				<Avatar username={commit.author} size={40} />
				<div class="flex-1 min-w-0">
					<h2 class="text-base font-semibold leading-snug" style="color: var(--color-text);">{commit.message}</h2>
					<div class="flex items-center gap-2 mt-2 text-sm" style="color: var(--color-text-dim);">
						<span class="font-medium" style="color: var(--color-text);">{commit.author}</span>
						<span>committed</span>
						{#if commit.date}
							<RelativeTime date={commit.date} />
						{/if}
					</div>
					<div class="mt-3 flex items-center gap-3">
						<code class="text-xs px-2.5 py-1 rounded-md font-mono border border-[var(--glass-border)] bg-[rgba(255,255,255,0.03)]" style="color: var(--color-text-dim);">
							{commit.hash}
						</code>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats bar -->
		<div class="card px-5 py-3 flex items-center gap-4 text-sm">
			<span style="color: var(--color-text);">
				<span class="font-semibold">{filesChanged}</span> file{filesChanged !== 1 ? 's' : ''} changed
			</span>
			{#if totalAdditions > 0}
				<span style="color: var(--color-success);">
					+{totalAdditions} addition{totalAdditions !== 1 ? 's' : ''}
				</span>
			{/if}
			{#if totalDeletions > 0}
				<span style="color: var(--color-error);">
					-{totalDeletions} deletion{totalDeletions !== 1 ? 's' : ''}
				</span>
			{/if}
		</div>

		{#if commit.diff && commit.diff.length > 0}
			<div class="flex gap-6">
				<!-- File sidebar -->
				<div class="hidden lg:block shrink-0 w-64">
					<div class="card p-3 sticky top-4">
						<p class="text-xs font-semibold px-2 pb-2 border-b" style="color: var(--color-text-dim); border-color: var(--glass-border);">
							Changed files
						</p>
						<div class="flex flex-col mt-2 max-h-[60vh] overflow-y-auto">
							{#each commit.diff as file}
								{@const filename = getFileName(file)}
								{@const adds = getFileAdditions(file)}
								{@const dels = getFileDeletions(file)}
								<button
									onclick={() => scrollToFile(filename)}
									class="flex items-center gap-2 px-2 py-1.5 rounded-md text-left hover:bg-[rgba(255,255,255,0.03)] transition-colors group"
								>
									<span class="text-xs font-mono truncate flex-1" style="color: var(--color-text);" title={filename}>
										{filename}
									</span>
									<span class="text-[10px] shrink-0 flex gap-1">
										{#if adds > 0}
											<span style="color: var(--color-success);">+{adds}</span>
										{/if}
										{#if dels > 0}
											<span style="color: var(--color-error);">-{dels}</span>
										{/if}
									</span>
								</button>
							{/each}
						</div>
					</div>
				</div>

				<!-- Diff viewer -->
				<div class="flex flex-col gap-4 flex-1 min-w-0">
					{#each commit.diff as file}
						{@const filename = getFileName(file)}
						{@const adds = getFileAdditions(file)}
						{@const dels = getFileDeletions(file)}
						{@const isCollapsed = collapsedFiles[filename] ?? false}
						<div id="diff-{filename}" class="card overflow-hidden">
							<!-- File header -->
							<button
								onclick={() => toggleFile(filename)}
								class="flex items-center gap-3 px-4 py-2.5 w-full text-left border-b hover:bg-[rgba(255,255,255,0.03)] transition-colors"
								style="background-color: rgba(255, 255, 255, 0.02); border-color: var(--glass-border);"
							>
								<svg
									class="w-3 h-3 shrink-0 transition-transform"
									style="color: var(--color-text-dim); transform: rotate({isCollapsed ? '-90deg' : '0deg'});"
									viewBox="0 0 12 12"
									fill="currentColor"
								>
									<path d="M6 8.825a.5.5 0 0 1-.354-.146l-3.5-3.5a.5.5 0 1 1 .708-.708L6 7.618l3.146-3.147a.5.5 0 1 1 .708.708l-3.5 3.5A.5.5 0 0 1 6 8.825Z" />
								</svg>
								<span class="text-sm font-mono flex-1 truncate" style="color: var(--color-text);">
									{filename}
								</span>
								<span class="text-xs shrink-0 flex gap-2">
									{#if adds > 0}
										<span style="color: var(--color-success);">+{adds}</span>
									{/if}
									{#if dels > 0}
										<span style="color: var(--color-error);">-{dels}</span>
									{/if}
								</span>
							</button>

							<!-- File diff content -->
							{#if !isCollapsed}
								{#each file.hunks as hunk}
									<div class="px-4 py-1 text-xs font-mono border-b" style="background-color: rgba(255, 255, 255, 0.02); color: var(--color-text-dim); border-color: var(--glass-border);">
										{hunk.header}
									</div>
									<pre class="text-xs font-mono leading-5 overflow-x-auto">{#each hunk.lines as line}<span class="block px-4" style={line.startsWith('+') ? 'background-color: var(--color-success-subtle); color: var(--color-success);' : line.startsWith('-') ? 'background-color: var(--color-error-subtle); color: var(--color-error);' : 'color: var(--color-text);'}>{line}</span>{/each}</pre>
								{/each}
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</div>
{:else}
	<div class="py-12 text-center text-sm" style="color: var(--color-text-dim);">Commit not found</div>
{/if}
