// system types

// session
import type {CardDeckRevision} from "$lib/types";

export interface UserSession {
	email?: string;
	authenticated: boolean;
	token?: string;
}

// server locals
export interface ServerLocals {
	email?: string;
        authenticated: boolean;
	userToken?: string;
}

export interface BuilderConfig {
	baseUrl: string;
	filePath: string;
	// custom
}

export interface BuildRequest {
        revision: CardDeckRevision
        config: BuilderConfig
}

