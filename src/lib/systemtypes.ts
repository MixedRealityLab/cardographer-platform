// system types

// session
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
