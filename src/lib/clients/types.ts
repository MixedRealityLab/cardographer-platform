import type {SnapshotInfo} from '$lib/analysistypes';
import type {Session, SessionSnapshot} from '$lib/types';
import type {Filter} from "mongodb";

export abstract class Client {
	abstract acceptsImport(data : any): boolean;
	abstract sessionType(): string;
	abstract makeSession(data: any): Session;

	abstract makeSessionSnapshot(data: any, session: Session): SessionSnapshot

	abstract getSnapshotInfo(snapshot: SessionSnapshot): SnapshotInfo

	abstract getExistingSessionQuery(d: any): Filter<SessionSnapshot>
}

