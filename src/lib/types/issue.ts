export interface Issue {
	id: number;
	repo_id: number;
	number: number;
	author_id: number;
	author: string;
	title: string;
	body: string;
	state: 'open' | 'closed';
	milestone_id?: number;
	assignee_id?: number;
	assignee?: string;
	labels?: Label[];
	created_at: string;
	updated_at: string;
}

export interface IssueComment {
	id: number;
	issue_id: number;
	author_id: number;
	author: string;
	body: string;
	created_at: string;
	updated_at: string;
}

export interface Label {
	id: number;
	repo_id: number;
	name: string;
	color: string;
	description: string;
}

export interface Milestone {
	id: number;
	repo_id: number;
	title: string;
	description: string;
	state: 'open' | 'closed';
	due_date?: string;
	open_issues: number;
	closed_issues: number;
	created_at: string;
	updated_at: string;
}
