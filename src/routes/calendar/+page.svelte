<script lang="ts">
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import { calendar } from '$lib/services/api';
	import type { CalendarEntry } from '$lib/types/calendar';
	import PageShell from '$lib/components/PageShell.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	// ─── State ────────────────────────────────────────────────────────────────
	let viewYear = $state(new Date().getFullYear());
	let viewMonth = $state(new Date().getMonth()); // 0-indexed

	let entries = $state<CalendarEntry[]>([]);
	let loading = $state(true);
	let fetchId = 0; // plain variable — NOT $state to avoid infinite $effect loop

	// Create form state
	let selectedDay = $state<Date | null>(null);
	let showForm = $state(false);
	let formTitle = $state('');
	let formType = $state<'event' | 'meeting' | 'deadline' | 'reminder'>('event');
	let formAllDay = $state(true);
	let formStartTime = $state('09:00');
	let formEndTime = $state('10:00');
	let formColor = $state('#8b5cf6');
	let submitting = $state(false);

	// View toggle (month is primary; week is a stub)
	let view = $state<'month' | 'week'>('month');

	// ─── Helper Functions ─────────────────────────────────────────────────────
	const today = $derived((() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); })());

	function isSameDay(a: Date, b: Date): boolean {
		return (
			a.getFullYear() === b.getFullYear() &&
			a.getMonth() === b.getMonth() &&
			a.getDate() === b.getDate()
		);
	}

	function isToday(d: Date): boolean {
		return isSameDay(d, today);
	}

	function formatMonthYear(year: number, month: number): string {
		return new Date(year, month, 1).toLocaleDateString('en-US', {
			month: 'long',
			year: 'numeric'
		});
	}

	function dateKey(d: Date): string {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
	}

	/** Returns all day cells for the month grid, including padding from adjacent months. */
	function getDaysInMonth(year: number, month: number): Date[] {
		const first = new Date(year, month, 1);
		// 0=Sun … 6=Sat — shift so week starts Monday (Mon=0 … Sun=6)
		let startDow = first.getDay(); // 0=Sun
		startDow = startDow === 0 ? 6 : startDow - 1; // convert to Mon-based

		const days: Date[] = [];
		// Padding days from previous month
		for (let i = startDow - 1; i >= 0; i--) {
			days.push(new Date(year, month, -i));
		}
		// Days of current month
		const lastDay = new Date(year, month + 1, 0).getDate();
		for (let d = 1; d <= lastDay; d++) {
			days.push(new Date(year, month, d));
		}
		// Padding days from next month to fill the last row
		const remainder = days.length % 7;
		if (remainder !== 0) {
			const needed = 7 - remainder;
			for (let d = 1; d <= needed; d++) {
				days.push(new Date(year, month + 1, d));
			}
		}
		return days;
	}

	function isCurrentMonth(day: Date): boolean {
		return day.getMonth() === viewMonth && day.getFullYear() === viewYear;
	}

	// Pre-group entries by date key for O(1) lookup per cell instead of O(n)
	const entriesByDay = $derived((() => {
		const map = new Map<string, CalendarEntry[]>();
		for (const e of entries) {
			const key = dateKey(new Date(e.start_time));
			const arr = map.get(key);
			if (arr) arr.push(e);
			else map.set(key, [e]);
		}
		return map;
	})());

	function entriesForDay(day: Date): CalendarEntry[] {
		return entriesByDay.get(dateKey(day)) ?? [];
	}

	// ─── Data Fetching ────────────────────────────────────────────────────────
	$effect(() => {
		if (!userStore.isLoggedIn) {
			goto('/');
			return;
		}

		// Track viewYear/viewMonth as dependencies
		const _y = viewYear;
		const _m = viewMonth;
		const id = ++fetchId;
		loading = true;

		// Fetch range covers the full visible grid (padding days from adjacent months)
		const days = getDaysInMonth(_y, _m);
		const start = days[0];
		const end = days[days.length - 1];
		const endEOD = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);

		calendar
			.unified(start.toISOString(), endEOD.toISOString())
			.then((data) => {
				if (id !== fetchId) return;
				entries = data;
			})
			.catch(() => {
				if (id !== fetchId) return;
				entries = [];
			})
			.finally(() => {
				if (id !== fetchId) return;
				loading = false;
			});
	});

	// ─── Navigation ───────────────────────────────────────────────────────────
	function prevMonth() {
		if (viewMonth === 0) {
			viewMonth = 11;
			viewYear -= 1;
		} else {
			viewMonth -= 1;
		}
	}

	function nextMonth() {
		if (viewMonth === 11) {
			viewMonth = 0;
			viewYear += 1;
		} else {
			viewMonth += 1;
		}
	}

	function goToday() {
		const now = new Date();
		viewYear = now.getFullYear();
		viewMonth = now.getMonth();
	}

	// ─── Day Click / Form ─────────────────────────────────────────────────────
	function openDayForm(day: Date) {
		selectedDay = day;
		formTitle = '';
		formType = 'event';
		formAllDay = true;
		formStartTime = '09:00';
		formEndTime = '10:00';
		formColor = '#8b5cf6';
		showForm = true;
	}

	function closeForm() {
		showForm = false;
		selectedDay = null;
	}

	async function submitEvent() {
		if (!formTitle.trim() || !selectedDay || submitting) return;
		submitting = true;

		try {
			const dateStr = selectedDay.toISOString().slice(0, 10);
			const startTime = formAllDay
				? `${dateStr}T00:00:00Z`
				: `${dateStr}T${formStartTime}:00Z`;
			const endTime = formAllDay
				? undefined
				: `${dateStr}T${formEndTime}:00Z`;

			await calendar.createEvent({
				title: formTitle.trim(),
				type: formType,
				start_time: startTime,
				end_time: endTime,
				all_day: formAllDay,
				color: formColor
			});

			toastStore.success('Event created');
			closeForm();

			// Refetch via the same range the $effect uses
			const days = getDaysInMonth(viewYear, viewMonth);
			const start = days[0];
			const end = days[days.length - 1];
			const endEOD = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59);
			const id = ++fetchId; // bump fetchId to cancel any in-flight $effect fetch
			const fresh = await calendar.unified(start.toISOString(), endEOD.toISOString());
			if (id === fetchId) entries = fresh;
		} catch (err) {
			toastStore.error(err instanceof Error ? err.message : 'Failed to create event');
		} finally {
			submitting = false;
		}
	}

	// ─── Source badge helpers ─────────────────────────────────────────────────
	const sourceLabels: Record<string, string> = {
		event: 'EV',
		milestone: 'MS',
		sprint: 'SP',
		issue: 'IS'
	};

	const sourceBgVars: Record<string, string> = {
		event: 'var(--color-primary-subtle)',
		milestone: 'var(--color-success-subtle)',
		sprint: 'var(--color-info-subtle)',
		issue: 'var(--color-warning-subtle)'
	};

	const sourceColorVars: Record<string, string> = {
		event: 'var(--color-primary)',
		milestone: 'var(--color-success)',
		sprint: 'var(--color-info)',
		issue: 'var(--color-warning)'
	};

	// ─── Derived ──────────────────────────────────────────────────────────────
	const gridDays = $derived(getDaysInMonth(viewYear, viewMonth));
	const monthLabel = $derived(formatMonthYear(viewYear, viewMonth));

	const colorOptions = [
		{ value: '#8b5cf6', label: 'Purple' },
		{ value: '#3b82f6', label: 'Blue' },
		{ value: '#10b981', label: 'Green' },
		{ value: '#f59e0b', label: 'Amber' },
		{ value: '#ef4444', label: 'Red' },
		{ value: '#ec4899', label: 'Pink' },
		{ value: '#06b6d4', label: 'Cyan' }
	];
