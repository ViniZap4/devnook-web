export interface Issue {
	id: number;
	repo_id: number;
	number: number;
	author_id: number;
	author: string;
	title: string;
	body: string;
	state: 'open' | 'closed';
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
}
