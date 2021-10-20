import type {Session, SessionSnapshot} from "$lib/types";
import { Appv1 } from './appv1';
import { MiroClient } from './miro';
import type { Client } from './types';

const clients: Client[] = [
	new Appv1(),
	new MiroClient(),
];

export function guessSessionType(data : any): string {
	for (const c of clients) {
		//console.log(`client`, c);
		if (c.acceptsImport(data)) {
			return c.sessionType();
		}
	}
	return null;
}

export function getClient(sessionType:string): Client {
	for (const c of clients) {
		if (c.sessionType() == sessionType) {
			return c;
		}
	}
	return null;
}
export function makeSession(sessionType:string, data: any): Session {
	const client = getClient(sessionType);
	return client.makeSession(data);
}
export function  makeSessionSnapshot(sessionType:string, data: any): SessionSnapshot {
	const client = getClient(sessionType);
	return client.makeSessionSnapshot(data);
}

