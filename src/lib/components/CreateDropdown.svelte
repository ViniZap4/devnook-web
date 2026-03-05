<script lang="ts">
	let open = $state(false);
</script>

<div class="relative">
	<button
		class="flex items-center gap-1 px-2.5 py-1.5 text-sm rounded-lg border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors"
		onclick={() => { open = !open; }}
		aria-label="Create new"
	>
		<svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
			<path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"/>
		</svg>
		<svg class="w-3 h-3 opacity-50" viewBox="0 0 12 12" fill="currentColor">
			<path d="M6 8.825a.5.5 0 0 1-.354-.146l-3.5-3.5a.5.5 0 1 1 .708-.708L6 7.618l3.146-3.147a.5.5 0 1 1 .708.708l-3.5 3.5A.5.5 0 0 1 6 8.825Z"/>
		</svg>
	</button>

	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-40" onclick={() => { open = false; }} onkeydown={() => {}}></div>
		<div class="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] shadow-2xl overflow-hidden animate-scale-in-center">
			<div class="py-1">
				<a href="/new" class="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors" onclick={() => { open = false; }}>
					<svg class="w-4 h-4 opacity-50" viewBox="0 0 16 16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8Z"/></svg>
					New repository
				</a>
				<a href="/orgs/new" class="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)] transition-colors" onclick={() => { open = false; }}>
					<svg class="w-4 h-4 opacity-50" viewBox="0 0 16 16" fill="currentColor"><path d="M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.64 1.094c.487.325.778.862.778 1.44v5.59A1.75 1.75 0 0 1 14.75 16Z"/></svg>
					New organization
				</a>
			</div>
		</div>
	{/if}
</div>
