// extra API types, e.g. messages

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

