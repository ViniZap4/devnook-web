<script lang="ts">
	import { page } from '$app/stores';
	import { goto, afterNavigate } from '$app/navigation';
	import { onMount, tick } from 'svelte';
	import { userStore } from '$lib/stores/user.svelte';
	import { projects } from '$lib/services/api';
	import type { Project } from '$lib/types/project';
	import type { Snippet } from 'svelte';
	import PageShell from '$lib/components/PageShell.svelte';
	import Skeleton from '$lib/components/Skeleton.svelte';

	let { children }: { children: Snippet } = $props();

	const slug = $derived($page.params.slug!);

	let project = $state<Project | null>(null);
	let loading = $state(true);
	let error = $state('');
	let fetchId = 0;

	// Sliding indicator state
	let navContainer = $state<HTMLElement>();
	let indicatorStyle = $state('opacity: 0;');
	let mounted = $state(false);

	const currentTab = $derived.by(() => {
		const path = $page.url.pathname;
		const base = `/projects/${slug}`;
		const rest = path.slice(base.length);
		const seg = rest.split('/')[1] || '';
		return seg || 'board';
	});

	const settingsActive = $derived(currentTab === 'settings');
	const membersActive = $derived(currentTab === 'members');

	$effect(() => {
		const _slug = slug;
		const id = ++fetchId;

		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}

		loading = true;
		error = '';
		project = null;

		projects.get(_slug).then(data => {
			if (id !== fetchId) return;
			project = data;
		}).catch(err => {
			if (id !== fetchId) return;
			error = err instanceof Error ? err.message : 'Project not found';
		}).finally(() => {
			if (id !== fetchId) return;
			loading = false;
		});
	});

	const methodologyLabels: Record<string, string> = {
		kanban: 'Kanban',
		scrum: 'Scrum',
		scrumban: 'Scrumban',
		xp: 'XP',
		waterfall: 'Waterfall',
		custom: 'Custom'
	};

	const methodologyColors: Record<string, string> = {
		kanban: 'var(--color-primary)',
		scrum: 'var(--color-accent)',
		scrumban: 'var(--color-secondary)',
		xp: '#a78bfa',
		waterfall: '#60a5fa',
		custom: 'var(--color-text-dim)'
	};

	function updateIndicator() {
		if (!navContainer) return;
		const links = navContainer.querySelectorAll<HTMLAnchorElement>('a[data-project-tab]');
		const settingsLink = navContainer.querySelector<HTMLAnchorElement>('a[data-project-settings]');
		const target = settingsActive ? settingsLink : (Array.from(links).find(l => l.dataset.tabKey === currentTab) ?? null);
		if (!target) {
			indicatorStyle = 'opacity: 0;';
			return;
		}
		const el = target as HTMLElement;
		indicatorStyle = `width: ${el.offsetWidth}px; height: ${el.offsetHeight}px; left: ${el.offsetLeft}px; top: ${el.offsetTop}px; opacity: 1;`;
		target.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
	}

	onMount(() => {
		mounted = true;
		tick().then(updateIndicator);
	});

	afterNavigate(() => {
		tick().then(updateIndicator);
	});

	$effect(() => {
		if (mounted && navContainer) {
			const _ = currentTab;
			const __ = settingsActive;
			const ___ = membersActive;
			tick().then(updateIndicator);
		}
	});

	function handleResize() {
		updateIndicator();
	}
</script>

<svelte:window onresize={handleResize} />

