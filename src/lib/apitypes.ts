// extra API types, e.g. messages
import type { CardInfo } from '$lib/types.ts';

export interface LoginRequest {
	email: string
}
export interface LoginResponse {
	token: string
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

