import type {BuildResponse, FileInfo} from '$lib/apitypes';
import type {BuilderConfig} from '$lib/systemtypes';
import type {CardDeckRevision, DeckBuild} from '$lib/types';
import {DeckBuildStatus} from '$lib/types';
import AdmZip from "adm-zip";
import type {PathLike} from 'fs';
import {copyFile, mkdir, readdir, rm, rmdir, stat, writeFile} from "fs/promises";
import {build as squibBuild} from './squib';

const debug = true;

type BuildFn = (revision: CardDeckRevision, config: BuilderConfig) => Promise<BuildResponse>;

type Builders = {
	[key: string]: BuildFn;
}

const builders: Builders = {
	'squib': squibBuild,
};

const FILE_PATH = "/app/uploads";

export async function buildRevision(revision: CardDeckRevision): Promise<BuildResponse> {
	if (!revision.build?.builderId) {
		return {error: "No builder defined", messages: []};
	}
	const builder = builders[revision.build.builderId];
	if (!builder) {
		return {error: `Builder ${revision.build.builderId} not known`, messages: []};
	}
	// ??
	const config: BuilderConfig = {
		baseUrl: `/uploads`,
		filePath: FILE_PATH,
	};
	return builder(revision, config);
}

// copy files too...
export async function copyBuild(oldRevision: CardDeckRevision, newRevision: CardDeckRevision): Promise<DeckBuild> {
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
		await mkdir(newPath, {recursive: true});
		await copyDir(oldPath, newPath, true);
	} catch (err) {
		console.log(`copy build error ${err.message}`, err);
	}
	return build;
	//});//promise
}

async function copyDir(oldPath: string, newPath: string, recurse: boolean) {
	if (debug) console.log(`copy ${oldPath} to ${newPath}`);
	const files = await readdir(oldPath, {withFileTypes: true});
	for (const file of files) {
		const oldFile = oldPath + '/' + file.name;
		const newFile = newPath + '/' + file.name;
		if (file.isFile()) {
			try {
				await copyFile(oldFile, newFile);
			} catch (err) {
				console.log(`error copying ${oldFile} to ${newFile}: ${err.mesage}`);
			}
		} else if (file.isDirectory() && recurse) {
			try {
				await mkdir(newFile);
				await copyDir(oldFile, newFile, recurse);
			} catch (err) {
				console.log(`error making new directory ${newFile}: ${err.mesage}`);
			}
		}
	}
}

async function checkDirectoryExists(file: PathLike) {
	return await stat(file)
		.then((dir) => dir.isDirectory)
		.catch(() => false)
}

export async function getFilePath(deckId: string, revId: string, path: string): Promise<string> {
	const revPath = `${FILE_PATH}/${deckId}/${revId}`
	if (!await checkDirectoryExists(revPath)) {
		return null
	}
	const relPath = `${revPath}/${path}`;
	if (!await checkDirectoryExists(relPath)) {
		return null
	}

	return relPath
}

export async function getFileInfo(deckId: string, revId: string, path: string): Promise<FileInfo[]> {
	const revPath = `${FILE_PATH}/${deckId}/${revId}`
	if (!await checkDirectoryExists(revPath)) {
		return []
	}
	const normalizedPath = path.replace(/^\//, '')
	const relPath = `${revPath}/${normalizedPath}`;
	const stats = await stat(relPath);
	if (stats.isFile()) {
		if (debug) console.log(`getDirInfo for file ${relPath}`);
		return [{name: path, path: relPath, isDirectory: false}];
	}
	if (!stats.isDirectory()) {
		if (debug) console.log(`getDirInfo for non-directory ${relPath}`);
		return [];
	}
	const files = await readdir(relPath, {withFileTypes: true});
	const fis: FileInfo[] = [];
	for (const file of files) {
		if (file.isDirectory() || file.isFile()) {
			fis.push({
				name: file.name,
				path: `${normalizedPath}/${file.name}`.replace(/^\//, ''),
				isDirectory: file.isDirectory()
			});
		}
	}
	return fis;
}

export async function writeToFile(deckId: string, revId: string, path: string, file: File) {
	const revPath = `${FILE_PATH}/${deckId}/${revId}`
	await mkdir(revPath, {
		recursive: true
	})
	const relPath = `${revPath}/${path}/${file.name}`
	const data = toBuffer(await file.arrayBuffer())
	if (file.name.endsWith('.zip')) {
		const zip = new AdmZip(data)
		zip.extractAllTo(`${revPath}/${path}`, true)
	} else {
		await writeFile(relPath, data)
	}
}

function toBuffer(ab: ArrayBuffer): Buffer {
	const buf = Buffer.alloc(ab.byteLength);
	const view = new Uint8Array(ab);
	for (let i = 0; i < buf.length; ++i) {
		buf[i] = view[i];
	}
	return buf;
}

export async function deleteFile(deckId: string, revId: string, path: string) {
	const revPath = `${FILE_PATH}/${deckId}/${revId}`
	const relPath = `${revPath}/${path}`
	const statInfo = await stat(relPath)
	if (statInfo.isDirectory()) {
		await rmdir(relPath, {recursive: true})
	} else {
		await rm(relPath)
	}
}

