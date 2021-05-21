// extra API types, e.g. messages
import type { CardInfo } from '$lib/types.ts';

export interface LoginRequest {
	email: string;
	password: string;
	register: boolean;
	code?: string;
}
export interface LoginResponse {
	token?: string;
	error?: string;
}
export interface PostDeckResponse {
	deckId: string;
	revision: number;
}
export interface PostRevisionResponse {
	revision: number;
}

export interface PutCardsRequest {
	addColumns: boolean;
	csvFile: string;
}

export interface BuildResponse {
	messages: string[];
	error?: string;
	cards?: CardInfo[];
}

export interface PostUserDecksResponse {
	deckid: string;
	revid: number;
}
export interface PostUserRevisionResponse {
	revid: number;
}
export interface FileInfo {
	name: string;
	isDirectory: boolean;
	relPath?: string; // internal?
}

