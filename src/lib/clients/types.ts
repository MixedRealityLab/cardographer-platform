import type {Session,SessionSnapshot} from '$lib/types';
import type {SnapshotInfo} from '$lib/analysistypes';

export abstract class Client {
	abstract acceptsImport(data : any): boolean;
	abstract sessionType(): string;
	abstract makeSession(data: any): Session;
	abstract makeSessionSnapshot(data: any): SessionSnapshot;
	abstract getSnapshotInfo(snapshot:SessionSnapshot): SnapshotInfo;
	abstract getExistingSessionQuery(d: any) : any;
}

