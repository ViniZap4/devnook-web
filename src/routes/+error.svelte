<script>
	import { page } from '$app/stores';
	import { themeStore } from '$lib/stores/theme.svelte';
</script>

<div class="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
	<div class="flex items-center gap-3 mb-4">
		<div class="w-3 h-3 rounded-full" style="background-color: var(--color-primary);"></div>
		<span class="text-[var(--color-text)] font-bold text-lg tracking-tight">Dev Nook</span>
	</div>

	<div class="text-center">
		<h1 class="text-[var(--color-text)] opacity-10 font-bold" style="font-size: 8rem; line-height: 1;">{$page.status}</h1>
		<p class="text-[var(--color-text)] opacity-50 text-lg -mt-2">{$page.error?.message ?? 'Page not found'}</p>
	</div>

	<div class="flex items-center gap-3 mt-4">
		<a href="/dashboard" class="px-5 py-2.5 text-sm font-medium text-white rounded-lg transition-opacity hover:opacity-90" style="background-color: var(--color-primary);">
			Go to Dashboard
		</a>
		<a href="/explore" class="px-5 py-2.5 text-sm text-[var(--color-text)] opacity-60 border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-surface)] transition-colors">
			Explore
		</a>
	</div>
</div>
