import type { BuildResponse, FileInfo } from '$lib/apitypes.ts';
import type { CardDeckRevision, DeckBuild } from '$lib/types.ts';
import { DeckBuildStatus } from '$lib/types.ts';
import type { BuilderConfig } from '$lib/systemtypes.ts';
import fs from 'fs';
const fsPromises = fs.promises;

import { build as squibBuild } from './squib.ts';

const debug = true;

type BuildFn = ( revision: CardDeckRevision, config: BuilderConfig ) => Promise<BuildResponse>;

type Builders = {
	[key: string] : BuildFn;
}

let builders: Builders = {
	'squib' : squibBuild,
};

const FILE_PATH = "uploads";

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
		filePath: FILE_PATH,
	};
	return builder(revision, config);
}

// copy files too...
export async function copyBuild( oldRevision: CardDeckRevision, newRevision: CardDeckRevision ) : DeckBuild {
        // Copy files...
	const oldPath = `${FILE_PATH}/${oldRevision.deckId}/${oldRevision.revision}`;
	const newPath = `${FILE_PATH}/${newRevision.deckId}/${newRevision.revision}`;
	let build: DeckBuild;
	if (oldRevision.build) {
		build = {
			builderId: oldRevision.build.builderId,
			builderName: oldRevision.build.builderName,
			config: oldRevision.build.config,
			// lastBuilt
			status: DeckBuildStatus.Unbuilt,
			messages: [],
			isDisabled: false
		}
	}
	//return new Promise<DeckBuild>((resolve,reject) => {
	// make new path
	try {
		await fsPromises.mkdir(newPath,{recursive:true});
		await copyDir(oldPath, newPath, true);
	} catch (err) {
		console.log(`copy build error ${err.message}`, err);
	}
	return build;
	//});//promise
}
async function copyDir(oldPath:string, newPath:string, recurse:boolean) {
	if (debug) console.log(`copy ${oldPath} to ${newPath}`);
	const files = await fsPromises.readdir(oldPath,{withFileTypes:true});
	for (const file of files) {
		const oldFile = oldPath+'/'+file.name;
		const newFile = newPath+'/'+file.name;
		if (file.isFile()) {
			try {
				await fsPromises.copyFile(oldFile, newFile);
			} catch (err) {
				console.log(`error copying ${oldFile} to ${newFile}: ${err.mesage}`);
			}
		} else if (file.isDirectory() && recurse) {
			try {
				await fsPromises.mkdir(newFile);
				await copyDir(oldFile, newFile, recurse);
			}
			catch (err) {
				console.log(`error making new directory ${newFile}: ${err.mesage}`);
			}
		}
	}
}

export async function getFileInfo(deckid:string, revid:string, path:string): FileInfo[] {
	const relPath = `${FILE_PATH}/${deckid}/${revid}/${path}`;
	const stats = await fsPromises.stat(relPath);
	if (stats.isFile()) {
		if (debug) console.log(`getDirInfo for file ${relPath}`);
		return [{ relPath: relPath, isDirectory:false }];
	}
	if (!stats.isDirectory()) {
		if (debug) console.log(`getDirInfo for non-directory ${relPath}`);
		return [];
	}
        const files = await fsPromises.readdir(relPath,{withFileTypes:true});
 	let fis:FileInfo[] = [];
 	for (const file of files) {
		if (file.isDirectory() || file.isFile()) {
			fis.push({
				name: file.name,
				isDirectory: file.isDirectory()
			});
		}
	}
	return fis;
}
export async function writeFile(deckid:string, revid:string, path:string, name:string, base64:string)  {
	const relPath = `${FILE_PATH}/${deckid}/${revid}/${path}/${name}`;
	const data = Buffer.from(base64, 'base64');
	await fsPromises.writeFile(relPath, data);
}

