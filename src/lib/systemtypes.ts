// system types

// session
import type {CardDeckRevision} from "$lib/types";

export interface UserSession {
	email?: string;
	authenticated: boolean;
	token?: string;
}

export interface BuilderConfig {
	baseUrl: string;
	filePath: string;
	// custom
}