<PageShell>
	{#if loading}
		<div class="flex flex-col gap-6">
			<div class="flex items-center gap-2">
				<Skeleton width="64px" height="14px" />
				<span class="opacity-15" style="color: var(--color-text);">/</span>
				<Skeleton width="24px" height="18px" />
				<Skeleton width="140px" height="18px" />
				<Skeleton width="64px" height="20px" rounded="rounded-full" />
			</div>
			<Skeleton width="220px" height="13px" />
			<Skeleton width="100%" height="44px" rounded="rounded-xl" />
			<Skeleton width="100%" height="300px" rounded="rounded-xl" />
		</div>
	{:else if error}
		<div class="flex flex-col items-center justify-center py-20 gap-4">
			<svg class="w-16 h-16 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
				<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
			</svg>
			<p class="text-lg opacity-40" style="color: var(--color-text);">{error}</p>
			<a href="/projects" class="text-sm font-medium hover:underline" style="color: var(--color-primary);">Back to projects</a>
		</div>
	{:else if project}
		<div class="flex flex-col gap-6">
			<!-- Header -->
			<div class="flex flex-col gap-2.5 page-header">
				<div class="flex items-center justify-between flex-wrap gap-3">
					<div class="flex items-center gap-2.5 min-w-0 flex-wrap">
						<a href="/projects" class="text-sm animated-link shrink-0" style="color: var(--color-primary);">
							Projects
						</a>
						<span class="text-sm opacity-15 shrink-0" style="color: var(--color-text);">/</span>

						<div class="flex items-center gap-2 min-w-0">
							<!-- Color dot -->
							<span
								class="w-2.5 h-2.5 rounded-full shrink-0"
								style="background-color: {project.color || 'var(--color-primary)'};"
							></span>
							{#if project.icon}
								<span class="text-base shrink-0">{project.icon}</span>
							{/if}
							<span class="text-lg font-bold truncate" style="color: var(--color-text);">{project.name}</span>
						</div>

						<!-- Methodology badge -->
						<span
							class="text-[0.625rem] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide shrink-0 transition-all duration-300"
							style="
								background: color-mix(in srgb, {methodologyColors[project.methodology] ?? 'var(--color-primary)'} 15%, transparent);
								color: {methodologyColors[project.methodology] ?? 'var(--color-primary)'};
								border: 1px solid color-mix(in srgb, {methodologyColors[project.methodology] ?? 'var(--color-primary)'} 30%, transparent);
							"
						>
							{methodologyLabels[project.methodology] ?? project.methodology}
						</span>

						<!-- Visibility badge -->
						<span
							class="text-[0.625rem] px-2.5 py-0.5 rounded-full shrink-0 transition-all duration-300"
							style="
								background: {project.visibility === 'public' ? 'var(--color-success-subtle)' : 'var(--color-warning-subtle)'};
								color: {project.visibility === 'public' ? 'var(--color-text-dim)' : 'var(--color-warning)'};
								border: 1px solid {project.visibility === 'public' ? 'var(--glass-border)' : 'var(--color-warning-subtle)'};
							"
						>
							{project.visibility === 'public' ? 'Public' : project.visibility === 'members' ? 'Members' : 'Private'}
						</span>
					</div>

					<!-- Member + item counts -->
					<div class="flex items-center gap-3 shrink-0">
						<div class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-dim);">
							<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							<span>{project.member_count} {project.member_count === 1 ? 'member' : 'members'}</span>
						</div>
						<div class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-dim);">
							<svg class="w-3.5 h-3.5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
							</svg>
							<span>{project.item_count} {project.item_count === 1 ? 'item' : 'items'}</span>
						</div>
					</div>
				</div>

				{#if project.description}
					<p class="text-sm animate-fade-up" style="color: var(--color-text-dim); animation-delay: 0.1s;">{project.description}</p>
				{/if}
			</div>

			<!-- Tab navigation with sliding indicator -->
			<nav bind:this={navContainer} class="glass-subtle rounded-xl p-1 relative card-animate">
				<div class="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
					{#if mounted}
						<div
							class="absolute rounded-lg pointer-events-none z-0"
							style="{indicatorStyle} background: rgba(255, 255, 255, 0.06); border: 1px solid var(--glass-border); transition: left 0.3s cubic-bezier(0.16, 1, 0.3, 1), top 0.3s cubic-bezier(0.16, 1, 0.3, 1), width 0.25s ease, height 0.25s ease, opacity 0.2s ease;"
							aria-hidden="true"
						></div>
					{/if}

					<!-- Board -->
					<a
						href="/projects/{slug}/board"
						data-project-tab
						data-tab-key="board"
						class="flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg whitespace-nowrap relative z-10"
						style="
							color: {currentTab === 'board' ? 'var(--color-primary)' : 'var(--color-text-dim)'};
							font-weight: {currentTab === 'board' ? '600' : '400'};
							transition: color 0.2s ease;
						"
						onmouseenter={(e) => { if (currentTab !== 'board') e.currentTarget.style.color = 'var(--color-text)'; }}
						onmouseleave={(e) => { if (currentTab !== 'board') e.currentTarget.style.color = 'var(--color-text-dim)'; }}
					>
						<!-- Kanban columns icon -->
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10H5a2 2 0 01-2-2V9a2 2 0 012-2h4m0 10h6M9 7h6m0 0h4a2 2 0 012 2v6a2 2 0 01-2 2h-4m0-10v10" />
						</svg>
						<span class="hidden sm:inline">Board</span>
					</a>

					<!-- List -->
					<a
						href="/projects/{slug}/list"
						data-project-tab
						data-tab-key="list"
						class="flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg whitespace-nowrap relative z-10"
						style="
							color: {currentTab === 'list' ? 'var(--color-primary)' : 'var(--color-text-dim)'};
							font-weight: {currentTab === 'list' ? '600' : '400'};
							transition: color 0.2s ease;
						"
						onmouseenter={(e) => { if (currentTab !== 'list') e.currentTarget.style.color = 'var(--color-text)'; }}
						onmouseleave={(e) => { if (currentTab !== 'list') e.currentTarget.style.color = 'var(--color-text-dim)'; }}
					>
						<!-- List icon -->
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
						</svg>
						<span class="hidden sm:inline">List</span>
					</a>

					<!-- Sprints -->
					<a
						href="/projects/{slug}/sprints"
						data-project-tab
						data-tab-key="sprints"
						class="flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg whitespace-nowrap relative z-10"
						style="
							color: {currentTab === 'sprints' ? 'var(--color-primary)' : 'var(--color-text-dim)'};
							font-weight: {currentTab === 'sprints' ? '600' : '400'};
							transition: color 0.2s ease;
						"
						onmouseenter={(e) => { if (currentTab !== 'sprints') e.currentTarget.style.color = 'var(--color-text)'; }}
						onmouseleave={(e) => { if (currentTab !== 'sprints') e.currentTarget.style.color = 'var(--color-text-dim)'; }}
					>
						<!-- Lightning bolt icon -->
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
						</svg>
						<span class="hidden sm:inline">Sprints</span>
					</a>

					<!-- Members -->
					<a
						href="/projects/{slug}/members"
						data-project-tab
						data-tab-key="members"
						class="flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg whitespace-nowrap relative z-10"
						style="
							color: {currentTab === 'members' ? 'var(--color-primary)' : 'var(--color-text-dim)'};
							font-weight: {currentTab === 'members' ? '600' : '400'};
							transition: color 0.2s ease;
						"
						onmouseenter={(e) => { if (currentTab !== 'members') e.currentTarget.style.color = 'var(--color-text)'; }}
						onmouseleave={(e) => { if (currentTab !== 'members') e.currentTarget.style.color = 'var(--color-text-dim)'; }}
					>
						<!-- Members icon -->
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
						</svg>
						<span class="hidden sm:inline">Members</span>
					</a>

					<!-- Settings (pushed right) -->
					<a
						href="/projects/{slug}/settings"
						data-project-settings
						class="flex items-center gap-2 px-3.5 py-2 text-xs rounded-lg whitespace-nowrap ml-auto relative z-10"
						style="
							color: {settingsActive ? 'var(--color-primary)' : 'var(--color-text-dim)'};
							font-weight: {settingsActive ? '600' : '400'};
							transition: color 0.2s ease;
						"
						onmouseenter={(e) => { if (!settingsActive) e.currentTarget.style.color = 'var(--color-text)'; }}
						onmouseleave={(e) => { if (!settingsActive) e.currentTarget.style.color = 'var(--color-text-dim)'; }}
					>
						<!-- Gear icon -->
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
							<circle cx="12" cy="12" r="3" />
						</svg>
						<span class="hidden sm:inline">Settings</span>
					</a>
				</div>
			</nav>

			<!-- Child page -->
			<div class="content-reveal">
				{@render children()}
			</div>
		</div>
	{/if}
</PageShell>

<style>
	.scrollbar-none {
		scrollbar-width: none;
	}
	.scrollbar-none::-webkit-scrollbar {
		display: none;
	}
</style>
