// extra API types, e.g. messages
import type {AtlasInfo, CardInfo} from '$lib/types';

export interface LoginRequest {
	name?: string
	email: string
	password: string
	register: boolean
	code?: string
}

export interface BuildResponse {
	messages: string[];
	error?: string;
	cards?: CardInfo[];
	atlases?: AtlasInfo[];
}

export interface FileInfo {
	name: string;
	isDirectory: boolean;
	path: string;
}