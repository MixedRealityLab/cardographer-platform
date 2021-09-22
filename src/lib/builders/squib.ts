// squip worker builder
import type {BuildResponse} from '$lib/apitypes';
import {exportCardsAsCsv} from '$lib/csvutils';
import type {BuilderConfig} from '$lib/systemtypes';
import type {AtlasInfo, CardDeckRevision, CardInfo} from '$lib/types';
import {CardPropertyUse} from '$lib/types';
import fs from 'fs';
import yaml from 'js-yaml';
import net from 'net';

const fsPromises = fs.promises;

const debug = true;

const SQUIB_HOST = "squib";
const SQUIB_PORT = 3001;
const SQUIB_COMMAND = "rundeck/2";
const DEFAULT_OPTIONS_FILE = "options.yml";
const OPTION_OUTPUT = "output";
const OPTION_PNG = "png";
const OPTION_SHEET = "sheet";
const OPTION_PREFIX = "prefix";
const OPTION_COUNT_FORMAT = "count_format";
const OPTION_COLUMNS = "columns";
const OPTION_ROWS = "rows";
const OUTPUT_DIR = "_output";

function onlyUnique(value, index, self) {
	return self.indexOf(value) === index;
}

export async function build(revision: CardDeckRevision, config: BuilderConfig): Promise<BuildResponse> {
	if (debug) console.log(`squib build ${revision.deckId} ${revision.revision} ...`);
	const revPath = `${revision.deckId}/${revision.revision}`;
	const filePath = `${config.filePath}/${revPath}`;
	// each back => an atlas
	const backColumn = revision.propertyDefs.find((p) => p.use == CardPropertyUse.Back);
	let backs: string[] = [];
	if (!backColumn) {
		backs = [''];
	} else {
		backs = revision.cards.filter((c) => !c.id.startsWith('back:')).map((c) => c.back ? c.back : '').filter(onlyUnique);
	}
	const optionsFile = `${filePath}/${DEFAULT_OPTIONS_FILE}`;
	let options: any = {};
	try {
		const yoptions = await fsPromises.readFile(optionsFile);
		options = yaml.load(yoptions);
	} catch (err) {
		if (debug) console.log(`error reading ${optionsFile}: ${err.mesage}`, err);
		return {
			messages: [],
			error: `Unable to read squib options file - the files for this build may be wrong`
		}
	}
	if (debug) console.log(`options:`, options);
	// TODO use their options instead...
	// delete old files (go to _output)
	await rmAll(`${filePath}/_output`);
	// cards updates...
	let now = new Date().toISOString();
	let allCards: CardInfo[] = [];
	let allMessages: string[] = [];
	let atlases: AtlasInfo[] = [];
	const frontUrlProp = revision.propertyDefs.find((p) => p.use == CardPropertyUse.FrontUrl);
	const frontFileProp = revision.propertyDefs.find((p) => p.use == CardPropertyUse.FrontFile);
	const frontUrlPropName = frontUrlProp && frontUrlProp.title ? frontUrlProp.title : CardPropertyUse.FrontUrl;
	const frontFilePropName = frontFileProp && frontFileProp.title ? frontFileProp.title : CardPropertyUse.FrontFile;
	// each back	
	for (let back of backs) {
		if (debug) console.log(`process back ${back}`);
		let cards = revision.cards.filter((c) => back == (c.back ? c.back : '') && !c.id.startsWith('back:'));
		let backcard = revision.cards.find((c) => `back:${back}` == c.id);
		if (!backcard) {
			if (debug) console.log(`missing card back back:${back}`);
			backcard = {
				id: `back:${back}`,
				revision: 1,
				created: now,
				lastModified: now
			};
		}
		cards.push(backcard);
		// back-specific filename prefix, map ' ' -> '_'
		const prefix = back.length > 0 ? (back.split(' ').join('_')) + '_' : '';
		// export cards to .../...card-data.csv (not all columns, no row types, with back)
		const csv = await exportCardsAsCsv(revision, false, false, cards);
		const csvFile = `${filePath}/${prefix}card-data.csv`;
		if (debug) console.log(`write cards to ${csvFile}`);
		await fsPromises.writeFile(csvFile, csv, {});
		// generate options file
		const backOptionsFile = prefix + DEFAULT_OPTIONS_FILE;
		let localopts = {...options, output: '_output', csvfile: `${prefix}card-data.csv`};
		localopts.png = {...options.png, prefix: prefix + 'card_', count_format: '%02d'};
		localopts.sheet = {...options.sheet, prefix: prefix + 'Atlas_', count_format: '%d'};
		localopts.pdf = {...options.pdf, file: prefix + options.pdf.file};
		//if (debug) console.log(`back ${back} options ${backOptionsFile}`, localopts);
		const opts = yaml.dump(localopts);
		//if (debug) console.log(`back ${back} options ${backOptionsFile}`, opts);
		await fsPromises.writeFile(`${filePath}/${backOptionsFile}`, opts);
		const {ok, error, output} = await callWorker(revPath, backOptionsFile);
		let messages = output ? output.split('\n') : [];
		//console.log(`messages[${messages.length}]`);
		try {
			messages = JSON.parse(output);
		} catch (err) {
		}
		allMessages = allMessages.concat([`--- back: ${back.length == 0 ? '(default)' : back} ---\n`], messages);

		if (!ok) {
			return {
				messages: allMessages,
				error: error ? error : 'Not OK'
			}
		}
		// squib currently generates _output/card_NN.png
		for (let cix in cards) {
			const card = cards[cix];
			let newCard: CardInfo = {
				id: card.id,
				revision: card.revision,
			};
			const fileName = `${localopts.png.prefix}${Math.floor(cix / 10)}${cix % 10}.png`;
			newCard[frontFilePropName] = fileName;
			newCard[frontUrlPropName] = `${config.baseUrl}${revPath}/${localopts.output}/${fileName}`;
			allCards.push(newCard);
		}
		// atlas
		let countX = Number(localopts.sheet.columns);
		let countY = Number(localopts.sheet.rows);
		let atlas: AtlasInfo = {
			name: `${revision.deckName}${back.length > 0 ? ' - ' : ''}${back}`,
			atlasURLs: [],
			countX: [], //Number(localopts.sheet.columns),
			countY: [], //Number(localopts.sheet.rows),
			cardCount: cards.length, // includes back
			cardInfo: cards.map((c) => c.id),
			builderId: 'squib'
		};
		// Warning: this may not be reliable: with up to columns
		// card it output 1 row; with more it outputs rows rows
		const sheets = Math.ceil(cards.length / (countX * countY));
		for (let i = 0; i < sheets; i++) {
			const fileName = `${localopts.sheet.prefix}${i}.png`;
			atlas.atlasURLs.push(`${config.baseUrl}/${revPath}/${localopts.output}/${fileName}`);
			atlas.countX.push(countX);
			atlas.countY.push(countY);
		}
		if (sheets == 1 && atlas.cardCount <= countX) {
			atlas.countY[0] = 1;
		}
		// needed?
		atlas.atlasCount = atlas.atlasURLs.length;
		atlases.push(atlas);
	}
	//if(debug) console.log(`cards`, allCards);
	return {
		messages: allMessages,
		cards: allCards,
		atlases: atlases
	}
}

