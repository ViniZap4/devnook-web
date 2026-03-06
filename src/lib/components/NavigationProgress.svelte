<script lang="ts">
	import { navigating } from '$app/stores';
</script>

{#if $navigating}
	<div class="nav-progress-indeterminate" aria-hidden="true"></div>
{/if}
