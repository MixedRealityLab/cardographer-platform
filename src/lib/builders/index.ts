import type { BuildResponse } from '$lib/apitypes.ts';
import type { CardDeckRevision } from '$lib/types.ts';
import type { BuilderConfig } from '$lib/systemtypes.ts';

import { build as squibBuild } from './squib.ts';

type BuildFn = ( revision: CardDeckRevision, config: BuilderConfig ) => Promise<BuildResponse>;

type Builders = {
	[key: string] : BuildFn;
}

let builders: Builders = {
	'squib' : squibBuild,
};


export async function buildRevision( revision: CardDeckRevision ) : BuildReponse {
	if (!revision.build?.builderId) {
		return { error: "No builder defined" };
	}
	let builder = builders[revision.build.builderId];
	if (!builder) {
		return { error: `Builder ${revision.build.builderId} not known` };
	}
	// ??
	let config : BuilderConfig = {
		baseUrl: '/api/cards/images/',
		filePath: 'uploads',
	};
	return builder(revision, config);
}
