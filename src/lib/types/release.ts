export interface Release {
	id: number;
	repo_id: number;
	tag_name: string;
	title: string;
	body: string;
	is_draft: boolean;
	is_prerelease: boolean;
	author_id: number;
	author: string;
	created_at: string;
	updated_at: string;
}
