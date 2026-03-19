<script lang="ts">
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { shortcutsStore } from '$lib/stores/shortcuts.svelte';
	import { users, projects, calendar } from '$lib/services/api';
	import type { ActivityItem, DashboardStats } from '$lib/services/api';
	import type { Project } from '$lib/types/project';
	import type { CalendarEntry } from '$lib/types/calendar';
	import PageShell from '$lib/components/PageShell.svelte';
	import ShortCutsBox from '$lib/components/ShortCutsBox.svelte';
	import OrgsSection from '$lib/components/OrgsSection.svelte';
	import StatsCards from '$lib/components/StatsCards.svelte';
	import ActivityFeed from '$lib/components/ActivityFeed.svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	// ── State ────────────────────────────────────────────────────────────────
	let ready = $state(false);
	let loading = $state(true);

	let stats = $state<DashboardStats | null>(null);
	let projectList = $state<Project[]>([]);
	let calendarEntries = $state<CalendarEntry[]>([]);
	let activityItems = $state<ActivityItem[]>([]);

	// ── Fetch with $effect + fetchId guard ───────────────────────────────────
	$effect(() => {
		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}

		let cancelled = false;

		async function load() {
			loading = true;
			await shortcutsStore.load();
			ready = true;

			const today = new Date();
			const nextWeek = new Date(today);
			nextWeek.setDate(today.getDate() + 7);
			const todayStr = today.toISOString().slice(0, 10);
			const nextWeekStr = nextWeek.toISOString().slice(0, 10);

			const [statsRes, projectsRes, calendarRes, activityRes] = await Promise.allSettled([
				users.dashboardStats(),
				projects.list(),
				calendar.unified(todayStr, nextWeekStr),
				users.activity(),
			]);

			if (cancelled) return;

			if (statsRes.status === 'fulfilled') stats = statsRes.value;
			if (projectsRes.status === 'fulfilled') projectList = projectsRes.value;
			if (calendarRes.status === 'fulfilled') calendarEntries = calendarRes.value;
			if (activityRes.status === 'fulfilled') activityItems = activityRes.value;

			loading = false;
		}

		load();
		return () => { cancelled = true; };
	});

	// ── Derived ──────────────────────────────────────────────────────────────
	const greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	});

	const formattedDate = $derived.by(() =>
		new Date().toLocaleDateString('en-US', {
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	const topProjects = $derived(projectList.slice(0, 4));

	const upcomingEvents = $derived(
		calendarEntries
			.slice()
			.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
			.slice(0, 6)
	);

	// Issues: recent issue activity items from the activity feed
	const recentIssueActivity = $derived(
		activityItems
			.filter((item) => item.type === 'issue')
			.slice(0, 5)
	);

	const quickLinks = $derived([
		{ label: 'Your Profile', href: `/${userStore.user?.username}`, icon: 'profile' },
		{ label: 'Your Stars', href: `/${userStore.user?.username}?tab=stars`, icon: 'star' },
		{ label: 'Your Organizations', href: '/orgs', icon: 'org' },
		{ label: 'Settings', href: '/settings', icon: 'settings' },
	]);

	// ── Helpers ──────────────────────────────────────────────────────────────
	const METHODOLOGY_COLORS: Record<string, string> = {
		kanban: '#06b6d4',
		scrum: '#8b5cf6',
		scrumban: '#3fb950',
		xp: '#e3b341',
		waterfall: '#ef4444',
		custom: '#f97316',
	};

	const SOURCE_COLORS: Record<string, string> = {
		event: '#8b5cf6',
		milestone: '#3fb950',
		sprint: '#06b6d4',
		issue: '#e3b341',
	};

	function formatEventDate(dateStr: string): string {
		const d = new Date(dateStr);
		const now = new Date();
		const diff = d.getTime() - now.getTime();
		const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
		if (days === 0) return 'Today';
		if (days === 1) return 'Tomorrow';
		if (days <= 6) return `In ${days} days`;
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function activityMeta(type: string) {
		if (type === 'issue') return { color: 'var(--color-success)', label: 'Issue', verb: 'opened an issue' };
		if (type === 'pull_request') return { color: 'var(--color-secondary)', label: 'PR', verb: 'opened a PR' };
		if (type === 'release') return { color: 'var(--color-primary)', label: 'Release', verb: 'published a release' };
		if (type === 'star') return { color: 'var(--color-warning)', label: 'Star', verb: 'starred' };
		if (type === 'push') return { color: 'var(--color-info)', label: 'Push', verb: 'pushed to' };
		return { color: 'var(--color-text-dim)', label: type, verb: 'acted in' };
	}

	function timeAgo(dateStr: string): string {
		const diff = Date.now() - new Date(dateStr).getTime();
		const m = Math.floor(diff / 60000);
		const h = Math.floor(m / 60);
		const d = Math.floor(h / 24);
		if (m < 1) return 'just now';
		if (h < 1) return `${m}m ago`;
		if (d < 1) return `${h}h ago`;
		if (d < 30) return `${d}d ago`;
		return `${Math.floor(d / 30)}mo ago`;
	}
</script>

{#if ready}
<PageShell width="wide">
	{#snippet rightPanel()}
		<div class="flex flex-col gap-5">
			<OrgsSection />
			<ShortCutsBox />

			<!-- Quick Links -->
			<section class="animate-fade-up stagger-3">
				<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-70 mb-4">Quick Links</h2>
				<div class="card overflow-hidden">
					{#each quickLinks as link}
						<a
							href={link.href}
							class="flex items-center gap-3 px-4 py-3 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
							style="border-bottom: 1px solid var(--glass-border);"
						>
							<div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background: rgba(255, 255, 255, 0.06);">
								{#if link.icon === 'profile'}
									<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
								{:else if link.icon === 'star'}
									<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
									</svg>
								{:else if link.icon === 'org'}
									<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
								{:else}
									<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
										<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
										<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
									</svg>
								{/if}
							</div>
							<span class="text-sm text-[var(--color-text)] opacity-70 group-hover:opacity-100 transition-opacity duration-150">{link.label}</span>
							<svg class="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity duration-150" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
								<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
							</svg>
						</a>
					{/each}
				</div>
			</section>

			<!-- Activity Feed (right panel) -->
			<section class="animate-fade-up stagger-4">
				<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-70 mb-4">Recent Activity</h2>
				<div class="card overflow-hidden">
					{#if loading}
						<div class="py-8 flex flex-col items-center gap-3">
							<Spinner size="sm" />
							<span class="text-xs" style="color: var(--color-text-dim);">Loading...</span>
						</div>
					{:else if activityItems.length === 0}
						<div class="py-8 text-center">
							<svg class="w-8 h-8 mx-auto mb-2 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
							</svg>
							<p class="text-sm" style="color: var(--color-text-dim);">No recent activity.</p>
						</div>
					{:else}
						<div>
							{#each activityItems.slice(0, 8) as item}
								{@const m = activityMeta(item.type)}
								<div class="flex items-start gap-3 px-4 py-3.5" style="border-bottom: 1px solid var(--glass-border);">
									<Avatar username={item.author} size={28} />
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-1.5 flex-wrap">
											<span class="text-xs font-semibold" style="color: var(--color-text);">{item.author}</span>
											<span class="text-[11px]" style="color: var(--color-text-dim);">{m.verb}</span>
										</div>
										{#if item.title}
											<p class="text-xs mt-0.5 truncate" style="color: var(--color-text-dim);">{item.title}</p>
										{/if}
										<div class="flex items-center gap-2 mt-1">
											<span class="text-[10px] px-1.5 py-0.5 rounded font-medium" style="background: color-mix(in srgb, {m.color} 15%, transparent); color: {m.color};">{m.label}</span>
											<span class="text-[10px]" style="color: var(--color-text-dim);">{timeAgo(item.created_at)}</span>
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</section>
		</div>
	{/snippet}

	<!-- ── Welcome header ──────────────────────────────────────────────────── -->
	<div class="flex items-center justify-between mb-6 animate-fade-up stagger-1">
		<div class="flex items-center gap-4">
			{#if userStore.user?.username}
				<Avatar username={userStore.user.username} size={48} />
			{/if}
			<div>
				<h1 class="text-lg font-semibold" style="color: var(--color-text);">
					{greeting}{#if userStore.user?.full_name}, {userStore.user.full_name.split(' ')[0]}{/if}
				</h1>
				<div class="flex items-center gap-3 mt-0.5">
					<p class="text-xs" style="color: var(--color-text-dim);">@{userStore.user?.username}</p>
					<span class="w-1 h-1 rounded-full" style="background: var(--color-text-dim); opacity: 0.3;"></span>
					<p class="text-xs" style="color: var(--color-text-dim);">{formattedDate}</p>
				</div>
			</div>
		</div>
		<div class="hidden sm:flex items-center gap-2">
			<a href="/new" class="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl transition-all hover:brightness-110 border" style="border-color: var(--glass-border); color: var(--color-text); background: rgba(255,255,255,0.04);">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
				New Repo
			</a>
			<a href="/projects/new" class="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-xl transition-all hover:brightness-110" style="background: var(--color-primary); color: white;">
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" /></svg>
				New Project
			</a>
		</div>
	</div>

	<!-- ── Stats Cards ─────────────────────────────────────────────────────── -->
	<div class="mb-6 animate-fade-up stagger-2">
		<StatsCards />
	</div>

	<!-- ── Quick Actions row ───────────────────────────────────────────────── -->
	<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8 animate-fade-up stagger-3">
		<a href="/new" class="card-glow p-4 flex flex-col items-center gap-2.5 text-center group transition-all duration-200 hover:scale-[1.02]">
			<div class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style="background: linear-gradient(135deg, color-mix(in srgb, #8b5cf6 20%, transparent), color-mix(in srgb, #8b5cf6 5%, transparent));">
				<svg class="w-5 h-5" style="color: #8b5cf6;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
				</svg>
			</div>
			<span class="text-xs font-medium" style="color: var(--color-text-dim);">New Repository</span>
		</a>
		<a href="/projects/new" class="card-glow p-4 flex flex-col items-center gap-2.5 text-center group transition-all duration-200 hover:scale-[1.02]">
			<div class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style="background: linear-gradient(135deg, color-mix(in srgb, #06b6d4 20%, transparent), color-mix(in srgb, #06b6d4 5%, transparent));">
				<svg class="w-5 h-5" style="color: #06b6d4;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
				</svg>
			</div>
			<span class="text-xs font-medium" style="color: var(--color-text-dim);">New Project</span>
		</a>
		<a href="/orgs/new" class="card-glow p-4 flex flex-col items-center gap-2.5 text-center group transition-all duration-200 hover:scale-[1.02]">
			<div class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style="background: linear-gradient(135deg, color-mix(in srgb, #3fb950 20%, transparent), color-mix(in srgb, #3fb950 5%, transparent));">
				<svg class="w-5 h-5" style="color: #3fb950;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
				</svg>
			</div>
			<span class="text-xs font-medium" style="color: var(--color-text-dim);">New Organization</span>
		</a>
		<a href="/calendar" class="card-glow p-4 flex flex-col items-center gap-2.5 text-center group transition-all duration-200 hover:scale-[1.02]">
			<div class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110" style="background: linear-gradient(135deg, color-mix(in srgb, #e3b341 20%, transparent), color-mix(in srgb, #e3b341 5%, transparent));">
				<svg class="w-5 h-5" style="color: #e3b341;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
				</svg>
			</div>
			<span class="text-xs font-medium" style="color: var(--color-text-dim);">View Calendar</span>
		</a>
	</div>

	<!-- ── Main grid: Projects + Calendar + Issues ─────────────────────────── -->
	<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

		<!-- Active Projects ─────────────────────────────────────────────────── -->
		<section class="animate-fade-up stagger-4">
			<div class="card overflow-hidden h-full">
				<div class="px-5 py-3.5 border-b flex items-center justify-between" style="border-color: var(--glass-border);">
					<div class="flex items-center gap-2">
						<svg class="w-4 h-4" style="color: #06b6d4;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
						</svg>
						<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Active Projects</h2>
					</div>
					<a href="/projects" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--glass-border)] text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[var(--glass-border-hover)] transition-all duration-200">
						View all
					</a>
				</div>

				{#if loading}
					<div class="p-5 flex flex-col gap-3">
						{#each Array(3) as _, i}
							<div class="flex items-center gap-3" style="animation: fade-up 0.3s ease both; animation-delay: {i * 80}ms;">
								<div class="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse" style="background: rgba(255,255,255,0.12);"></div>
								<div class="flex-1">
									<div class="h-3 rounded animate-pulse mb-1.5" style="background: rgba(255,255,255,0.08); width: 55%;"></div>
									<div class="h-2.5 rounded animate-pulse" style="background: rgba(255,255,255,0.05); width: 35%;"></div>
								</div>
								<div class="w-12 h-4 rounded-full animate-pulse" style="background: rgba(255,255,255,0.06);"></div>
							</div>
						{/each}
					</div>
				{:else if topProjects.length === 0}
					<div class="py-10 text-center">
						<svg class="w-8 h-8 mx-auto mb-2 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
						</svg>
						<p class="text-sm mb-2" style="color: var(--color-text-dim);">No projects yet.</p>
						<a href="/projects/new" class="text-xs font-medium animated-link" style="color: var(--color-primary);">Create your first project</a>
					</div>
				{:else}
					<div>
						{#each topProjects as project}
							{@const methodColor = METHODOLOGY_COLORS[project.methodology] ?? '#8b5cf6'}
							<a
								href="/projects/{project.slug}/board"
								class="flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
								style="border-bottom: 1px solid var(--glass-border);"
							>
								<!-- Color dot -->
								<div
									class="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-offset-1 transition-transform duration-200 group-hover:scale-110"
									style="background: {project.color || methodColor}; ring-color: color-mix(in srgb, {project.color || methodColor} 30%, transparent); ring-offset-color: transparent;"
								></div>
								<!-- Name + description -->
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium truncate group-hover:underline" style="color: var(--color-text);">{project.name}</p>
									{#if project.description}
										<p class="text-xs truncate mt-0.5" style="color: var(--color-text-dim);">{project.description}</p>
									{/if}
								</div>
								<!-- Meta badges -->
								<div class="flex items-center gap-2 shrink-0">
									<span class="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
										style="background: color-mix(in srgb, {methodColor} 15%, transparent); color: {methodColor};">
										{project.methodology}
									</span>
									<span class="text-xs tabular-nums" style="color: var(--color-text-dim);">{project.item_count} items</span>
								</div>
							</a>
						{/each}
					</div>
					{#if projectList.length > 4}
						<div class="px-5 py-3 text-center" style="border-top: 1px solid var(--glass-border);">
							<a href="/projects" class="text-xs font-medium animated-link" style="color: var(--color-primary);">
								View all {projectList.length} projects
							</a>
						</div>
					{/if}
				{/if}
			</div>
		</section>

		<!-- Upcoming Events ─────────────────────────────────────────────────── -->
		<section class="animate-fade-up stagger-5">
			<div class="card overflow-hidden h-full">
				<div class="px-5 py-3.5 border-b flex items-center justify-between" style="border-color: var(--glass-border);">
					<div class="flex items-center gap-2">
						<svg class="w-4 h-4" style="color: #e3b341;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Next 7 Days</h2>
					</div>
					<a href="/calendar" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--glass-border)] text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[var(--glass-border-hover)] transition-all duration-200">
						Full calendar
					</a>
				</div>

				{#if loading}
					<div class="p-5 flex flex-col gap-3">
						{#each Array(4) as _, i}
							<div class="flex items-center gap-3" style="animation: fade-up 0.3s ease both; animation-delay: {i * 80}ms;">
								<div class="w-2 h-2 rounded-full shrink-0 animate-pulse" style="background: rgba(255,255,255,0.12);"></div>
								<div class="flex-1">
									<div class="h-3 rounded animate-pulse mb-1.5" style="background: rgba(255,255,255,0.08); width: 65%;"></div>
									<div class="h-2 rounded animate-pulse" style="background: rgba(255,255,255,0.05); width: 40%;"></div>
								</div>
								<div class="w-14 h-4 rounded-full animate-pulse" style="background: rgba(255,255,255,0.06);"></div>
							</div>
						{/each}
					</div>
				{:else if upcomingEvents.length === 0}
					<div class="py-10 text-center">
						<svg class="w-8 h-8 mx-auto mb-2 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
						</svg>
						<p class="text-sm mb-2" style="color: var(--color-text-dim);">No upcoming events.</p>
						<a href="/calendar" class="text-xs font-medium animated-link" style="color: var(--color-primary);">Open calendar</a>
					</div>
				{:else}
					<div>
						{#each upcomingEvents as entry}
							{@const srcColor = entry.color || SOURCE_COLORS[entry.source] || '#8b5cf6'}
							<a
								href={entry.link || '/calendar'}
								class="flex items-center gap-3.5 px-5 py-3.5 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
								style="border-bottom: 1px solid var(--glass-border);"
							>
								<!-- Colored dot -->
								<div class="w-2 h-2 rounded-full shrink-0 mt-0.5" style="background: {srcColor};"></div>
								<!-- Title + source -->
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium truncate group-hover:underline" style="color: var(--color-text);">{entry.title}</p>
									<div class="flex items-center gap-2 mt-0.5">
										<span class="text-[10px] px-1.5 py-0.5 rounded font-medium capitalize"
											style="background: color-mix(in srgb, {srcColor} 15%, transparent); color: {srcColor};">
											{entry.source}
										</span>
										{#if entry.repo_owner && entry.repo_name}
											<span class="text-[10px] truncate" style="color: var(--color-text-dim);">{entry.repo_owner}/{entry.repo_name}</span>
										{/if}
									</div>
								</div>
								<!-- Date -->
								<span class="text-xs font-medium shrink-0 tabular-nums" style="color: var(--color-text-dim);">
									{formatEventDate(entry.start_time)}
								</span>
							</a>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</div>

	<!-- ── Open Issues ─────────────────────────────────────────────────────── -->
	<section class="animate-fade-up stagger-6 mb-6">
		<div class="card overflow-hidden">
			<div class="px-5 py-3.5 border-b flex items-center justify-between" style="border-color: var(--glass-border);">
				<div class="flex items-center gap-2">
					<svg class="w-4 h-4" style="color: var(--color-warning);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<circle cx="12" cy="12" r="10" />
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01" />
					</svg>
					<h2 class="text-sm font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Open Issues</h2>
					{#if stats && stats.open_issues > 0}
						<span class="text-[10px] px-2 py-0.5 rounded-full font-semibold tabular-nums" style="background: var(--color-warning-subtle); color: var(--color-warning);">
							{stats.open_issues}
						</span>
					{/if}
				</div>
				<a href="/explore" class="text-xs font-medium rounded-lg px-2.5 py-1 border border-[var(--glass-border)] text-[var(--color-text)] opacity-60 hover:opacity-100 hover:bg-[rgba(255,255,255,0.03)] hover:border-[var(--glass-border-hover)] transition-all duration-200">
					Explore
				</a>
			</div>

			{#if loading}
				<div class="p-5 flex flex-col gap-3">
					{#each Array(3) as _, i}
						<div class="flex items-center gap-3" style="animation: fade-up 0.3s ease both; animation-delay: {i * 80}ms;">
							<div class="w-8 h-8 rounded-full animate-pulse shrink-0" style="background: rgba(255,255,255,0.06);"></div>
							<div class="flex-1">
								<div class="h-3 rounded animate-pulse mb-1.5" style="background: rgba(255,255,255,0.08); width: 55%;"></div>
								<div class="h-2.5 rounded animate-pulse" style="background: rgba(255,255,255,0.05); width: 35%;"></div>
							</div>
							<div class="w-10 h-5 rounded-full animate-pulse" style="background: rgba(255,255,255,0.06);"></div>
						</div>
					{/each}
				</div>
			{:else if recentIssueActivity.length === 0}
				<div class="py-8 text-center">
					<svg class="w-8 h-8 mx-auto mb-2 opacity-15" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<p class="text-sm" style="color: var(--color-text-dim);">No recent issue activity.</p>
				</div>
			{:else}
				<div>
					{#each recentIssueActivity as item}
						<a
							href="/{item.repo_owner}/{item.repo_name}/issues{item.number ? '/' + item.number : ''}"
							class="flex items-center gap-3 px-5 py-3.5 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
							style="border-bottom: 1px solid var(--glass-border);"
						>
							<Avatar username={item.author} size={32} />
							<div class="flex-1 min-w-0">
								<p class="text-sm font-medium truncate group-hover:underline" style="color: var(--color-text);">
									{item.title}
								</p>
								<div class="flex items-center gap-2 mt-0.5">
									<span class="text-xs" style="color: var(--color-primary);">
										{item.repo_owner}/{item.repo_name}
									</span>
									<span class="text-[10px]" style="color: var(--color-text-dim);">{timeAgo(item.created_at)}</span>
								</div>
							</div>
							{#if item.number}
								<span class="text-xs font-mono shrink-0 tabular-nums" style="color: var(--color-text-dim);">#{item.number}</span>
							{/if}
						</a>
					{/each}
				</div>
				{#if stats && stats.open_issues > 5}
					<div class="px-5 py-3 text-center" style="border-top: 1px solid var(--glass-border);">
						<a href="/explore" class="text-xs font-medium animated-link" style="color: var(--color-primary);">
							{stats.open_issues} total open issues across all repos
						</a>
					</div>
				{/if}
			{/if}
		</div>
	</section>

	<!-- ── Inline sidebar for screens without right panel ─────────────────── -->
	<div class="mt-2 grid grid-cols-1 md:grid-cols-2 gap-6 3xl:hidden">
		<OrgsSection />
		<ShortCutsBox />

		<!-- Quick Links inline -->
		<section>
			<h2 class="text-[var(--color-text)] text-sm font-semibold uppercase tracking-wider opacity-70 mb-4">Quick Links</h2>
			<div class="card overflow-hidden">
				{#each quickLinks as link}
					<a
						href={link.href}
						class="flex items-center gap-3 px-4 py-3 transition-colors duration-150 group hover:bg-[rgba(255,255,255,0.03)]"
						style="border-bottom: 1px solid var(--glass-border);"
					>
						<div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background: rgba(255,255,255,0.06);">
							{#if link.icon === 'profile'}
								<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
								</svg>
							{:else if link.icon === 'star'}
								<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
								</svg>
							{:else if link.icon === 'org'}
								<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
								</svg>
							{:else}
								<svg class="w-3.5 h-3.5" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
									<path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
									<path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
								</svg>
							{/if}
						</div>
						<span class="text-sm text-[var(--color-text)] opacity-70 group-hover:opacity-100 transition-opacity duration-150">{link.label}</span>
					</a>
				{/each}
			</div>
		</section>

		<!-- Activity inline -->
		<section>
			<ActivityFeed />
		</section>
	</div>
</PageShell>
{/if}
