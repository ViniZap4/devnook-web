<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
</script>

<footer class="border-t border-white/[0.04] mt-auto">
	<div class="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
		<div class="flex items-center gap-2">
			<div class="w-2 h-2 rounded-full" style="background-color: #{themeStore.colors[0]};"></div>
			<span class="text-xs text-[var(--color-text)] opacity-30">Dev Nook</span>
		</div>
		<nav class="flex items-center gap-4">
			<a href="/explore" class="text-xs text-[var(--color-text)] opacity-20 hover:opacity-50 transition-opacity">Explore</a>
			<a href="/dashboard" class="text-xs text-[var(--color-text)] opacity-20 hover:opacity-50 transition-opacity">Dashboard</a>
		</nav>
	</div>
</footer>
