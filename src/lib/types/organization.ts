export interface Organization {
	id: number;
	name: string;
	display_name: string;
	description: string;
	avatar_url: string;
	created_at: string;
	updated_at: string;
}

export interface OrgMember {
	id: number;
	org_id: number;
	user_id: number;
	username: string;
	role: string;
	joined_at: string;
}
