export interface Conversation {
	id: number;
	type: 'direct' | 'group' | 'repo' | 'org' | 'issue';
	name: string;
	participants: ConversationParticipant[];
	last_message?: Message;
	unread_count: number;
	repo_owner?: string;
	repo_name?: string;
	org_name?: string;
	issue_number?: number;
	created_at: string;
	updated_at: string;
}

export interface ConversationParticipant {
	user_id: number;
	username: string;
	full_name: string;
	avatar_url: string;
	role: 'owner' | 'admin' | 'member';
}

export interface Message {
	id: number;
	conversation_id: number;
	sender_id: number;
	sender_username: string;
	sender_full_name: string;
	content: string;
	type: 'text' | 'code' | 'image' | 'file' | 'system';
	reply_to_id?: number;
	reactions: MessageReaction[];
	edited: boolean;
	created_at: string;
	updated_at: string;
}

export interface MessageReaction {
	emoji: string;
	count: number;
	reacted: boolean;
}
