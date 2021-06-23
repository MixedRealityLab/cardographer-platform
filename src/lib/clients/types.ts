import type {Session,SessionSnapshot} from '$lib/types.ts';

export abstract class Client {
	abstract acceptsImport(data : any): boolean;
	abstract sessionType(): string;
	abstract makeSession(data: any): Session;
	abstract makeSessionSnapshot(data: any): SessionSnapshot;
}

