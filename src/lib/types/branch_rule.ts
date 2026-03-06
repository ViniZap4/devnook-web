export interface BranchRule {
	id: number;
	repo_id: number;
	pattern: string;
	require_pull_request: boolean;
	required_approvals: number;
	dismiss_stale_reviews: boolean;
	require_status_checks: boolean;
	required_status_checks: string[];
	require_linear_history: boolean;
	allow_force_push: boolean;
	allow_deletions: boolean;
	restrict_pushes: boolean;
	allowed_push_users: string[];
	allowed_merge_types: string[];
	created_at: string;
	updated_at: string;
}
