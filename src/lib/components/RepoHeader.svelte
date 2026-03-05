<script lang="ts">
	import type { Repository } from '$lib/types/repository';
	import { repos } from '$lib/services/api';
	import RepoIcon from '$lib/assets/icons/RepoIcon.svelte';
	import LockIcon from '$lib/assets/icons/LockIcon.svelte';
	import CloneUrlBox from './CloneUrlBox.svelte';
	import { onMount } from 'svelte';

	let { repo }: { repo: Repository } = $props();

	const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';
	const cloneUrl = $derived(`${BASE_URL}/${repo.owner}/${repo.name}.git`);

	let showClone = $state(false);
	let starred = $state(false);
	let starCount = $state(repo.stars_count ?? 0);
	let forking = $state(false);

	onMount(async () => {
		try {
			const res = await repos.isStarred(repo.owner, repo.name);
			starred = res.starred;
		} catch {
			// not logged in or error
		}
	});

	async function toggleStar() {
		try {
			if (starred) {
				await repos.unstar(repo.owner, repo.name);
				starred = false;
				starCount--;
			} else {
				await repos.star(repo.owner, repo.name);
				starred = true;
				starCount++;
			}
		} catch {
			// ignore
		}
	}

	async function handleFork() {
		forking = true;
		try {
			const result = await repos.fork(repo.owner, repo.name);
			window.location.href = `/${result.name}`;
		} catch {
			forking = false;
		}
	}
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-2 min-w-0">
			<div class="shrink-0 opacity-40">
				{#if repo.is_private}
					<LockIcon size={18} />
				{:else}
					<RepoIcon size={18} />
				{/if}
			</div>
			<a href="/{repo.owner}" class="text-lg hover:underline shrink-0" style="color: var(--color-primary);">
				{repo.owner}
			</a>
			<span class="text-[var(--color-text)] opacity-15 text-lg">/</span>
			<span class="text-[var(--color-text)] font-bold text-lg truncate">{repo.name}</span>
			<span class="text-[0.625rem] px-2 py-0.5 rounded-full border shrink-0 {repo.is_private ? 'border-yellow-500/20 text-yellow-500/60' : 'border-[var(--color-border)] text-[var(--color-text)] opacity-30'}">
				{repo.is_private ? 'Private' : 'Public'}
			</span>
			{#if repo.is_fork}
				<span class="text-[0.625rem] px-2 py-0.5 rounded-full border border-[var(--color-border)] text-[var(--color-text)] opacity-30 shrink-0">Fork</span>
			{/if}
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<!-- Star button -->
			<button
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
				onclick={toggleStar}
			>
				<svg class="w-3.5 h-3.5" viewBox="0 0 16 16" fill={starred ? 'var(--color-warning)' : 'none'} stroke={starred ? 'var(--color-warning)' : 'currentColor'} stroke-width="1.5">
					<path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
				</svg>
				{starred ? 'Starred' : 'Star'}
				<span class="text-[var(--color-text)] opacity-40">{starCount}</span>
			</button>

			<!-- Fork button -->
			<button
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
				onclick={handleFork}
				disabled={forking}
			>
				<svg class="w-3.5 h-3.5 opacity-50" viewBox="0 0 16 16" fill="currentColor">
					<path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
				</svg>
				{forking ? 'Forking...' : 'Fork'}
				<span class="text-[var(--color-text)] opacity-40">{repo.forks_count ?? 0}</span>
			</button>

			<!-- Clone button -->
			<button
				class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
				onclick={() => { showClone = !showClone; }}
			>
				<svg class="w-3.5 h-3.5 opacity-50" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
				Clone
			</button>
		</div>
	</div>
	{#if repo.description}
		<p class="text-[var(--color-text)] opacity-40 text-sm">{repo.description}</p>
	{/if}
	{#if repo.topics && repo.topics.length > 0}
		<div class="flex flex-wrap gap-1.5">
			{#each repo.topics as topic}
				<span class="text-[0.625rem] px-2 py-0.5 rounded-full font-medium" style="background-color: var(--color-primary)15; color: var(--color-primary);">
					{topic}
				</span>
			{/each}
		</div>
	{/if}
	{#if showClone}
		<div class="max-w-md animate-fade-in">
			<CloneUrlBox url={cloneUrl} />
		</div>
	{/if}
</div>
