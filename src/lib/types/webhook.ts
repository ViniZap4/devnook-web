export interface Webhook {
	id: number;
	repo_id: number;
	url: string;
	secret: string;
	events: string[];
	active: boolean;
	created_at: string;
	updated_at: string;
}