interface CallRes {
	ok: boolean;
	error?: string;
	output?: string;
}

enum WState {
	AWAIT_CONNECT, AWAIT_CONNECTED, AWAIT_RUNNING, AWAIT_DONE, DONE, ERROR
}

const WORKER_CONNECTED = "<CONNECTED 1";
const WORKER_RUNNING = "<RUNNING";
const WORKER_DONE = "<DONE";
const WORKER_ERROR = "<ERROR";
const WORKER_TIMEOUT = 30000;

async function callWorker(revPath: string, optionsFile: string): Promise<CallRes> {
	let state = WState.AWAIT_CONNECT;
	let output = [];
	return new Promise<CallRes>((resolve, reject) => {
		let sock = new net.Socket();
		let timeout = setTimeout(() => {
			if (debug) console.log('socket timeout');
			if (state != WState.DONE && state != WState.ERROR) {
				resolve({ok: false, error: 'Took too long'});
			}
			sock.destroy();
		}, WORKER_TIMEOUT);

		sock.connect({port: SQUIB_PORT, host: SQUIB_HOST}, () => {
			if (debug) {
				console.log('connected');
			}
			state = WState.AWAIT_CONNECTED;
			// Wait for <CONNECTED 1
		});
		sock.on('data', (chunk) => {
			if (debug) console.log(`read ${chunk.toString()}`);
			let text = chunk.toString();
			if (state == WState.AWAIT_CONNECTED) {
				if (text.indexOf(WORKER_CONNECTED) >= 0) {
					sock.write(`${SQUIB_COMMAND} ${revPath} ${optionsFile}\n`);
					if (debug) console.log(`sent command ${SQUIB_COMMAND} ${revPath} ${optionsFile}`);
					state = WState.AWAIT_RUNNING;
				} else {
					if (debug) console.log(`bad initial response: ${text}`);
					sock.close();
					return;
				}
			}
			if (state == WState.AWAIT_RUNNING && text.indexOf(WORKER_RUNNING) >= 0) {
				const ix = text.indexOf(WORKER_RUNNING);
				text = text.substring(ix + WORKER_RUNNING.length);
				state = WState.AWAIT_DONE;
				if (debug) console.log(`running...`);
			}
			if (state == WState.AWAIT_DONE) {
				let ix = text.indexOf(WORKER_DONE);
				const ix2 = text.indexOf(WORKER_ERROR);
				if (ix2 >= 0 && ix < 0) {
					ix = ix2;
				}
				if (ix < 0) {
					output.push(text);
				} else {
					text = text.substring(0, ix);
					output.push(text);
					if (debug) console.log(`done!`);
					sock.destroy();
					clearTimeout(timeout);
					if (ix2 < 0) {
						if (debug) console.log(`done!`);
						state = WState.DONE;
						resolve({ok: true, output: output.join('')});
					} else {
						if (debug) console.log(`error!`);
						state = WState.ERROR;
						resolve({
							ok: false,
							error: 'There was an error generating the cards; please check the build messags',
							output: output.join('')
						});
					}
					return;
				}
			}
		});
		sock.on('end', () => {
			if (debug) console.log(`connection closed`);
			if (state != WState.DONE && state != WState.ERROR) {
				resolve({ok: false, error: 'worker connection closed'});
			}
			clearTimeout(timeout);
		});
		sock.on('error', (err) => {
			if (debug) console.log(`error: ${err}`);
			if (state != WState.DONE && state != WState.ERROR) {
				resolve({ok: false, error: err.message});
			}
			clearTimeout(timeout);
		});
	})
}//return new Promise

export async function rmAll(path: string) {
	const files = await fsPromises.readdir(path, {withFileTypes: true});
	for (const file of files) {
		if (file.isFile()) {
			const fpath = `${path}/${file.name}`;
			try {
				await fsPromises.rm(fpath);
			} catch (err) {
				console.log(`could not delete old output ${fpath}: ${err.message}`);
			}
		}
	}
}

