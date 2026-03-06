<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { repos } from '$lib/services/api';
	import { userStore } from '$lib/stores/user.svelte';
	import type { Repository, TreeEntry, Branch, ReadmeContent, Tag, Commit } from '$lib/types/repository';
	import FileTree from '$lib/components/FileTree.svelte';
	import ReadmeViewer from '$lib/components/ReadmeViewer.svelte';
	import BranchSelector from '$lib/components/BranchSelector.svelte';
	import EmptyRepo from '$lib/components/EmptyRepo.svelte';
	import LanguageBar from '$lib/components/LanguageBar.svelte';
	import ContributorsList from '$lib/components/ContributorsList.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);
	const BASE_URL = import.meta.env.VITE_DEVNOOK_SERVER_URL || 'http://localhost:8080';
	const isOwner = $derived(userStore.user?.username === owner);

	let repoData = $state<Repository | null>(null);
	let entries = $state<TreeEntry[]>([]);
	let branches = $state<Branch[]>([]);
	let tags = $state<Tag[]>([]);
	let latestCommit = $state<Commit | null>(null);
	let readme = $state<ReadmeContent | null>(null);
	let currentRef = $state('main');
	let loading = $state(true);
	let empty = $state(false);

	onMount(async () => {
		try {
			const [branchList, repo, tagList] = await Promise.all([
				repos.branches(owner, repoName),
				repos.get(owner, repoName),
				repos.tags(owner, repoName).catch(() => [] as Tag[])
			]);
			branches = branchList;
			repoData = repo;
			tags = tagList;
			currentRef = repo.default_branch || 'main';

			if (branches.length === 0) {
				empty = true;
				return;
			}

			const [tree, readmeData, commitsData] = await Promise.allSettled([
				repos.tree(owner, repoName, currentRef, ''),
				repos.readme(owner, repoName, currentRef),
				repos.commits(owner, repoName, currentRef)
			]);
			if (tree.status === 'fulfilled') entries = tree.value;
			else empty = true;
			if (readmeData.status === 'fulfilled') readme = readmeData.value;
			if (commitsData.status === 'fulfilled' && commitsData.value.length > 0) {
				latestCommit = commitsData.value[0];
			}
		} catch {
			empty = true;
		} finally {
			loading = false;
		}
	});
</script>

