// squip worker builder
import type { BuildResponse } from '$lib/apitypes.ts';
import type { CardDeckRevision } from '$lib/types.ts';
import { CardPropertyUse } from '$lib/types.ts';
import type { BuilderConfig } from '$lib/systemtypes.ts';
import { exportCardsAsCsv } from '$lib/csvutils.ts';
import fs from 'fs';
import net from 'net';

const debug = true;

const SQUIB_HOST = "squib";
const SQUIB_PORT = 3001;
const SQUIB_COMMAND = "rundeck/1";

export async function build( revision: CardDeckRevision, config: BuilderConfig) : BuildResponse {
	if (debug) console.log(`squib build ${revision.deckId} ${revision.revision} ...`);
	const revPath = `${revision.deckId}/${revision.revision}`;
	const filePath = `${config.filePath}/${revPath}`;
	// export cards to .../card-data.csv (not all columns, no row types, with back)
	const csv = await exportCardsAsCsv( revision, false, false, true );
	const csvFile = `${filePath}/card-data.csv`;
	if (debug) console.log(`write cards to ${csvFile}`);
	await writeFile(csvFile, csv);
	const { ok, error, output } = await callWorker( revPath );
	const messages = output ? output.split('\n') : [];
	if (!ok) {
		return { 
			messages: messages,
			error: error ? error : 'Not OK'
		}
	}
	// cards updates...
	let cards: CardInfo[] = [];
	// squib currently generates _output/card_NN.png
	const frontUrlProp = revision.propertyDefs.find((p) => p.use == CardPropertyUse.FrontUrl);
	const frontFileProp = revision.propertyDefs.find((p) => p.use == CardPropertyUse.FrontFile);
	const frontUrlPropName = frontUrlProp && frontUrlProp.title ? frontUrlProp.title : CardPropertyUse.FrontUrl;
	const frontFilePropName = frontFileProp && frontFileProp.title ? frontFileProp.title : CardPropertyUse.FrontFile;
	for (let cix in revision.cards) {
		const card = revision.cards[cix];
		let newCard:CardInfo = {
		 	id: card.id,
	       		revision: card.revision,
		};		
		const fileName = `card_${Math.floor(cix/10)}${cix % 10}.png`;
		newCard[frontFilePropName] = fileName;
		newCard[frontUrlPropName] = `${config.baseUrl}${revPath}/${fileName}`;
		cards.push(newCard);
	}
	if(debug) console.log(`cards`, cards);
	return {
		messages: messages,
		cards: cards
	}
}
async function writeFile(csvFile:string, csv:string) {
	return new Promise((resolve, reject) => {
		fs.writeFile(csvFile, csv, {}, (err) => {
			if (err) {
				if (debug) console.log(`writing csv file ${csvFile}: ${err.message}`);
				reject(`writing csv file: ${err.message}`);
			}
			resolve();
		});
	});
}
interface CallRes {
	ok: boolean;
	error?: string;
	output?: string;
}
enum WState {
	AWAIT_CONNECT, AWAIT_CONNECTED, AWAIT_RUNNING, AWAIT_DONE, DONE
};
const WORKER_CONNECTED = "<CONNECTED 1";
const WORKER_RUNNING = "<RUNNING";
const WORKER_DONE = "<DONE";
const WORKER_TIMEOUT = 30000;

async function callWorker( revPath: string ) : CallRes {
	let state = WState.AWAIT_CONNECT;
	let output = [];
return new Promise<CallRes>((resolve,reject) => {
	let sock = new net.Socket();
	let timeout = setTimeout(() => {
		if (debug) console.log('socket timeout');
		if (state != WState.DONE) {
			resolve({ok:false, error: 'Took too long'});
		}
		sock.destroy();
	}, WORKER_TIMEOUT);

	sock.connect({port:SQUIB_PORT, host:SQUIB_HOST}, () => {
		if (debug) { console.log('connected'); }
		state = WState.AWAIT_CONNECTED; 
		// Wait for <CONNECTED 1
	});
	sock.on('data', (chunk) => {
		if (debug) console.log(`read ${chunk.toString()}`);
		let text = chunk.toString();
		if (state == WState.AWAIT_CONNECTED) {
		       if (text.indexOf(WORKER_CONNECTED)>=0) {
				sock.write(`${SQUIB_COMMAND} ${revPath}\n`);
				if (debug) console.log(`sent command ${SQUIB_COMMAND} ${revPath}`);
				state = WState.AWAIT_RUNNING;
		       } else {
			       if (debug) console.log(`bad initial response: ${text}`);
			       sock.close();
			       return;
		       }
		}
		if (state == WState.AWAIT_RUNNING  && text.indexOf(WORKER_RUNNING)>=0) {
			const ix = text.indexOf(WORKER_RUNNING);
			text = text.substring(ix + WORKER_RUNNING.length);
			state = WState.AWAIT_DONE;
			if (debug) console.log(`running...`);
		}
		if (state == WState.AWAIT_DONE) {
			const ix = text.indexOf(WORKER_DONE);
			if (ix < 0) {
				output.push(text);
			} else {
				text = text.substring(0, ix);
				output.push(text);
				if (debug) console.log(`done!`);
				sock.destroy();
				clearTimeout(timeout);
				state = WState.DONE;
				resolve({ ok: true, output: output.join('') });
				return;
			}
		}
	});
	sock.on('end', () => {
		if (debug) console.log(`connection closed`);
		if (state != WState.DONE) {
			resolve({ ok: false, error: 'worker connection closed' });
		}
		clearTimeout(timeout);
	});
	sock.on('error', (err) => {
		if (debug) console.log(`error: ${err}`);
		if (state != WState.DONE) {
			resolve({ ok: false, error: err.message });
		}
		clearTimeout(timeout);
	});
})}//return new Promise


