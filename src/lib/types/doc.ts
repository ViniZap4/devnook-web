export interface DocSpace {
	id: number;
	name: string;
	slug: string;
	description: string;
	icon: string;
	owner_type: 'user' | 'org' | 'repo';
	owner_id: number;
	owner_name: string;
	repo_owner?: string;
	repo_name?: string;
	org_name?: string;
	is_public: boolean;
	created_at: string;
	updated_at: string;
}

export interface DocPage {
	id: number;
	space_id: number;
	parent_id?: number;
	title: string;
	slug: string;
	content: string;
	icon: string;
	author_username: string;
	children?: DocPage[];
	position: number;
	is_published: boolean;
	last_edited_by: string;
	created_at: string;
	updated_at: string;
}

export interface DocPageVersion {
	id: number;
	page_id: number;
	title: string;
	content: string;
	author_username: string;
	commit_hash?: string;
	created_at: string;
}
