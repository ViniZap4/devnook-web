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
	let showDownload = $state(false);
	let starred = $state(false);
	let starCount = $state(repo.stars_count ?? 0);
	let forking = $state(false);

	function handleClickOutside(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (showDownload && !target.closest('.download-dropdown')) {
			showDownload = false;
		}
	}

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

<svelte:window onclick={handleClickOutside} />

<div class="flex flex-col gap-3 page-header">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div class="flex items-center gap-2 min-w-0">
			<div class="shrink-0 opacity-50 transition-transform duration-300 hover:scale-110">
				{#if repo.is_private}
					<LockIcon size={18} />
				{:else}
					<RepoIcon size={18} />
				{/if}
			</div>
			<a href="/{repo.owner}" class="text-lg animated-link shrink-0" style="color: var(--color-primary);">
				{repo.owner}
			</a>
			<span class="text-lg opacity-15" style="color: var(--color-text);">/</span>
			<span class="text-lg font-bold truncate gradient-text">{repo.name}</span>
			<span
				class="text-[0.625rem] px-2.5 py-0.5 rounded-full shrink-0 transition-all duration-300"
				style="
					background: {repo.is_private ? 'color-mix(in srgb, var(--color-warning) 10%, transparent)' : 'color-mix(in srgb, var(--color-success) 8%, transparent)'};
					color: {repo.is_private ? 'var(--color-warning)' : 'var(--color-text-dim)'};
					border: 1px solid {repo.is_private ? 'color-mix(in srgb, var(--color-warning) 20%, transparent)' : 'var(--color-border)'};
				"
			>
				{repo.is_private ? 'Private' : 'Public'}
			</span>
			{#if repo.is_fork}
				<span
					class="text-[0.625rem] px-2.5 py-0.5 rounded-full shrink-0"
					style="background: color-mix(in srgb, var(--color-info) 8%, transparent); color: var(--color-info); border: 1px solid color-mix(in srgb, var(--color-info) 20%, transparent);"
				>Fork</span>
			{/if}
		</div>

		<div class="flex items-center gap-2 shrink-0">
			<button
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl glass-subtle press-scale transition-all duration-200"
				style="color: {starred ? 'var(--color-warning)' : 'var(--color-text)'};"
				onclick={toggleStar}
			>
				<svg class="w-3.5 h-3.5 transition-transform duration-300 {starred ? 'scale-110' : ''}" viewBox="0 0 16 16" fill={starred ? 'var(--color-warning)' : 'none'} stroke={starred ? 'var(--color-warning)' : 'currentColor'} stroke-width="1.5">
					<path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z" />
				</svg>
				{starred ? 'Starred' : 'Star'}
				<span class="opacity-50 font-mono text-[0.625rem]">{starCount}</span>
			</button>

			<button
				class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl glass-subtle press-scale transition-all duration-200"
				style="color: var(--color-text);"
				onclick={handleFork}
				disabled={forking}
			>
				<svg class="w-3.5 h-3.5 opacity-60" viewBox="0 0 16 16" fill="currentColor">
					<path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/>
				</svg>
				{forking ? 'Forking...' : 'Fork'}
				<span class="opacity-50 font-mono text-[0.625rem]">{repo.forks_count ?? 0}</span>
			</button>

			<div class="relative download-dropdown">
				<button
					class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl glass-subtle press-scale transition-all duration-200"
					style="color: var(--color-text);"
					onclick={() => { showDownload = !showDownload; }}
				>
					<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
				</button>
				{#if showDownload}
					<div class="absolute right-0 top-full mt-2 w-48 card p-1 z-20 animate-fade-up-sm">
						<a
							href={repos.archiveUrl(repo.owner, repo.name, repo.default_branch || 'main', 'zip')}
							class="flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all duration-200 hover-slide"
							style="color: var(--color-text);"
							onmouseenter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)'; }}
							onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
						>
							<svg class="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
							Download ZIP
						</a>
						<a
							href={repos.archiveUrl(repo.owner, repo.name, repo.default_branch || 'main', 'tar.gz')}
							class="flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-all duration-200 hover-slide"
							style="color: var(--color-text);"
							onmouseenter={(e) => { e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 8%, transparent)'; }}
							onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
						>
							<svg class="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" /></svg>
							Download TAR.GZ
						</a>
					</div>
				{/if}
			</div>

			<button
				class="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl glass-subtle press-scale transition-all duration-200"
				style="color: var(--color-text);"
				onclick={() => { showClone = !showClone; }}
			>
				<svg class="w-3.5 h-3.5 opacity-60" viewBox="0 0 16 16" fill="currentColor"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/></svg>
				Clone
			</button>
		</div>
	</div>
	{#if repo.description}
		<p class="text-sm animate-fade-up" style="color: var(--color-text-dim); animation-delay: 0.1s;">{repo.description}</p>
	{/if}
	{#if repo.topics && repo.topics.length > 0}
		<div class="flex flex-wrap gap-1.5 animate-fade-up" style="animation-delay: 0.15s;">
			{#each repo.topics as topic}
				<span
					class="text-[0.625rem] px-2.5 py-0.5 rounded-full font-medium transition-all duration-200 hover:scale-105 press-scale cursor-default"
					style="background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary); border: 1px solid color-mix(in srgb, var(--color-primary) 15%, transparent);"
				>
					{topic}
				</span>
			{/each}
		</div>
	{/if}
	{#if showClone}
		<div class="max-w-md animate-fade-up-sm">
			<CloneUrlBox url={cloneUrl} />
		</div>
	{/if}
</div>
