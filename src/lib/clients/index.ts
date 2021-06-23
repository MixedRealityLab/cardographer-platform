import { Appv1 } from './appv1';
import type { Client } from './types';
const clients: Client[] = [
	new Appv1(),
];

export function guessSessionType(data : any): boolean {
	for (let c of clients) {
		//console.log(`client`, c);
		if (c.acceptsImport(data)) {
			return c.sessionType();
		}
	}
	return null;
}
function getClient(sessionType:string): Client {
	for (let c of clients) {
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


