<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/user.svelte';
	import { users, posts } from '$lib/services/api';
	import type { ActivityItem } from '$lib/services/api';
	import type { Post } from '$lib/types/post';
	import PageShell from '$lib/components/PageShell.svelte';
	import RelativeTime from '$lib/components/RelativeTime.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	let items = $state<ActivityItem[]>([]);
	let feedPosts = $state<Post[]>([]);
	let loading = $state(true);
	let visible = $state(false);
	let tab = $state<'feed' | 'posts' | 'activity'>('feed');

	// Post composer
	let composerOpen = $state(false);
	let postContent = $state('');
	let postType = $state<'text' | 'code'>('text');
	let posting = $state(false);
	let repoRef = $state('');

	onMount(async () => {
		if (!userStore.isLoggedIn) { goto('/'); return; }
		await loadAll();
	});

	async function loadAll() {
		loading = true;
		visible = false;
		try {
			const [activity, postData] = await Promise.allSettled([
				users.activity(),
				posts.feed()
			]);
			items = activity.status === 'fulfilled' ? activity.value : [];
			feedPosts = postData.status === 'fulfilled' ? postData.value.posts : [];
		} catch {
			items = [];
			feedPosts = [];
		} finally {
			loading = false;
			requestAnimationFrame(() => { visible = true; });
		}
	}

	async function submitPost() {
		if (!postContent.trim() || posting) return;
		posting = true;
		try {
			const data: Parameters<typeof posts.create>[0] = {
				content: postContent,
				type: postType,
			};
			if (repoRef.includes('/')) {
				const [owner, name] = repoRef.split('/');
				data.repo_owner = owner;
				data.repo_name = name;
			}
			await posts.create(data);
			postContent = '';
			repoRef = '';
			composerOpen = false;
			const result = await posts.feed();
			feedPosts = result.posts;
		} catch {
			// ignore
		} finally {
			posting = false;
		}
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

	function icon(type: string) {
		if (type === 'issue') return { color: 'var(--color-success)', label: 'Issue', svg: '<circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4m0 4h.01"/>' };
		if (type === 'pull_request') return { color: 'var(--color-secondary)', label: 'PR', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>' };
		if (type === 'release') return { color: 'var(--color-primary)', label: 'Release', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"/>' };
		if (type === 'star') return { color: 'var(--color-warning)', label: 'Star', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>' };
		if (type === 'push') return { color: 'var(--color-info)', label: 'Push', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12"/>' };
		if (type === 'comment') return { color: 'var(--color-accent)', label: 'Comment', svg: '<path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>' };
		return { color: 'var(--color-text-dim)', label: type, svg: '<circle cx="12" cy="12" r="3"/>' };
	}
</script>

<PageShell maxWidth="max-w-3xl">
	<div class="flex flex-col gap-6">
		<div class="flex items-center justify-between page-header">
			<h1 class="text-xl font-bold" style="color: var(--color-text);">Feed</h1>
		</div>

		<!-- Tabs -->
		<div class="flex items-center gap-1 glass-subtle rounded-xl p-1 self-start">
			{#each [['feed', 'For You'], ['posts', 'Posts'], ['activity', 'Activity']] as [val, label]}
				<button
					class="px-4 py-2 text-xs rounded-lg transition-all duration-200 font-medium"
					style="
						color: {tab === val ? 'var(--color-primary)' : 'var(--color-text-dim)'};
						background: {tab === val ? 'color-mix(in srgb, var(--color-primary) 12%, transparent)' : 'transparent'};
					"
					onclick={() => { tab = val as typeof tab; }}
				>{label}</button>
			{/each}
		</div>

		<!-- Post Composer -->
		{#if tab !== 'activity'}
			<div class="card overflow-hidden animate-fade-up-sm">
				{#if !composerOpen}
					<button
						class="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
						style="color: var(--color-text-dim);"
						onclick={() => { composerOpen = true; }}
						onmouseenter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover)'; }}
						onmouseleave={(e) => { e.currentTarget.style.background = 'transparent'; }}
					>
						<Avatar username={userStore.user?.username ?? '?'} size={32} />
						<span class="text-sm">Share something with the community...</span>
					</button>
				{:else}
					<div class="p-4 flex flex-col gap-3">
						<div class="flex items-center gap-3">
							<Avatar username={userStore.user?.username ?? '?'} size={32} />
							<span class="text-sm font-medium" style="color: var(--color-text);">@{userStore.user?.username}</span>
							<div class="flex items-center gap-1 ml-auto glass-subtle rounded-lg p-0.5">
								<button
									class="px-2 py-1 text-[0.625rem] rounded-md transition-colors"
									style="color: {postType === 'text' ? 'var(--color-primary)' : 'var(--color-text-dim)'}; background: {postType === 'text' ? 'var(--color-primary)15' : 'transparent'};"
									onclick={() => { postType = 'text'; }}
								>Text</button>
								<button
									class="px-2 py-1 text-[0.625rem] rounded-md transition-colors font-mono"
									style="color: {postType === 'code' ? 'var(--color-primary)' : 'var(--color-text-dim)'}; background: {postType === 'code' ? 'var(--color-primary)15' : 'transparent'};"
									onclick={() => { postType = 'code'; }}
								>Code</button>
							</div>
						</div>
						<textarea
							bind:value={postContent}
							placeholder={postType === 'code' ? 'Paste your code snippet...' : "What's on your mind?"}
							class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent resize-none {postType === 'code' ? 'font-mono text-xs' : ''}"
							style="border-color: var(--color-border); color: var(--color-text); min-height: 80px;"
							rows="3"
						></textarea>
						<div class="flex items-center justify-between">
							<input
								type="text"
								bind:value={repoRef}
								placeholder="Link repo (owner/name)"
								class="px-3 py-1.5 text-xs rounded-lg border bg-transparent w-48"
								style="border-color: var(--color-border); color: var(--color-text);"
							/>
							<div class="flex items-center gap-2">
								<button class="text-xs" style="color: var(--color-text-dim);" onclick={() => { composerOpen = false; postContent = ''; }}>Cancel</button>
								<button
									class="px-4 py-1.5 text-xs font-medium rounded-lg text-white disabled:opacity-40"
									style="background: var(--color-primary);"
									disabled={!postContent.trim() || posting}
									onclick={submitPost}
								>{posting ? 'Posting...' : 'Post'}</button>
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		{#if loading}
			<div class="py-16 flex flex-col items-center gap-3">
				<div class="w-6 h-6 border-2 rounded-full animate-spin" style="border-color: var(--color-border); border-top-color: var(--color-primary);"></div>
			</div>
		{:else if tab === 'posts' || tab === 'feed'}
			<!-- Posts -->
			{#if feedPosts.length === 0}
				<div class="card p-16 text-center">
					<p class="text-sm" style="color: var(--color-text-dim);">No posts yet. Be the first to share!</p>
				</div>
			{:else}
				<div class="flex flex-col gap-4">
					{#each feedPosts as post, i}
						<div
							class="card p-4 transition-all duration-300"
							style="opacity: {visible ? 1 : 0}; transform: {visible ? 'translateY(0)' : 'translateY(16px)'}; transition-delay: {i * 60}ms;"
						>
							<div class="flex items-start gap-3">
								<a href="/{post.author_username}">
									<Avatar username={post.author_username} size={36} />
								</a>
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2">
										<a href="/{post.author_username}" class="text-sm font-semibold animated-link" style="color: var(--color-text);">{post.author_full_name || post.author_username}</a>
										<span class="text-xs" style="color: var(--color-text-dim);">@{post.author_username}</span>
										<span class="text-xs ml-auto" style="color: var(--color-text-dim); opacity: 0.5;"><RelativeTime date={post.created_at} /></span>
									</div>

									{#if post.type === 'code'}
										<pre class="mt-2 p-3 rounded-lg text-xs font-mono overflow-x-auto" style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text);">{post.content}</pre>
									{:else}
										<p class="mt-1.5 text-sm leading-relaxed" style="color: var(--color-text);">{post.content}</p>
									{/if}

									{#if post.repo_owner && post.repo_name}
										<a href="/{post.repo_owner}/{post.repo_name}" class="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg text-xs" style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-primary);">
											<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
											{post.repo_owner}/{post.repo_name}
										</a>
									{/if}

									{#if post.tags && post.tags.length > 0}
										<div class="flex flex-wrap gap-1 mt-2">
											{#each post.tags as tag}
												<span class="text-[0.625rem] px-2 py-0.5 rounded-full" style="background: var(--color-primary)10; color: var(--color-primary);">#{tag}</span>
											{/each}
										</div>
									{/if}

									<!-- Actions -->
									<div class="flex items-center gap-4 mt-3 pt-2 border-t" style="border-color: var(--color-separator);">
										<button class="flex items-center gap-1.5 text-xs transition-colors" style="color: {post.liked ? 'var(--color-error)' : 'var(--color-text-dim)'};" onclick={() => toggleLike(post)}>
											<svg class="w-3.5 h-3.5" fill={post.liked ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
											{post.likes_count || ''}
										</button>
										<button class="flex items-center gap-1.5 text-xs" style="color: var(--color-text-dim);">
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
											{post.comments_count || ''}
										</button>
										<button class="flex items-center gap-1.5 text-xs" style="color: {post.reposted ? 'var(--color-success)' : 'var(--color-text-dim)'};">
											<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
											{post.reposts_count || ''}
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Also show activity in "For You" tab -->
			{#if tab === 'feed' && items.length > 0}
				<div class="flex items-center gap-3 mt-4">
					<span class="text-xs font-semibold uppercase tracking-wider" style="color: var(--color-text-dim);">Recent Activity</span>
					<div class="flex-1 h-px" style="background: var(--color-separator);"></div>
				</div>
			{/if}
		{/if}

		{#if (tab === 'activity' || tab === 'feed') && !loading}
			{#if items.length === 0 && tab === 'activity'}
				<div class="card p-16 text-center">
					<p class="text-sm" style="color: var(--color-text-dim);">No activity yet.</p>
				</div>
			{:else if items.length > 0}
				<div class="flex flex-col gap-2">
					{#each items.slice(0, tab === 'feed' ? 10 : undefined) as item, i}
						{@const meta = icon(item.type)}
						<div
							class="card p-3 flex items-center gap-3 transition-all duration-200"
							style="opacity: {visible ? 1 : 0}; transform: {visible ? 'translateX(0)' : 'translateX(12px)'}; transition-delay: {(feedPosts.length + i) * 40}ms;"
						>
							<div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background: {meta.color}10;">
								<svg class="w-3.5 h-3.5" style="color: {meta.color};" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">{@html meta.svg}</svg>
							</div>
							<div class="flex-1 min-w-0">
								<a href="/{item.repo_owner}/{item.repo_name}{item.number ? (item.type === 'pull_request' ? '/pulls/' : '/issues/') + item.number : ''}" class="text-sm truncate block animated-link" style="color: var(--color-text);">{item.title}</a>
								<div class="flex items-center gap-2 mt-0.5 text-[0.6875rem]" style="color: var(--color-text-dim);">
									<span>{item.author}</span>
									<span style="opacity: 0.3;">in</span>
									<a href="/{item.repo_owner}/{item.repo_name}" class="animated-link" style="color: var(--color-primary);">{item.repo_owner}/{item.repo_name}</a>
									<span class="ml-auto opacity-50"><RelativeTime date={item.created_at} /></span>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</PageShell>