</script>

<PageShell width="wide">
	<div class="content-reveal flex flex-col gap-5">

		<!-- ─── Page Header ──────────────────────────────────────────────────── -->
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up stagger-1">
			<div class="flex items-center gap-3">
				<div
					class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
					style="background: var(--color-primary-subtle);"
				>
					<svg class="w-5 h-5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
				</div>
				<div>
					<h1 class="text-xl font-bold" style="color: var(--color-text);">Calendar</h1>
					<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">
						Events, milestones, sprints, and deadlines in one place
					</p>
				</div>
			</div>

			<!-- View toggle — matches issues page Open/Closed pattern -->
			<div class="glass-subtle rounded-xl p-1 flex items-center self-start sm:self-auto">
				<button
					class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300"
					style="
						color: {view === 'month' ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {view === 'month' ? 'var(--color-primary-subtle)' : 'transparent'};
						font-weight: {view === 'month' ? '600' : '400'};
					"
					onclick={() => (view = 'month')}
				>Month</button>
				<button
					class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300"
					style="
						color: {view === 'week' ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {view === 'week' ? 'var(--color-primary-subtle)' : 'transparent'};
						font-weight: {view === 'week' ? '600' : '400'};
					"
					onclick={() => (view = 'week')}
				>Week</button>
			</div>
		</div>

		<!-- ─── Calendar Card ───────────────────────────────────────────────── -->
		<div class="card overflow-hidden animate-fade-up stagger-2">

			<!-- Month navigation bar -->
			<div
				class="flex items-center justify-between px-5 py-3.5"
				style="border-bottom: 1px solid var(--glass-border); background: rgba(255,255,255,0.02);"
			>
				<div class="flex items-center gap-2">
					<button
						onclick={prevMonth}
						class="cal-nav-btn w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
						style="color: var(--color-text-dim);"
						aria-label="Previous month"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
						</svg>
					</button>
					<button
						onclick={nextMonth}
						class="cal-nav-btn w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150"
						style="color: var(--color-text-dim);"
						aria-label="Next month"
					>
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
						</svg>
					</button>
					<h2 class="text-base font-semibold ml-1" style="color: var(--color-text);">
						{monthLabel}
					</h2>
					{#if loading}
						<Spinner size="xs" />
					{/if}
				</div>

				<button
					onclick={goToday}
					class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 hover:brightness-110"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent)); color: white;"
				>
					Today
				</button>
			</div>

			{#if view === 'month'}
				<!-- Day-of-week headers -->
				<div class="grid grid-cols-7" style="border-bottom: 1px solid var(--glass-border);">
					{#each ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as dow, i}
						<div
							class="py-2.5 text-center text-[0.65rem] font-semibold uppercase tracking-wider"
							style="color: var(--color-text-dim); {i < 6 ? 'border-right: 1px solid var(--glass-border);' : ''}"
						>
							{dow}
						</div>
					{/each}
				</div>

				<!-- Day cells grid — subtle opacity reduction while loading -->
				<div class="grid grid-cols-7 transition-opacity duration-300" style="opacity: {loading ? '0.5' : '1'};">
					{#each gridDays as day, idx}
						{@const dayEntries = entriesForDay(day)}
						{@const inMonth = isCurrentMonth(day)}
						{@const todayDay = isToday(day)}
						{@const colPos = idx % 7}
						{@const rowCount = Math.ceil(gridDays.length / 7)}
						{@const rowIdx = Math.floor(idx / 7)}
						{@const isLastRow = rowIdx === rowCount - 1}
						{@const isLastCol = colPos === 6}
						<button
							class="day-cell group relative flex flex-col min-h-[96px] p-1.5 text-left transition-all duration-150 focus:outline-none"
							style="{!isLastRow ? 'border-bottom: 1px solid var(--glass-border);' : ''}{!isLastCol ? 'border-right: 1px solid var(--glass-border);' : ''}"
							onclick={() => openDayForm(day)}
							title="Add event on {day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}"
						>
							<!-- Day number -->
							<div class="flex items-center justify-between mb-1">
								<span
									class="w-7 h-7 flex items-center justify-center text-xs font-semibold rounded-full transition-colors duration-150"
									style={todayDay
										? 'background: var(--color-primary); color: white;'
										: inMonth
											? 'color: var(--color-text);'
											: 'color: var(--color-text-dim); opacity: 0.35;'}
								>
									{day.getDate()}
								</span>
								{#if dayEntries.length > 0}
									<span
										class="text-[0.55rem] font-bold opacity-0 group-hover:opacity-60 transition-opacity duration-150"
										style="color: var(--color-primary);"
									>+</span>
								{/if}
							</div>

							<!-- Events list -->
							<div class="flex flex-col gap-0.5 w-full overflow-hidden">
								{#each dayEntries.slice(0, 3) as entry}
									{#if entry.link}
										<a
											href={entry.link}
											class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-medium truncate transition-opacity duration-100 hover:opacity-80"
											style="background: {entry.color}22; border-left: 2px solid {entry.color}; color: var(--color-text);"
											onclick={(e) => e.stopPropagation()}
											title={entry.title}
										>
											<span class="w-1.5 h-1.5 rounded-full shrink-0" style="background: {entry.color};"></span>
											<span class="truncate">{entry.title}</span>
											<span
												class="ml-auto shrink-0 text-[0.5rem] px-0.5 rounded font-bold uppercase tracking-wide"
												style="background: {sourceBgVars[entry.source] ?? 'rgba(255,255,255,0.08)'}; color: {sourceColorVars[entry.source] ?? 'var(--color-text-dim)'};"
											>
												{sourceLabels[entry.source] ?? 'EV'}
											</span>
										</a>
									{:else}
										<span
											class="flex items-center gap-1 px-1.5 py-0.5 rounded text-[0.6rem] font-medium truncate"
											style="background: {entry.color}22; border-left: 2px solid {entry.color}; color: var(--color-text);"
											title={entry.title}
										>
											<span class="w-1.5 h-1.5 rounded-full shrink-0" style="background: {entry.color};"></span>
											<span class="truncate">{entry.title}</span>
											<span
												class="ml-auto shrink-0 text-[0.5rem] px-0.5 rounded font-bold uppercase tracking-wide"
												style="background: {sourceBgVars[entry.source] ?? 'rgba(255,255,255,0.08)'}; color: {sourceColorVars[entry.source] ?? 'var(--color-text-dim)'};"
											>
												{sourceLabels[entry.source] ?? 'EV'}
											</span>
										</span>
									{/if}
								{/each}

								{#if dayEntries.length > 3}
									<span
										class="text-[0.55rem] px-1.5 py-0.5 font-medium rounded"
										style="color: var(--color-text-dim); background: rgba(255,255,255,0.04);"
									>
										+{dayEntries.length - 3} more
									</span>
								{/if}
							</div>
						</button>
					{/each}
				</div>

			{:else}
				<!-- Week view stub -->
				<div class="py-24 flex flex-col items-center gap-3">
					<svg class="w-12 h-12 opacity-10" style="color: var(--color-text);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
						<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
					</svg>
					<p class="text-sm font-medium" style="color: var(--color-text-dim);">Week view coming soon</p>
				</div>
			{/if}
		</div>

		<!-- ─── Legend ───────────────────────────────────────────────────────── -->
		<div class="flex flex-wrap items-center gap-4 px-1 animate-fade-up stagger-3">
			<span class="text-xs font-medium uppercase tracking-wider" style="color: var(--color-text-dim);">Sources</span>
			{#each Object.entries(sourceLabels) as [source, label]}
				<div class="flex items-center gap-1.5">
					<span
						class="text-[0.5rem] px-1 py-0.5 rounded font-bold uppercase tracking-wide"
						style="background: {sourceBgVars[source]}; color: {sourceColorVars[source]};"
					>{label}</span>
					<span class="text-xs capitalize" style="color: var(--color-text-dim);">{source}</span>
				</div>
			{/each}
		</div>

	</div>
</PageShell>

<!-- ─── Create Event Overlay ──────────────────────────────────────────────── -->
{#if showForm}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-40 flex items-center justify-center p-4"
		style="background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);"
		onclick={(e) => { if (e.target === e.currentTarget) closeForm(); }}
		role="dialog"
		aria-modal="true"
		aria-label="Create event"
	>
		<div
			class="glass-strong rounded-2xl w-full max-w-sm flex flex-col gap-4 p-5 animate-fade-up-sm"
			style="border: 1px solid var(--glass-border);"
			onclick={(e) => e.stopPropagation()}
			role="presentation"
		>
			<!-- Form header -->
			<div class="flex items-center justify-between">
				<div>
					<h3 class="text-sm font-semibold" style="color: var(--color-text);">New Event</h3>
					{#if selectedDay}
						<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">
							{selectedDay.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
						</p>
					{/if}
				</div>
				<button
					onclick={closeForm}
					class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors cal-nav-btn"
					style="color: var(--color-text-dim);"
					aria-label="Close"
				>
					<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Title -->
			<div>
				<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Title</label>
				<input
					type="text"
					bind:value={formTitle}
					placeholder="Event title..."
					autofocus
					class="input-field focus:border-[var(--color-primary)]"
					onkeydown={(e) => { if (e.key === 'Enter') submitEvent(); }}
				/>
			</div>

			<!-- Type -->
			<div>
				<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Type</label>
				<div class="grid grid-cols-2 gap-1.5">
					{#each (['event', 'meeting', 'deadline', 'reminder'] as const) as t}
						<button
							class="py-2 text-xs font-medium rounded-lg border transition-all duration-150 capitalize"
							style={formType === t
								? 'background: var(--color-primary-subtle); border-color: var(--color-primary); color: var(--color-primary);'
								: 'background: rgba(255,255,255,0.03); border-color: var(--glass-border); color: var(--color-text-dim);'}
							onclick={() => (formType = t)}
						>{t}</button>
					{/each}
				</div>
			</div>

			<!-- All-day toggle -->
			<label class="flex items-center gap-3 cursor-pointer select-none">
				<div
					class="relative w-9 h-5 rounded-full transition-colors duration-200"
					style={formAllDay ? 'background: var(--color-primary);' : 'background: rgba(255,255,255,0.1);'}
				>
					<span
						class="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow"
						style={formAllDay ? 'transform: translateX(16px);' : ''}
					></span>
					<input type="checkbox" bind:checked={formAllDay} class="sr-only" />
				</div>
				<span class="text-xs font-medium" style="color: var(--color-text);">All day</span>
			</label>

			<!-- Time fields (shown when not all-day) -->
			{#if !formAllDay}
				<div class="grid grid-cols-2 gap-3 animate-fade-up-sm">
					<div>
						<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Start time</label>
						<input
							type="time"
							bind:value={formStartTime}
							class="input-field focus:border-[var(--color-primary)]"
						/>
					</div>
					<div>
						<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">End time</label>
						<input
							type="time"
							bind:value={formEndTime}
							class="input-field focus:border-[var(--color-primary)]"
						/>
					</div>
				</div>
			{/if}

			<!-- Color picker -->
			<div>
				<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Color</label>
				<div class="flex items-center gap-2">
					{#each colorOptions as opt}
						<button
							class="w-6 h-6 rounded-full transition-all duration-150 hover:scale-110 focus:outline-none"
							style="background: {opt.value}; {formColor === opt.value ? 'outline: 2px solid white; outline-offset: 2px;' : ''}"
							onclick={() => (formColor = opt.value)}
							aria-label={opt.label}
							title={opt.label}
						></button>
					{/each}
				</div>
			</div>

			<!-- Actions -->
			<div class="flex items-center justify-end gap-2 pt-1">
				<button
					onclick={closeForm}
					class="cal-nav-btn px-3 py-2 text-xs font-medium rounded-lg transition-colors"
					style="color: var(--color-text-dim);"
				>Cancel</button>
				<button
					onclick={submitEvent}
					disabled={!formTitle.trim() || submitting}
					class="btn-glow flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-lg text-white transition-all duration-150 disabled:opacity-40 hover:brightness-110"
					style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));"
				>
					{#if submitting}
						<Spinner size="xs" />
						Creating...
					{:else}
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
						</svg>
						Create Event
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Day cell hover — cannot use Tailwind arbitrary value with CSS var inside hover: */
	.day-cell:hover {
		background: rgba(255, 255, 255, 0.03);
	}

	/* Focus ring for day cells using CSS var */
	.day-cell:focus-visible {
		box-shadow: inset 0 0 0 1px var(--color-primary);
	}

	/* Nav / close button hover */
	.cal-nav-btn:hover {
		background: rgba(255, 255, 255, 0.06);
	}
</style>
