import { browser } from '$app/environment';

type EventHandler = (data: any) => void;

let socket = $state<WebSocket | null>(null);
let connected = $state(false);
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Map<string, Set<EventHandler>>();
let currentToken: string | null = null;

import { BASE_URL } from '$lib/config';

function getWsUrl(token: string): string {
	const wsBase = BASE_URL.replace(/^http/, 'ws');
	return `${wsBase}/ws?token=${encodeURIComponent(token)}`;
}

function connect(token: string) {
	if (!browser) return;
	currentToken = token;
	cleanup();

	const ws = new WebSocket(getWsUrl(token));

	ws.onopen = () => {
		connected = true;
	};

	ws.onmessage = (event) => {
		try {
			const msg = JSON.parse(event.data);
			if (msg.type && listeners.has(msg.type)) {
				for (const handler of listeners.get(msg.type)!) {
					handler(msg.data);
				}
			}
		} catch {
			// ignore malformed messages
		}
	};

	ws.onclose = () => {
		connected = false;
		socket = null;
		// Reconnect after 3 seconds
		if (currentToken) {
			reconnectTimer = setTimeout(() => {
				if (currentToken) connect(currentToken);
			}, 3000);
		}
	};

	ws.onerror = () => {
		ws.close();
	};

	socket = ws;
}

function cleanup() {
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	if (socket) {
		currentToken = null; // prevent reconnect
		socket.close();
		socket = null;
		connected = false;
	}
}

function disconnect() {
	currentToken = null;
	cleanup();
}

function on(type: string, handler: EventHandler): () => void {
	if (!listeners.has(type)) {
		listeners.set(type, new Set());
	}
	listeners.get(type)!.add(handler);
	return () => {
		listeners.get(type)?.delete(handler);
	};
}

export const wsStore = {
	get connected() { return connected; },
	connect,
	disconnect,
	on,
};
