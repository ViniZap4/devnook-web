<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	const slug = $derived($page.params.slug!);

	$effect(() => {
		goto(`/projects/${slug}/board`, { replaceState: true });
	});
</script>
