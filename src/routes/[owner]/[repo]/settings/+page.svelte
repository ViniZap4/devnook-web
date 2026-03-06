<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { repos, webhooks, branchRules } from '$lib/services/api';
	import type { Repository } from '$lib/types/repository';
	import type { Webhook } from '$lib/types/webhook';
	import type { BranchRule } from '$lib/types/branch_rule';
	import type { Collaborator } from '$lib/services/api';
	import { onMount } from 'svelte';
	import { toastStore } from '$lib/stores/toast.svelte';
	import Avatar from '$lib/components/Avatar.svelte';

	const owner = $derived($page.params.owner!);
	const repoName = $derived($page.params.repo!);

	let repo = $state<Repository | null>(null);
	let description = $state('');
	let website = $state('');
	let isPrivate = $state(false);
	let defaultBranch = $state('');
	let topicsInput = $state('');
	let saving = $state(false);

	// Webhooks
	let hooks = $state<Webhook[]>([]);
	let showHookForm = $state(false);
	let hookUrl = $state('');
	let hookSecret = $state('');
	let hookEvents = $state('push');
	let hookSubmitting = $state(false);

	// Collaborators
	let collaborators = $state<Collaborator[]>([]);
	let showCollabForm = $state(false);
	let collabUsername = $state('');
	let collabPermission = $state('write');
	let collabSubmitting = $state(false);

	// Branch Protection Rules
	let rules = $state<BranchRule[]>([]);
	let showRuleForm = $state(false);
	let editingRule = $state<BranchRule | null>(null);
	let rulePattern = $state('');
	let ruleRequirePR = $state(false);
	let ruleRequiredApprovals = $state(1);
	let ruleDismissStale = $state(false);
	let ruleRequireStatusChecks = $state(false);
	let ruleStatusChecks = $state('');
	let ruleLinearHistory = $state(false);
	let ruleAllowForcePush = $state(false);
	let ruleAllowDeletions = $state(false);
	let ruleRestrictPushes = $state(false);
	let ruleAllowedPushUsers = $state('');
	let ruleMergeTypes = $state<string[]>(['merge', 'squash', 'rebase']);
	let ruleSaving = $state(false);

	// Transfer
	let transferOwner = $state('');
	let transferring = $state(false);

	// Delete
	let deleting = $state(false);
	let confirmName = $state('');

	// Active settings section
	let activeSection = $state<'general' | 'collaborators' | 'webhooks' | 'branches' | 'danger'>('general');

	const sections = [
		{ id: 'general' as const, label: 'General', icon: 'settings' },
		{ id: 'collaborators' as const, label: 'Collaborators', icon: 'people' },
		{ id: 'webhooks' as const, label: 'Webhooks', icon: 'webhook' },
		{ id: 'branches' as const, label: 'Branch Rules', icon: 'branch' },
		{ id: 'danger' as const, label: 'Danger Zone', icon: 'danger' },
	];

	onMount(async () => {
		try {
			repo = await repos.get(owner, repoName);
			if (repo) {
				description = repo.description || '';
				website = repo.website || '';
				isPrivate = repo.is_private;
				defaultBranch = repo.default_branch;
				topicsInput = (repo.topics || []).join(', ');
			}
			const [h, c, r] = await Promise.all([
				webhooks.list(owner, repoName),
				repos.listCollaborators(owner, repoName),
				branchRules.list(owner, repoName).catch(() => [] as BranchRule[])
			]);
			hooks = h;
			collaborators = c;
			rules = r;
		} catch {
			// ignore
		}
	});

	async function handleSave(e: Event) {
		e.preventDefault();
		saving = true;
		try {
			const topics = topicsInput.split(',').map(t => t.trim()).filter(Boolean);
			await repos.update(owner, repoName, { description, website, is_private: isPrivate, default_branch: defaultBranch, topics });
			toastStore.success('Repository settings saved');
		} catch {
			toastStore.error('Failed to save settings');
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (confirmName !== repoName) return;
		deleting = true;
		try {
			await repos.remove(owner, repoName);
			toastStore.success('Repository deleted');
			goto('/dashboard');
		} catch {
			toastStore.error('Failed to delete repository');
			deleting = false;
		}
	}

	async function addHook(e: Event) {
		e.preventDefault();
		if (!hookUrl) return;
		hookSubmitting = true;
		try {
			await webhooks.create(owner, repoName, { url: hookUrl, secret: hookSecret, events: hookEvents.split(',').map(e => e.trim()), active: true });
			hookUrl = ''; hookSecret = ''; hookEvents = 'push';
			showHookForm = false;
			hooks = await webhooks.list(owner, repoName);
			toastStore.success('Webhook added');
		} catch {
			toastStore.error('Failed to add webhook');
		} finally {
			hookSubmitting = false;
		}
	}

	async function deleteHook(id: number) {
		try {
			await webhooks.remove(owner, repoName, id);
			hooks = hooks.filter(h => h.id !== id);
			toastStore.success('Webhook removed');
		} catch {
			toastStore.error('Failed to remove webhook');
		}
	}

	async function addCollaborator(e: Event) {
		e.preventDefault();
		if (!collabUsername) return;
		collabSubmitting = true;
		try {
			await repos.addCollaborator(owner, repoName, { username: collabUsername, permission: collabPermission });
			collabUsername = '';
			collabPermission = 'write';
			showCollabForm = false;
			collaborators = await repos.listCollaborators(owner, repoName);
			toastStore.success('Collaborator added');
		} catch {
			toastStore.error('Failed to add collaborator');
		} finally {
			collabSubmitting = false;
		}
	}

	async function removeCollaborator(username: string) {
		if (!confirm(`Remove ${username} as collaborator?`)) return;
		try {
			await repos.removeCollaborator(owner, repoName, username);
			collaborators = collaborators.filter(c => c.username !== username);
			toastStore.success(`${username} removed`);
		} catch {
			toastStore.error('Failed to remove collaborator');
		}
	}

	function resetRuleForm() {
		rulePattern = '';
		ruleRequirePR = false;
		ruleRequiredApprovals = 1;
		ruleDismissStale = false;
		ruleRequireStatusChecks = false;
		ruleStatusChecks = '';
		ruleLinearHistory = false;
		ruleAllowForcePush = false;
		ruleAllowDeletions = false;
		ruleRestrictPushes = false;
		ruleAllowedPushUsers = '';
		ruleMergeTypes = ['merge', 'squash', 'rebase'];
		editingRule = null;
	}

	function startEditRule(rule: BranchRule) {
		editingRule = rule;
		rulePattern = rule.pattern;
		ruleRequirePR = rule.require_pull_request;
		ruleRequiredApprovals = rule.required_approvals;
		ruleDismissStale = rule.dismiss_stale_reviews;
		ruleRequireStatusChecks = rule.require_status_checks;
		ruleStatusChecks = (rule.required_status_checks || []).join(', ');
		ruleLinearHistory = rule.require_linear_history;
		ruleAllowForcePush = rule.allow_force_push;
		ruleAllowDeletions = rule.allow_deletions;
		ruleRestrictPushes = rule.restrict_pushes;
		ruleAllowedPushUsers = (rule.allowed_push_users || []).join(', ');
		ruleMergeTypes = rule.allowed_merge_types || ['merge', 'squash', 'rebase'];
		showRuleForm = true;
	}

	function toggleMergeType(type: string) {
		if (ruleMergeTypes.includes(type)) {
			if (ruleMergeTypes.length > 1) {
				ruleMergeTypes = ruleMergeTypes.filter(t => t !== type);
			}
		} else {
			ruleMergeTypes = [...ruleMergeTypes, type];
		}
	}

	async function saveRule(e: Event) {
		e.preventDefault();
		if (!rulePattern.trim()) return;
		ruleSaving = true;
		const data = {
			pattern: rulePattern.trim(),
			require_pull_request: ruleRequirePR,
			required_approvals: ruleRequiredApprovals,
			dismiss_stale_reviews: ruleDismissStale,
			require_status_checks: ruleRequireStatusChecks,
			required_status_checks: ruleStatusChecks.split(',').map(s => s.trim()).filter(Boolean),
			require_linear_history: ruleLinearHistory,
			allow_force_push: ruleAllowForcePush,
			allow_deletions: ruleAllowDeletions,
			restrict_pushes: ruleRestrictPushes,
			allowed_push_users: ruleAllowedPushUsers.split(',').map(s => s.trim()).filter(Boolean),
			allowed_merge_types: ruleMergeTypes
		};
		try {
			if (editingRule) {
				await branchRules.update(owner, repoName, editingRule.id, data);
				toastStore.success('Branch rule updated');
			} else {
				await branchRules.create(owner, repoName, data);
				toastStore.success('Branch rule created');
			}
			rules = await branchRules.list(owner, repoName).catch(() => []);
			showRuleForm = false;
			resetRuleForm();
		} catch {
			toastStore.error('Failed to save branch rule');
		} finally {
			ruleSaving = false;
		}
	}

	async function deleteRule(id: number) {
		if (!confirm('Delete this branch protection rule?')) return;
		try {
			await branchRules.remove(owner, repoName, id);
			rules = rules.filter(r => r.id !== id);
			toastStore.success('Branch rule deleted');
		} catch {
			toastStore.error('Failed to delete branch rule');
		}
	}

	async function handleTransfer() {
		if (!transferOwner || !confirm(`Transfer this repository to "${transferOwner}"? This action cannot be undone.`)) return;
		transferring = true;
		try {
			await repos.transfer(owner, repoName, transferOwner);
			toastStore.success('Repository transferred');
			goto(`/${transferOwner}/${repoName}`);
		} catch {
			toastStore.error('Failed to transfer repository');
			transferring = false;
		}
	}

	function permissionColor(p: string) {
		if (p === 'admin') return 'var(--color-warning)';
		if (p === 'write') return 'var(--color-success)';
		return 'var(--color-info)';
	}
</script>

<div class="flex flex-col lg:flex-row gap-6">
	<!-- Sidebar navigation -->
	<nav class="lg:w-56 shrink-0 card-animate">
		<div class="flex lg:flex-col gap-1 glass-subtle rounded-xl p-1.5 overflow-x-auto lg:overflow-x-visible">
			{#each sections as section}
				{@const active = activeSection === section.id}
				<button
					class="flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all duration-200 w-full text-left"
					style="
						color: {active ? (section.id === 'danger' ? 'var(--color-error)' : 'var(--color-primary)') : 'var(--color-text-dim)'};
						background: {active ? (section.id === 'danger' ? 'color-mix(in srgb, var(--color-error) 10%, transparent)' : 'color-mix(in srgb, var(--color-primary) 10%, transparent)') : 'transparent'};
						font-weight: {active ? '600' : '400'};
					"
					onclick={() => { activeSection = section.id; }}
				>
					{#if section.icon === 'settings'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
					{:else if section.icon === 'people'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
					{:else if section.icon === 'webhook'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
					{:else if section.icon === 'branch'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v12m0 0a3 3 0 103 3V9a3 3 0 10-3-3m12 0a3 3 0 10-3 3v6" /></svg>
					{:else if section.icon === 'danger'}
						<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
					{/if}
					<span class="hidden lg:inline">{section.label}</span>
				</button>
			{/each}
		</div>
	</nav>

	<!-- Content area -->
	<div class="flex-1 min-w-0">
		{#key activeSection}
		<div class="content-reveal flex flex-col gap-6">

		<!-- General -->
		{#if activeSection === 'general'}
			<section class="card p-6 card-animate">
				<div class="flex items-center gap-3 mb-6">
					<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-primary) 10%, transparent);">
						<svg class="w-4.5 h-4.5" style="color: var(--color-primary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg>
					</div>
					<div>
						<h3 class="font-semibold text-sm" style="color: var(--color-text);">General Settings</h3>
						<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Basic repository configuration</p>
					</div>
				</div>
				<form onsubmit={handleSave} class="flex flex-col gap-4 max-w-lg">
					<div>
						<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Description</label>
						<input type="text" bind:value={description} class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); color: var(--color-text);" />
					</div>
					<div>
						<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Website</label>
						<input type="text" bind:value={website} placeholder="https://..." class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); color: var(--color-text);" />
					</div>
					<div>
						<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Default branch</label>
						<input type="text" bind:value={defaultBranch} class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); color: var(--color-text);" />
					</div>
					<div>
						<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Topics (comma-separated)</label>
						<input type="text" bind:value={topicsInput} placeholder="go, web, api" class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); color: var(--color-text);" />
					</div>
					<!-- Visibility toggle -->
					<div class="flex items-center justify-between p-4 rounded-xl border transition-all duration-200" style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-surface) 50%, transparent);">
						<div class="flex items-center gap-3">
							{#if isPrivate}
								<svg class="w-5 h-5" style="color: var(--color-warning);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
							{:else}
								<svg class="w-5 h-5" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
							{/if}
							<div>
								<p class="text-sm font-medium" style="color: var(--color-text);">{isPrivate ? 'Private' : 'Public'} repository</p>
								<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">
									{isPrivate ? 'Only you and collaborators can see this repository' : 'Anyone can see this repository'}
								</p>
							</div>
						</div>
						<button
							type="button"
							class="relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0"
							style="background-color: {isPrivate ? 'var(--color-warning)' : 'var(--color-success)'};"
							onclick={() => { if (confirm('Make this repository ' + (isPrivate ? 'public' : 'private') + '?')) isPrivate = !isPrivate; }}
						>
							<span
								class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
								style="transform: translateX({isPrivate ? '20px' : '0'});"
							></span>
						</button>
					</div>
					<div>
						<button type="submit" disabled={saving} class="btn-glow px-5 py-2.5 text-sm font-semibold rounded-xl text-white disabled:opacity-40 transition-all hover:scale-[1.02] active:scale-[0.98]" style="background: linear-gradient(135deg, var(--color-primary), var(--color-accent));">{saving ? 'Saving...' : 'Save changes'}</button>
					</div>
				</form>
			</section>

		<!-- Collaborators -->
		{:else if activeSection === 'collaborators'}
			<section class="card p-6 card-animate">
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-secondary) 10%, transparent);">
							<svg class="w-4.5 h-4.5" style="color: var(--color-secondary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
						</div>
						<div>
							<h3 class="font-semibold text-sm" style="color: var(--color-text);">Collaborators</h3>
							<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Manage who has access to this repository</p>
						</div>
					</div>
					<button
						class="btn-glow flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
						style="background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));"
						onclick={() => { showCollabForm = !showCollabForm; }}
					>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
						{showCollabForm ? 'Cancel' : 'Add'}
					</button>
				</div>

				{#if showCollabForm}
					<form onsubmit={addCollaborator} class="flex items-end gap-3 mb-6 p-4 rounded-xl animate-fade-up-sm" style="border: 1px solid var(--color-border); background: color-mix(in srgb, var(--color-surface) 50%, transparent);">
						<div class="flex-1">
							<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Username</label>
							<input type="text" bind:value={collabUsername} placeholder="Username" class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); color: var(--color-text);" />
						</div>
						<div>
							<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Permission</label>
							<select bind:value={collabPermission} class="px-3 py-2 text-sm rounded-xl border bg-transparent" style="border-color: var(--color-border); color: var(--color-text);">
								<option value="read">Read</option>
								<option value="write">Write</option>
								<option value="admin">Admin</option>
							</select>
						</div>
						<button type="submit" disabled={collabSubmitting || !collabUsername} class="btn-glow px-4 py-2 text-sm font-medium rounded-xl text-white disabled:opacity-40" style="background: linear-gradient(135deg, var(--color-secondary), var(--color-primary));">{collabSubmitting ? 'Adding...' : 'Add'}</button>
					</form>
				{/if}

				{#if collaborators.length === 0}
					<div class="text-center py-8">
						<div class="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-secondary) 8%, transparent);">
							<svg class="w-6 h-6 opacity-40" style="color: var(--color-secondary);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
						</div>
						<p class="text-sm" style="color: var(--color-text-dim);">No collaborators yet</p>
						<p class="text-xs mt-1" style="color: var(--color-text-dim);">Add collaborators to work together</p>
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each collaborators as collab, i}
							<div
								class="flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] group"
								style="border-color: var(--color-border); animation: fade-slide-in-sm 0.3s ease both; animation-delay: {i * 40}ms;"
							>
								<div class="flex items-center gap-3">
									<Avatar username={collab.username} size={32} />
									<div>
										<a href="/{collab.username}" class="text-sm font-medium animated-link" style="color: var(--color-text);">{collab.username}</a>
										{#if collab.full_name}
											<span class="text-xs ml-1.5" style="color: var(--color-text-dim);">{collab.full_name}</span>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-3">
									<span class="text-[0.625rem] px-2 py-0.5 rounded-full font-semibold" style="background: color-mix(in srgb, {permissionColor(collab.permission)} 10%, transparent); color: {permissionColor(collab.permission)};">{collab.permission}</span>
									<button
										class="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
										style="color: var(--color-error);"
										onclick={() => removeCollaborator(collab.username)}
									>Remove</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

		<!-- Webhooks -->
		{:else if activeSection === 'webhooks'}
			<section class="card p-6 card-animate">
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-info) 10%, transparent);">
							<svg class="w-4.5 h-4.5" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
						</div>
						<div>
							<h3 class="font-semibold text-sm" style="color: var(--color-text);">Webhooks</h3>
							<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Manage webhook integrations</p>
						</div>
					</div>
					<button
						class="btn-glow flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
						style="background: linear-gradient(135deg, var(--color-info), var(--color-primary));"
						onclick={() => { showHookForm = !showHookForm; }}
					>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
						{showHookForm ? 'Cancel' : 'Add'}
					</button>
				</div>

				{#if showHookForm}
					<form onsubmit={addHook} class="flex flex-col gap-3 mb-6 p-4 rounded-xl animate-fade-up-sm" style="border: 1px solid var(--color-border); background: color-mix(in srgb, var(--color-surface) 50%, transparent);">
						<div>
							<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Payload URL</label>
							<input type="url" bind:value={hookUrl} placeholder="https://example.com/webhook" class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); color: var(--color-text);" />
						</div>
						<div>
							<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Secret (optional)</label>
							<input type="text" bind:value={hookSecret} placeholder="Secret key" class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); color: var(--color-text);" />
						</div>
						<div>
							<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Events (comma-separated)</label>
							<input type="text" bind:value={hookEvents} placeholder="push, issues, pull_request" class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]" style="border-color: var(--color-border); color: var(--color-text);" />
						</div>
						<button type="submit" disabled={hookSubmitting || !hookUrl} class="self-start btn-glow px-4 py-2 text-sm font-medium rounded-xl text-white disabled:opacity-40" style="background: linear-gradient(135deg, var(--color-info), var(--color-primary));">{hookSubmitting ? 'Adding...' : 'Add Webhook'}</button>
					</form>
				{/if}

				{#if hooks.length === 0 && !showHookForm}
					<div class="text-center py-8">
						<div class="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-info) 8%, transparent);">
							<svg class="w-6 h-6 opacity-40" style="color: var(--color-info);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
						</div>
						<p class="text-sm" style="color: var(--color-text-dim);">No webhooks configured</p>
						<p class="text-xs mt-1" style="color: var(--color-text-dim);">Add webhooks to receive event notifications</p>
					</div>
				{:else}
					<div class="flex flex-col gap-2">
						{#each hooks as hook, i}
							<div
								class="flex items-center justify-between p-4 rounded-xl border transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] group"
								style="border-color: var(--color-border); animation: fade-slide-in-sm 0.3s ease both; animation-delay: {i * 40}ms;"
							>
								<div class="min-w-0">
									<div class="flex items-center gap-2">
										<span class="text-sm font-mono truncate" style="color: var(--color-text);">{hook.url}</span>
										<span class="shrink-0 w-2 h-2 rounded-full" style="background: {hook.active ? 'var(--color-success)' : 'var(--color-text-dim)'};"></span>
									</div>
									<div class="flex flex-wrap gap-1.5 mt-1.5">
										{#each hook.events as event}
											<span class="text-[0.625rem] px-1.5 py-0.5 rounded-md font-medium" style="background: color-mix(in srgb, var(--color-info) 8%, transparent); color: var(--color-info);">{event}</span>
										{/each}
									</div>
								</div>
								<button
									class="text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2.5 py-1 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
									style="color: var(--color-error);"
									onclick={() => deleteHook(hook.id)}
								>Delete</button>
							</div>
						{/each}
					</div>
				{/if}
			</section>

		<!-- Branch Protection Rules -->
		{:else if activeSection === 'branches'}
			<section class="card p-6 card-animate">
				<div class="flex items-center justify-between mb-6">
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-success) 10%, transparent);">
							<svg class="w-4.5 h-4.5" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
						</div>
						<div>
							<h3 class="font-semibold text-sm" style="color: var(--color-text);">Branch Protection Rules</h3>
							<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Define rules by pattern (e.g. <code class="px-1 py-0.5 rounded text-[0.625rem]" style="background: var(--color-surface);">main</code>, <code class="px-1 py-0.5 rounded text-[0.625rem]" style="background: var(--color-surface);">release/*</code>)</p>
						</div>
					</div>
					<button
						class="btn-glow flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
						style="background: linear-gradient(135deg, var(--color-success), var(--color-primary));"
						onclick={() => { resetRuleForm(); showRuleForm = !showRuleForm; }}
					>
						<svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" /></svg>
						{showRuleForm ? 'Cancel' : 'Add Rule'}
					</button>
				</div>

				{#if showRuleForm}
					<form onsubmit={saveRule} class="mb-6 p-5 rounded-xl animate-fade-up-sm" style="border: 1px solid var(--color-border); background: color-mix(in srgb, var(--color-surface) 50%, transparent);">
						<h4 class="text-sm font-semibold mb-4" style="color: var(--color-text);">{editingRule ? 'Edit Rule' : 'New Branch Protection Rule'}</h4>

						<div class="flex flex-col gap-5">
							<!-- Pattern -->
							<div>
								<label class="block text-xs font-medium mb-1.5" style="color: var(--color-text-dim);">Branch name pattern</label>
								<input
									type="text"
									bind:value={rulePattern}
									placeholder="main, release/*, develop"
									class="w-full px-3 py-2 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
									style="border-color: var(--color-border); color: var(--color-text);"
									required
								/>
								<p class="text-[0.625rem] mt-1" style="color: var(--color-text-dim);">Use * as wildcard. e.g. release/* matches release/v1, release/v2</p>
							</div>

							<!-- Require PR -->
							<div class="flex flex-col gap-3 p-4 rounded-xl" style="border: 1px solid var(--color-border);">
								<label class="flex items-center justify-between cursor-pointer">
									<div>
										<p class="text-sm font-medium" style="color: var(--color-text);">Require pull request</p>
										<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">All commits must be made via pull request</p>
									</div>
									<button
										type="button"
										class="relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0"
										style="background-color: {ruleRequirePR ? 'var(--color-primary)' : 'var(--color-border)'};"
										onclick={() => { ruleRequirePR = !ruleRequirePR; }}
									>
										<span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style="transform: translateX({ruleRequirePR ? '20px' : '0'});"></span>
									</button>
								</label>

								{#if ruleRequirePR}
									<div class="pl-4 flex flex-col gap-3 animate-fade-up-sm" style="border-left: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);">
										<div class="flex items-center justify-between">
											<label class="text-xs" style="color: var(--color-text-dim);">Required approvals</label>
											<input
												type="number"
												bind:value={ruleRequiredApprovals}
												min="1"
												max="10"
												class="w-16 px-2 py-1 text-xs rounded-lg border bg-transparent text-center"
												style="border-color: var(--color-border); color: var(--color-text);"
											/>
										</div>
										<label class="flex items-center gap-2 cursor-pointer">
											<input type="checkbox" bind:checked={ruleDismissStale} class="accent-[var(--color-primary)]" />
											<span class="text-xs" style="color: var(--color-text-dim);">Dismiss stale reviews on new commits</span>
										</label>
									</div>
								{/if}
							</div>

							<!-- Status checks -->
							<div class="flex flex-col gap-3 p-4 rounded-xl" style="border: 1px solid var(--color-border);">
								<label class="flex items-center justify-between cursor-pointer">
									<div>
										<p class="text-sm font-medium" style="color: var(--color-text);">Require status checks</p>
										<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Require CI checks to pass before merging</p>
									</div>
									<button
										type="button"
										class="relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0"
										style="background-color: {ruleRequireStatusChecks ? 'var(--color-primary)' : 'var(--color-border)'};"
										onclick={() => { ruleRequireStatusChecks = !ruleRequireStatusChecks; }}
									>
										<span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style="transform: translateX({ruleRequireStatusChecks ? '20px' : '0'});"></span>
									</button>
								</label>
								{#if ruleRequireStatusChecks}
									<div class="pl-4 animate-fade-up-sm" style="border-left: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);">
										<label class="text-xs" style="color: var(--color-text-dim);">Required checks (comma-separated)</label>
										<input
											type="text"
											bind:value={ruleStatusChecks}
											placeholder="ci/build, ci/test, lint"
											class="w-full mt-1 px-3 py-2 text-xs rounded-lg border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
											style="border-color: var(--color-border); color: var(--color-text);"
										/>
									</div>
								{/if}
							</div>

							<!-- Merge types -->
							<div class="p-4 rounded-xl" style="border: 1px solid var(--color-border);">
								<p class="text-sm font-medium mb-3" style="color: var(--color-text);">Allowed merge types</p>
								<div class="flex flex-wrap gap-2">
									{#each [
										{ key: 'merge', label: 'Merge commit', desc: 'All commits preserved' },
										{ key: 'squash', label: 'Squash merge', desc: 'Squash into single commit' },
										{ key: 'rebase', label: 'Rebase merge', desc: 'Rebase onto target' }
									] as type}
										<button
											type="button"
											class="flex flex-col px-4 py-2.5 rounded-xl text-left transition-all duration-200 press-scale"
											style="
												border: 1px solid {ruleMergeTypes.includes(type.key) ? 'var(--color-primary)' : 'var(--color-border)'};
												background: {ruleMergeTypes.includes(type.key) ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'transparent'};
											"
											onclick={() => toggleMergeType(type.key)}
										>
											<span class="text-xs font-medium" style="color: {ruleMergeTypes.includes(type.key) ? 'var(--color-primary)' : 'var(--color-text)'};">{type.label}</span>
											<span class="text-[0.625rem] mt-0.5" style="color: var(--color-text-dim);">{type.desc}</span>
										</button>
									{/each}
								</div>
							</div>

							<!-- Restrict pushes -->
							<div class="flex flex-col gap-3 p-4 rounded-xl" style="border: 1px solid var(--color-border);">
								<label class="flex items-center justify-between cursor-pointer">
									<div>
										<p class="text-sm font-medium" style="color: var(--color-text);">Restrict who can push</p>
										<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Only specified users can push directly</p>
									</div>
									<button
										type="button"
										class="relative w-11 h-6 rounded-full transition-colors duration-300 shrink-0"
										style="background-color: {ruleRestrictPushes ? 'var(--color-primary)' : 'var(--color-border)'};"
										onclick={() => { ruleRestrictPushes = !ruleRestrictPushes; }}
									>
										<span class="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]" style="transform: translateX({ruleRestrictPushes ? '20px' : '0'});"></span>
									</button>
								</label>
								{#if ruleRestrictPushes}
									<div class="pl-4 animate-fade-up-sm" style="border-left: 2px solid color-mix(in srgb, var(--color-primary) 30%, transparent);">
										<label class="text-xs" style="color: var(--color-text-dim);">Allowed users (comma-separated usernames)</label>
										<input
											type="text"
											bind:value={ruleAllowedPushUsers}
											placeholder="admin, lead-dev"
											class="w-full mt-1 px-3 py-2 text-xs rounded-lg border bg-transparent transition-all duration-200 focus:border-[var(--color-primary)]"
											style="border-color: var(--color-border); color: var(--color-text);"
										/>
									</div>
								{/if}
							</div>

							<!-- Additional options -->
							<div class="flex flex-col gap-2 p-4 rounded-xl" style="border: 1px solid var(--color-border);">
								<p class="text-sm font-medium mb-1" style="color: var(--color-text);">Additional restrictions</p>
								<label class="flex items-center gap-2 cursor-pointer">
									<input type="checkbox" bind:checked={ruleLinearHistory} class="accent-[var(--color-primary)]" />
									<span class="text-xs" style="color: var(--color-text-dim);">Require linear history (no merge commits)</span>
								</label>
								<label class="flex items-center gap-2 cursor-pointer">
									<input type="checkbox" bind:checked={ruleAllowForcePush} class="accent-[var(--color-primary)]" />
									<span class="text-xs" style="color: var(--color-text-dim);">Allow force pushes</span>
								</label>
								<label class="flex items-center gap-2 cursor-pointer">
									<input type="checkbox" bind:checked={ruleAllowDeletions} class="accent-[var(--color-primary)]" />
									<span class="text-xs" style="color: var(--color-text-dim);">Allow branch deletions</span>
								</label>
							</div>

							<div class="flex items-center gap-3">
								<button
									type="submit"
									disabled={ruleSaving || !rulePattern.trim()}
									class="btn-glow px-5 py-2.5 text-sm font-semibold rounded-xl text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40"
									style="background: linear-gradient(135deg, var(--color-success), var(--color-primary));"
								>{ruleSaving ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}</button>
								<button
									type="button"
									onclick={() => { showRuleForm = false; resetRuleForm(); }}
									class="px-4 py-2.5 text-sm rounded-xl glass-subtle transition-all hover:scale-[1.02]"
									style="color: var(--color-text-dim);"
								>Cancel</button>
							</div>
						</div>
					</form>
				{/if}

				{#if rules.length === 0 && !showRuleForm}
					<div class="text-center py-8">
						<div class="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-success) 8%, transparent);">
							<svg class="w-6 h-6 opacity-40" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
						</div>
						<p class="text-sm" style="color: var(--color-text-dim);">No branch protection rules</p>
						<p class="text-xs mt-1" style="color: var(--color-text-dim);">Add rules to protect important branches</p>
					</div>
				{:else}
					<div class="flex flex-col gap-3">
						{#each rules as rule, i}
							<div
								class="flex items-center justify-between p-4 rounded-xl transition-all duration-200 hover:border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] group"
								style="border: 1px solid var(--color-border); animation: fade-slide-in-sm 0.3s ease both; animation-delay: {i * 40}ms;"
							>
								<div class="flex items-center gap-3 min-w-0">
									<div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background: color-mix(in srgb, var(--color-success) 10%, transparent);">
										<svg class="w-4 h-4" style="color: var(--color-success);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
									</div>
									<div class="min-w-0">
										<p class="text-sm font-mono font-semibold" style="color: var(--color-text);">{rule.pattern}</p>
										<div class="flex flex-wrap gap-1.5 mt-1">
											{#if rule.require_pull_request}
												<span class="text-[0.625rem] px-2 py-0.5 rounded-full" style="background: color-mix(in srgb, var(--color-primary) 10%, transparent); color: var(--color-primary);">PR required ({rule.required_approvals} approval{rule.required_approvals !== 1 ? 's' : ''})</span>
											{/if}
											{#if rule.require_status_checks}
												<span class="text-[0.625rem] px-2 py-0.5 rounded-full" style="background: color-mix(in srgb, var(--color-success) 10%, transparent); color: var(--color-success);">Status checks</span>
											{/if}
											{#if rule.restrict_pushes}
												<span class="text-[0.625rem] px-2 py-0.5 rounded-full" style="background: color-mix(in srgb, var(--color-warning) 10%, transparent); color: var(--color-warning);">Push restricted</span>
											{/if}
											{#if !rule.allow_force_push}
												<span class="text-[0.625rem] px-2 py-0.5 rounded-full" style="background: color-mix(in srgb, var(--color-error) 10%, transparent); color: var(--color-error);">No force push</span>
											{/if}
											{#if rule.allowed_merge_types && rule.allowed_merge_types.length < 3}
												<span class="text-[0.625rem] px-2 py-0.5 rounded-full" style="background: color-mix(in srgb, var(--color-info) 10%, transparent); color: var(--color-info);">{rule.allowed_merge_types.join(', ')}</span>
											{/if}
										</div>
									</div>
								</div>
								<div class="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
									<button
										class="text-xs px-2.5 py-1 rounded-lg glass-subtle transition-all hover:scale-[1.02]"
										style="color: var(--color-primary);"
										onclick={() => startEditRule(rule)}
									>Edit</button>
									<button
										class="text-xs px-2.5 py-1 rounded-lg hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)]"
										style="color: var(--color-error);"
										onclick={() => deleteRule(rule.id)}
									>Delete</button>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</section>

		<!-- Danger Zone -->
		{:else if activeSection === 'danger'}
			<section class="card-animate">
				<div class="rounded-2xl border p-6" style="border-color: color-mix(in srgb, var(--color-error) 25%, transparent);">
					<div class="flex items-center gap-3 mb-6">
						<div class="w-9 h-9 rounded-xl flex items-center justify-center" style="background: color-mix(in srgb, var(--color-error) 10%, transparent);">
							<svg class="w-4.5 h-4.5" style="color: var(--color-error);" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
						</div>
						<div>
							<h3 class="font-semibold text-sm" style="color: var(--color-error);">Danger Zone</h3>
							<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Irreversible and destructive actions</p>
						</div>
					</div>

					<!-- Transfer -->
					<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border mb-4 gap-3" style="border-color: var(--color-border);">
						<div>
							<p class="text-sm font-medium" style="color: var(--color-text);">Transfer ownership</p>
							<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Transfer this repository to another user.</p>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<input
								type="text"
								bind:value={transferOwner}
								placeholder="New owner"
								class="px-3 py-1.5 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-error)] w-32"
								style="border-color: var(--color-border); color: var(--color-text);"
							/>
							<button
								onclick={handleTransfer}
								disabled={!transferOwner || transferring}
								class="px-3 py-1.5 text-sm font-medium rounded-xl border transition-all duration-200 hover:bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] disabled:opacity-30"
								style="border-color: var(--color-border); color: var(--color-error);"
							>{transferring ? 'Transferring...' : 'Transfer'}</button>
						</div>
					</div>

					<!-- Delete -->
					<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border gap-3" style="border-color: var(--color-border);">
						<div>
							<p class="text-sm font-medium" style="color: var(--color-text);">Delete this repository</p>
							<p class="text-xs mt-0.5" style="color: var(--color-text-dim);">Once deleted, there is no going back.</p>
						</div>
						<div class="flex items-center gap-2 shrink-0">
							<input
								type="text"
								bind:value={confirmName}
								placeholder="Type name to confirm"
								class="px-3 py-1.5 text-sm rounded-xl border bg-transparent transition-all duration-200 focus:border-[var(--color-error)] w-40"
								style="border-color: var(--color-border); color: var(--color-text);"
							/>
							<button
								onclick={handleDelete}
								disabled={confirmName !== repoName || deleting}
								class="px-3 py-1.5 text-sm font-medium rounded-xl text-white transition-all duration-200 hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed"
								style="background: var(--color-error);"
							>{deleting ? 'Deleting...' : 'Delete'}</button>
						</div>
					</div>
				</div>
			</section>
		{/if}

		</div>
		{/key}
	</div>
</div>