{#if loading}
	<div class="py-16 text-center card-animate">
		<div class="inline-flex flex-col items-center gap-3">
			<div class="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style="border-color: var(--color-primary); border-top-color: transparent;"></div>
			<span class="text-sm" style="color: var(--color-text-dim);">Loading repository...</span>
		</div>
	</div>
{:else if empty}
	<EmptyRepo cloneUrl="{BASE_URL}/{owner}/{repoName}.git" />
{:else}
	<div class="grid grid-cols-1 lg:grid-cols-4 gap-6 content-reveal">
		<!-- Main content -->
		<div class="lg:col-span-3 flex flex-col gap-4">
			{#if branches.length > 0}
				<div class="flex items-center justify-between gap-4 page-header">
					<BranchSelector {branches} {currentRef} {owner} repo={repoName} />
					{#if isOwner}
						<a
							href="/{owner}/{repoName}/_new/{currentRef}"
							class="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl glass-subtle press-scale transition-all duration-200 shrink-0"
							style="color: var(--color-text);"
						>
							<svg class="w-3.5 h-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
							New file
						</a>
					{/if}
				</div>
			{/if}

			<!-- Latest commit bar -->
			{#if latestCommit}
				<div class="flex items-center gap-3 px-4 py-2.5 rounded-t-2xl glass-subtle text-xs card-animate stagger-1" style="border-bottom: none; border-bottom-left-radius: 0; border-bottom-right-radius: 0;">
					<div class="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style="background: color-mix(in srgb, var(--color-primary) 15%, transparent);">
						<svg class="w-3 h-3" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3" /><path stroke-linecap="round" d="M12 3v6m0 6v6" /></svg>
					</div>
					<span class="font-medium truncate" style="color: var(--color-text);">{latestCommit.author}</span>
					<a href="/{owner}/{repoName}/commits/{latestCommit.hash}" class="truncate flex-1 animated-link" style="color: var(--color-text-dim);">
						{latestCommit.message.split('\n')[0]}
					</a>
					<span class="shrink-0 font-mono px-2 py-0.5 rounded-md" style="color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, transparent);">
						<a href="/{owner}/{repoName}/commits/{latestCommit.hash}" class="hover:underline">{latestCommit.short_hash}</a>
					</span>
					<span class="shrink-0 opacity-50" style="color: var(--color-text-dim);">
						<RelativeTime date={latestCommit.date} />
					</span>
				</div>
			{/if}

			<div class="{latestCommit ? '-mt-4' : ''} card-animate stagger-2">
				<FileTree {entries} {owner} repo={repoName} ref={currentRef} />
			</div>

			{#if readme}
				<div class="card-animate stagger-3">
					<ReadmeViewer name={readme.name} content={readme.content} />
				</div>
			{/if}
		</div>

		<!-- Sidebar -->
		<div class="flex flex-col gap-5">
			<!-- Quick stats -->
			<div class="card p-4 flex flex-col gap-2.5 sidebar-animate" style="animation-delay: 0.1s;">
				<a href="/{owner}/{repoName}/branches" class="flex items-center justify-between text-xs hover-slide transition-all duration-200 py-1 rounded-lg px-1 -mx-1" style="color: var(--color-text-dim);" onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 5%, transparent)'; }} onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-dim)'; e.currentTarget.style.background = 'transparent'; }}>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
						Branches
					</span>
					<span class="font-mono text-[0.625rem] px-1.5 py-0.5 rounded-md" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">{branches.length}</span>
				</a>
				<a href="/{owner}/{repoName}/tags" class="flex items-center justify-between text-xs hover-slide transition-all duration-200 py-1 rounded-lg px-1 -mx-1" style="color: var(--color-text-dim);" onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 5%, transparent)'; }} onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-dim)'; e.currentTarget.style.background = 'transparent'; }}>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" /></svg>
						Tags
					</span>
					<span class="font-mono text-[0.625rem] px-1.5 py-0.5 rounded-md" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">{tags.length}</span>
				</a>
				<a href="/{owner}/{repoName}/releases" class="flex items-center justify-between text-xs hover-slide transition-all duration-200 py-1 rounded-lg px-1 -mx-1" style="color: var(--color-text-dim);" onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 5%, transparent)'; }} onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-dim)'; e.currentTarget.style.background = 'transparent'; }}>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
						Releases
					</span>
				</a>
				<a href="/{owner}/{repoName}/stargazers" class="flex items-center justify-between text-xs hover-slide transition-all duration-200 py-1 rounded-lg px-1 -mx-1" style="color: var(--color-text-dim);" onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 5%, transparent)'; }} onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-dim)'; e.currentTarget.style.background = 'transparent'; }}>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 opacity-60" viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>
						Stargazers
					</span>
					<span class="font-mono text-[0.625rem] px-1.5 py-0.5 rounded-md" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">{repoData?.stars_count ?? 0}</span>
				</a>
				<a href="/{owner}/{repoName}/forks" class="flex items-center justify-between text-xs hover-slide transition-all duration-200 py-1 rounded-lg px-1 -mx-1" style="color: var(--color-text-dim);" onmouseenter={(e) => { e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.background = 'color-mix(in srgb, var(--color-primary) 5%, transparent)'; }} onmouseleave={(e) => { e.currentTarget.style.color = 'var(--color-text-dim)'; e.currentTarget.style.background = 'transparent'; }}>
					<span class="flex items-center gap-1.5">
						<svg class="w-3.5 h-3.5 opacity-60" viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>
						Forks
					</span>
					<span class="font-mono text-[0.625rem] px-1.5 py-0.5 rounded-md" style="background: color-mix(in srgb, var(--color-primary) 8%, transparent); color: var(--color-primary);">{repoData?.forks_count ?? 0}</span>
				</a>
			</div>

			<!-- Clone URL -->
			<div class="card p-4 sidebar-animate" style="animation-delay: 0.2s;">
				<h3 class="section-title mb-2">Clone</h3>
				<input
					type="text"
					readonly
					value="{BASE_URL}/{owner}/{repoName}.git"
					class="w-full px-2.5 py-2 text-xs rounded-xl border font-mono transition-all duration-200 focus:border-[var(--color-primary)]"
					style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-surface) 50%, transparent); color: var(--color-text);"
					onclick={(e) => (e.target as HTMLInputElement).select()}
				/>
			</div>

			<div class="sidebar-animate" style="animation-delay: 0.3s;">
				<LanguageBar {owner} repo={repoName} />
			</div>
			<div class="sidebar-animate" style="animation-delay: 0.4s;">
				<ContributorsList {owner} repo={repoName} />
			</div>
		</div>
	</div>
{/if}
