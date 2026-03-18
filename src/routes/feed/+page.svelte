<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { posts } from '$lib/services/api';
	import type { Post, PostComment } from '$lib/types/post';
	import PageShell from '$lib/components/PageShell.svelte';
	import FeedComposer from '$lib/components/FeedComposer.svelte';
	import FeedPost from '$lib/components/FeedPost.svelte';
	import FeedTabs from '$lib/components/FeedTabs.svelte';
	import FeedProfileCard from '$lib/components/FeedProfileCard.svelte';
	import TrendingRepos from '$lib/components/TrendingRepos.svelte';
	import SuggestedDevelopers from '$lib/components/SuggestedDevelopers.svelte';
	import Spinner from '$lib/components/Spinner.svelte';

	let feedPosts = $state<Post[]>([]);
	let loading = $state(true);
	let tab = $state('foryou');
	let posting = $state(false);

	const feedTabs = [
		{ id: 'foryou', label: 'For You' },
		{ id: 'following', label: 'Following' },
		{ id: 'global', label: 'Global' },
	];

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		try {
			const result = await posts.feed();
			feedPosts = result.posts;
		} catch {
			feedPosts = [];
		} finally {
			loading = false;
		}
	}

	async function handlePost(data: { content: string; type: 'text' | 'code'; repoRef: string }) {
		if (posting) return;
		posting = true;
		try {
			const payload: Parameters<typeof posts.create>[0] = {
				content: data.content,
				type: data.type,
			};
			if (data.repoRef.includes('/')) {
				const [owner, name] = data.repoRef.split('/');
				payload.repo_owner = owner;
				payload.repo_name = name;
			}
			await posts.create(payload);
			const result = await posts.feed();
			feedPosts = result.posts;
		} catch { /* ignore */ }
		finally { posting = false; }
	}

	async function toggleLike(post: Post) {
		try {
			if (post.liked) {
				await posts.unlike(post.id);
				post.liked = false;
				post.likes_count--;
			} else {
				await posts.like(post.id);
				post.liked = true;
				post.likes_count++;
			}
		} catch { /* ignore */ }
	}

	async function handleComment(post: Post, content: string) {
		await posts.addComment(post.id, { content });
		post.comments_count++;
	}

	function handleDeleteComment(post: Post, commentId: number) {
		posts.removeComment(post.id, commentId).then(() => {
			post.comments_count = Math.max(0, post.comments_count - 1);
		}).catch(() => {});
	}

	async function handleRepost(post: Post) {
		try {
			await posts.repost(post.id);
			post.reposted = true;
			post.reposts_count++;
		} catch { /* ignore */ }
	}

	async function fetchComments(postId: number): Promise<PostComment[]> {
		try { return await posts.comments(postId); }
		catch { return []; }
	}

</script>

<PageShell width="wide">
	<div class="feed-grid">
		<!-- Left panel: user profile -->
		<aside class="feed-left">
			<div class="sticky-panel">
				<FeedProfileCard />
			</div>
		</aside>

		<!-- Center: feed -->
		<div class="feed-center">
			<!-- Composer -->
			<FeedComposer
				username={userStore.user?.username ?? '?'}
				onsubmit={handlePost}
			/>

			<!-- Tabs -->
			<div class="feed-tabs-wrapper">
				<FeedTabs bind:activeTab={tab} tabs={feedTabs} />
			</div>

			<!-- Feed content -->
			{#if loading}
				<div class="py-20 flex flex-col items-center gap-3">
					<Spinner size="md" />
				</div>
			{:else if feedPosts.length === 0}
				<div class="empty-state">
					<svg class="w-12 h-12 mx-auto mb-4 opacity-20" style="color: var(--color-text-dim);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
					<p class="text-[15px] font-medium" style="color: var(--color-text-dim);">No posts yet</p>
					<p class="text-[13px] mt-1" style="color: var(--color-text-dim); opacity: 0.6;">Be the first to share something with the community.</p>
				</div>
			{:else}
				<div class="feed-posts">
					{#each feedPosts as post, i}
						<div class="feed-post-wrapper" style="animation-delay: {Math.min(i, 8) * 50}ms;">
							<FeedPost
								{post}
								currentUsername={userStore.user?.username ?? ''}
								onlike={toggleLike}
								oncomment={handleComment}
								ondeletecomment={handleDeleteComment}
								onrepost={handleRepost}
								loadComments={fetchComments}
							/>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Right panel: trending + suggested -->
		<aside class="feed-right">
			<div class="sticky-panel">
				<TrendingRepos />
				<SuggestedDevelopers />
			</div>
		</aside>
	</div>
</PageShell>

<style>
	.feed-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 24px;
		max-width: 1400px;
		margin: 0 auto;
	}

	.feed-left {
		display: none;
	}

	.feed-right {
		display: none;
	}

	.sticky-panel {
		position: sticky;
		top: 24px;
	}

	.feed-center {
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.feed-tabs-wrapper {
		border-radius: 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
		overflow: hidden;
	}

	.feed-posts {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.empty-state {
		padding: 80px 20px;
		text-align: center;
		border-radius: 16px;
		background: var(--glass-bg);
		backdrop-filter: blur(16px);
		-webkit-backdrop-filter: blur(16px);
		border: 1px solid var(--glass-border);
	}

	/* Show right panel at 1280px+ */
	@media (min-width: 1280px) {
		.feed-grid {
			grid-template-columns: 1fr 300px;
		}
		.feed-right {
			display: block;
		}
	}

	/* Show left panel at 1600px+ */
	@media (min-width: 1600px) {
		.feed-grid {
			grid-template-columns: 260px 1fr 300px;
		}
		.feed-left {
			display: block;
		}
	}

	/* Staggered entrance for feed posts */
	.feed-post-wrapper {
		animation: fadeSlideIn 300ms ease forwards;
		opacity: 0;
	}

	@keyframes fadeSlideIn {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
