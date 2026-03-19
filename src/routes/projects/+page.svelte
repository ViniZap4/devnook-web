<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { projects } from '$lib/services/api';
	import type { Project } from '$lib/types/project';
	import PageShell from '$lib/components/PageShell.svelte';
	import Spinner from '$lib/components/Spinner.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';

	let projectList = $state<Project[]>([]);
	let loading = $state(true);

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await loadProjects();
	});

	async function loadProjects() {
		loading = true;
		try {
			projectList = await projects.list();
		} catch {
			projectList = [];
		} finally {
			loading = false;
		}
	}

	type Methodology = Project['methodology'];

	const methodologyLabels: Record<Methodology, string> = {
		kanban:    'Kanban',
		scrum:     'Scrum',
		scrumban:  'Scrumban',
		xp:        'XP',
		waterfall: 'Waterfall',
		custom:    'Custom',
	};

	// Tailwind-safe class strings (must be full literals for the scanner)
	const methodologyStyles: Record<Methodology, { bg: string; text: string }> = {
		kanban:    { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa' },
		scrum:     { bg: 'rgba(34,197,94,0.12)',   text: '#4ade80' },
		scrumban:  { bg: 'rgba(168,85,247,0.12)',  text: '#c084fc' },
		xp:        { bg: 'rgba(249,115,22,0.12)',  text: '#fb923c' },
		waterfall: { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af' },
		custom:    { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6' },
	};

	const visibilityIcon: Record<Project['visibility'], string> = {
		private: '<path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />',
		members: '<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />',
		public:  '<path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />',
	};
</script>

<PageShell width="default">
	<div class="flex flex-col gap-6">
		<!-- Header -->
		<div class="flex items-center justify-between page-header">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-xl flex items-center justify-center"
					style="background: var(--color-primary-subtle);"
				>
					<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
					</svg>
				</div>
				<div>
					<h1 class="text-xl font-bold" style="color: var(--color-text);">Projects</h1>
					<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Track work with Kanban boards, Scrum sprints, and more</p>
				</div>
			</div>

			<a
				href="/projects/new"
				class="btn-glow flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white"
				style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
				</svg>
				New Project
			</a>
		</div>

		<!-- Content -->
		{#if loading}
			<div class="py-16 flex flex-col items-center gap-3">
				<Spinner size="md" />
			</div>
		{:else if projectList.length === 0}
			<div class="card p-16 text-center">
				<svg class="w-16 h-16 mx-auto mb-4 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
				</svg>
				<p class="text-sm font-medium" style="color: var(--color-text);">No projects yet</p>
				<p class="text-xs mt-1 mb-5" style="color: var(--color-text-dim);">Create a project to start tracking work with boards and sprints</p>
				<a
					href="/projects/new"
					class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl text-white"
					style="background: var(--color-primary);"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
					</svg>
					Create your first project
				</a>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each projectList as project, i}
					{@const mStyle = methodologyStyles[project.methodology]}
					<a
						href="/projects/{project.slug}/board"
						class="card p-5 group transition-all duration-300 flex flex-col gap-4"
						style="animation: fade-up 0.3s {i * 0.05}s ease both;"
					>
						<!-- Top: color bar + name -->
						<div class="flex items-start gap-3">
							<!-- Color indicator -->
							<div
								class="w-3 h-3 rounded-full mt-1.5 shrink-0 ring-2 ring-offset-2 transition-transform duration-300 group-hover:scale-110"
								style="background: {project.color || 'var(--color-primary)'}; ring-color: {project.color || 'var(--color-primary)'}33; ring-offset-color: var(--color-bg);"
							></div>

							<div class="min-w-0 flex-1">
								<h3 class="text-sm font-semibold truncate transition-colors duration-200 group-hover:text-[var(--color-primary)]" style="color: var(--color-text);">
									{project.name}
								</h3>
								{#if project.description}
									<p class="text-xs mt-0.5 line-clamp-2" style="color: var(--color-text-dim);">{project.description}</p>
								{/if}
							</div>
						</div>

						<!-- Methodology badge -->
						<div class="flex items-center gap-2 flex-wrap">
							<span
								class="text-[0.625rem] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
								style="background: {mStyle.bg}; color: {mStyle.text};"
							>
								{methodologyLabels[project.methodology]}
							</span>

							<!-- Visibility icon -->
							<span class="flex items-center gap-1 text-[0.625rem]" style="color: var(--color-text-dim);">
								<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									{@html visibilityIcon[project.visibility]}
								</svg>
								{project.visibility}
							</span>
						</div>

						<!-- Footer: stats + updated -->
						<div class="flex items-center justify-between pt-1 border-t" style="border-color: var(--glass-border);">
							<div class="flex items-center gap-3">
								<!-- Members -->
								<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
									{project.member_count}
								</span>
								<!-- Items -->
								<span class="flex items-center gap-1 text-xs" style="color: var(--color-text-dim);">
									<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
									</svg>
									{project.item_count}
								</span>
							</div>

							<span class="text-[0.625rem]" style="color: var(--color-text-dim); opacity: 0.6;">
								<RelativeTime date={project.updated_at} />
							</span>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</PageShell>
