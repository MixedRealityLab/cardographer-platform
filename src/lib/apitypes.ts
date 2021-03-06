// extra API types, e.g. messages
import type {AtlasInfo, CardInfo} from '$lib/types';

export interface LoginRequest {
	name?: string
	email: string
	password: string
	register: boolean
	code?: string
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
	atlases?: AtlasInfo[];
}

export interface PostUserDecksResponse {
	deckId: string;
	revId: number;
}

export interface PostUserRevisionResponse {
	revId: number;
}

export interface FileInfo {
	name: string;
	isDirectory: boolean;
	path: string;
}

export interface UploadFile {
	name: string;
	//	isDirectory: boolean;
	content: string; // base64
}

export interface PostFilesRequest {
	files: UploadFile[];
}

// Unity client DeckInfo, subject to change (2021-05-25)
export interface DeckInfo {
	name: string;
	atlasCount: number; // same as atlas length?
	atlasURLs: string[];
	cardCount: number; // including back?
	cardX: number;
	cardY: number;
	cardInfo: string[]; // per card
}

export interface CopySessionRequest {
	sessionId: string;
}

export interface CopySessionResponse {
	sessionId: string;
}

export interface ImportSessionResponse {
	message: string;
}

export interface PostAnalysisResponse {
	analid: string;
}

