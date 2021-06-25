import type {Session,SessionSnapshot} from '$lib/types.ts';
import type {SnapshotInfo} from '$lib/analysistypes.ts';

export abstract class Client {
	abstract acceptsImport(data : any): boolean;
	abstract sessionType(): string;
	abstract makeSession(data: any): Session;
	abstract makeSessionSnapshot(data: any): SessionSnapshot;
	abstract getSnapshotInfo(snapshot:SessionSnapshot): SnapshotInfo;
}

