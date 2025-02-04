// card CSV utils
import type {BoardInfo, CardDeckRevision, CardInfo, CardPropertyDef} from '$lib/types'
import {BoardProperty, CardPropertyUse} from '$lib/types'
import {stringify} from "csv"

const ROWTYPE_TITLE = 'title:';
const ROWTYPE_USE = 'use:';
const ROWTYPE_DEFAULT = 'default:';
const ROWTYPE_CARD = 'card:';
const ROWTYPE_BACK = 'back:';
const ROWTYPE_EXPORT = 'export:';
const ROWTYPE_DESCRIPTION = 'description:';
const ROWTYPE_BOARD = 'board:';
const ROWTYPE_REGION = 'region:';
const PREFIX_BACK = 'back:';

const debug = true;

// CSV file as string[][]
// to updated propertyDefs and cards
export function readCards(revision: CardDeckRevision, cells: string[][], addColumns: boolean): CardDeckRevision {
	const propDefs: CardPropertyDef[] = revision.propertyDefs;
	const oldCards: CardInfo[] = revision.cards.slice();
	let defaults = revision.defaults;

	if (cells.length < 1) {
		throw new Error('CSV file is empty');
	}
	const headers = cells[0];
	if (headers.length < 1) {
		throw new Error('Headers missing');
	}
	const hasRowtype = headers[0] == ROWTYPE_TITLE;
	const useRow = hasRowtype ? cells.findIndex((cs) => cs.length > 0 && cs[0] == ROWTYPE_USE) : -1;
	const hasUse = useRow >= 0;
	const defaultRow = hasRowtype ? cells.findIndex((cs) => cs.length > 0 && cs[0] == ROWTYPE_DEFAULT) : -1;
	const hasDefault = defaultRow >= 0;
	const exportRow = hasRowtype ? cells.findIndex((cs) => cs.length > 0 && cs[0] == ROWTYPE_EXPORT) : -1;
	const hasExport = exportRow >= 0;
	const descriptionRow = hasRowtype ? cells.findIndex((cs) => cs.length > 0 && cs[0] == ROWTYPE_DESCRIPTION) : -1;
	const hasDescription = descriptionRow >= 0;
	//if (debug) console.log(`rows: default ${defaultRow} export ${exportRow} description ${descriptionRow} use ${useRow}`);

	const columns: CardPropertyDef[] = [];
	if (hasRowtype) {
		columns.push({} as CardPropertyDef);
	}
	// check columns = property defs
	for (let i = (hasRowtype ? 1 : 0); i < headers.length; i++) {
		const title = headers[i];
		const prop = revision.propertyDefs.find((pd) => pd.title ? pd.title == title : pd.use == title);
		const use = hasUse && cells[useRow].length > i ? guessUse(cells[useRow][i]) : guessUse(title);
		const defaultExport = hasExport && cells[exportRow].length > i ? isTrue(cells[exportRow][i]) : true;
		const sortBy = i + (hasRowtype ? 0 : 1);
		const description = hasDescription && cells[descriptionRow].length > i ? cells[descriptionRow][i] : '';
		if (prop) {
			// check/update column props if present?
			if (hasDescription) {
				prop.description = description;
			}
			if (hasExport) {
				prop.defaultExport = defaultExport;
			}
			if (hasUse) {
				prop.use = use;
			}
			if (hasRowtype) {
				prop.sortBy = sortBy;
			}
			columns.push(prop);
			//if (debug) console.log(`update prop`, prop);
		} else {
			const newProp: CardPropertyDef = {
				use: use,
				title: title,
				// customFieldName
				defaultExport: defaultExport,
				sortBy: sortBy,
				description: description,
			};
			//console.log(newProp)

			if (addColumns) {
				if (debug) console.log(`add column ${title}`, newProp);
				propDefs.push(newProp);
				columns.push(newProp);
			} else {
				if (debug) console.log(`ignore unknown column ${title}`);
				columns.push({} as CardPropertyDef);
			}
		}
	}
	updateCustomFieldNames(propDefs);
	const now = new Date().toISOString();
	// default
	if (hasDefault) {
		if (!defaults) {
			// initial
			defaults = {
				id: "defaults:",
				revision: 1,
				created: now,
				lastModified: now
			}
		}
		defaults = updateCardInfo(defaults, cells[defaultRow], columns);
	}
	const newCards: CardInfo[] = [];
	// cards
	// explicit ID?
	const idColumn = columns.findIndex((c) => c.use == CardPropertyUse.Id);
	let cardCount = 0;
	for (let i = 1; i < cells.length; i++) {
		const values = cells[i];
		if (values.length < 1 || (hasRowtype && values[0] != ROWTYPE_CARD && values[0] != ROWTYPE_BACK))
			continue;
		cardCount++;
		let id: string = idColumn >= 0 && values.length > idColumn ? values[idColumn] : '';
		if (!id) {
			id = `_${cardCount}`; // default id = card no.
		}
		if (hasRowtype && values[0] == ROWTYPE_BACK) {
			if (id.indexOf(PREFIX_BACK)!=0) {
				id = PREFIX_BACK+id; // All backs start with 'back:'
			}
		}
		// find card?
		let oldCard: CardInfo = oldCards.find((c) => c.id == id);
		if (!oldCard) {
			oldCard = {
				id,
				revision: 1,
				created: now,
				lastModified: now
			}
		}
		const newCard = updateCardInfo(oldCard, values, columns);
		newCards.push(newCard);
	}
	if (debug) console.log(`${newCards.length} new cards`);

	return {...revision, defaults, propertyDefs: propDefs, cards: newCards, cardCount: newCards.length}

}

function updateCustomFieldNames(props: CardPropertyDef[]) {
	const counts = {};
	for (const p in props) {
		const prop = props[p];
		if (counts[prop.use]) {
			prop.customFieldName = prop.title;
			if (debug) console.log(`${prop.title} is custom ${prop.use} field`);
		} else {
			delete prop.customFieldName;
			counts[prop.use] = true;
		}
	}
}

function updateCardInfo(info: CardInfo, values: string[], columns: CardPropertyDef[]): CardInfo {
	for (let i = 0; i < values.length; i++) {
		const value = values[i];
		if (value === null || value === undefined || value === '') {
			continue
		}
		if (!columns[i].use)
			// ignore rowtype or unknown/unadded
			continue
		if (columns[i].customFieldName) {
			if (!info.custom) {
				info.custom = {};
			}
			info.custom[columns[i].customFieldName] = value;
		} else {
			info[columns[i].use.toString()] = value;
		}
	}
	return info;
}

function isTrue(value: string): boolean {
	if (!value)
		return false;
	value = value.toLowerCase();
	return !(value.startsWith('n') || value == "0" || value.startsWith('f'));
}

function getValue(column: BoardProperty, columns: BoardProperty[], values: string[], defaultValue: string = null): string {
	const colIndex = columns.indexOf(column)
	if (colIndex < 0) {
		return defaultValue
	}
	const value = values[colIndex]
	if (!value) {
		return defaultValue
	} else {
		return value
	}
}

function getBooleanValue(column: BoardProperty, columns: BoardProperty[], values: string[], defaultValue = true): boolean {
	const value = getValue(column, columns, values).toLowerCase()
	if (defaultValue) {
		return value != 'n' && value != 'false'
	} else {
		return value != 'y' && value != 'true'
	}
}

function getFloatValue(column: BoardProperty, columns: BoardProperty[], values: string[], defaultValue: number = null): number {
	const value = getValue(column, columns, values)
	if (!value) {
		return defaultValue
	} else {
		return parseFloat(value)
	}
}

export function readBoard(cells: string[][]): BoardInfo {
	if (cells.length < 1) {
		throw new Error('CSV file is empty');
	}
	const headers = cells[0];
	if (headers.length < 1) {
		throw new Error('Headers missing');
	}
	const hasRowtype = headers[0] == ROWTYPE_TITLE
	const columns: BoardProperty[] = [];
	if (hasRowtype) {
		columns.push(null);
	}
	for (let i = (hasRowtype ? 1 : 0); i < headers.length; i++) {
		columns.push(guessBoardProperty(headers[i]))
	}
	const board: BoardInfo = {
		name: "New Board",
		regions: []
	}

	for (let i = 1; i < cells.length; i++) {
		const values = cells[i];
		if (values.length < 1 || (hasRowtype && values[0] != ROWTYPE_REGION && values[0] != ROWTYPE_BOARD))
			continue;

		if (hasRowtype && values[0] == ROWTYPE_BOARD) {
			board.name = getValue(BoardProperty.Name, columns, values, "New Board")
			board.description = getValue(BoardProperty.Description, columns, values, null)
		} else {
			board.regions.push({
				id: getValue(BoardProperty.Id, columns, values, `_${board.regions.length + 1}`),
				name: getValue(BoardProperty.Name, columns, values, "Region " + (board.regions.length + 1)),
				description: getValue(BoardProperty.Description, columns, values),
				x: getFloatValue(BoardProperty.X, columns, values),
				y: getFloatValue(BoardProperty.Y, columns, values),
				width: getFloatValue(BoardProperty.Width, columns, values),
				height: getFloatValue(BoardProperty.Height, columns, values),
				analyse: getBooleanValue(BoardProperty.Analyse, columns, values)
			})
		}
	}
	return board
}

function guessBoardProperty(name: string): BoardProperty {
	const s = name.toLowerCase();
	const use = Object.values(BoardProperty).find((use) => use.toLowerCase() == s)
	if (use) {
		return use
	}
	return BoardProperty.Name;
}

function guessUse(name: string): CardPropertyUse {
	const s = name.toLowerCase();
	const use = Object.values(CardPropertyUse).find((use) => use.toLowerCase() == s)
	console.log(`${name} ==> ${use}`)
	if (use) {
		return use
	}
	// default to attribute
	return CardPropertyUse.Attribute;
}

const BIG_SORT_BY = 10000;

function fixSortBy(i?: number): number {
	if (i === null || i === undefined)
		return BIG_SORT_BY;
	return i;
}

export async function exportCardsAsCsv(revision: CardDeckRevision, withRowTypes: boolean, cards: CardInfo[]): Promise<string> {
	const rows: string[][] = []
	let columns = revision.propertyDefs.slice()
	columns.sort((a, b) => fixSortBy(a.sortBy) - fixSortBy(b.sortBy));
	// title
	let row: string[] = [];
	if (withRowTypes) {
		row.push(ROWTYPE_TITLE);
	}
	for (let i = 0; i < columns.length; i++) {
		const column = columns[i];
		if (column.title) {
			row.push(column.title);
		} else {
			row.push(column.use);
		}
	}
	rows.push(row);

	// metadata?
	if (withRowTypes) {
		// use
		row = [];
		row.push(ROWTYPE_USE);
		for (let i = 0; i < columns.length; i++) {
			row.push(columns[i].use);
		}
		rows.push(row);
		row = [];
		row.push(ROWTYPE_DESCRIPTION);
		for (let i = 0; i < columns.length; i++) {
			row.push(columns[i].description);
		}
		rows.push(row);
		row = [];
		row.push(ROWTYPE_EXPORT);
		for (let i = 0; i < columns.length; i++) {
			row.push(columns[i].defaultExport ? 'Y' : '');
		}
		rows.push(row);
		// defaults
		row = [];
		row.push(ROWTYPE_DEFAULT);
		for (let i = 0; i < columns.length; i++) {
			const column = columns[i];
			if (!revision.defaults) {
				row.push('');
			} else if (column.customFieldName) {
				if(revision.defaults.custom) {
					row.push(revision.defaults.custom[column.customFieldName]);
				} else {
					row.push('')
				}
			} else {
				row.push(<string>revision.defaults[column.use]);
			}
		}
		rows.push(row);
	}
	// cards
	if (!cards) {
		cards = revision.cards;
	}
	for(const card of cards) {
		//console.log(card)
		//console.log(columns)
		const row = [];
		if (withRowTypes) {
			row.push(ROWTYPE_CARD);
		}
		for (const column of columns) {
			if (column.customFieldName) {
				if(card.custom) {
					row.push(card.custom[column.customFieldName]);
				} else {
					row.push('')
				}
			} else {
				row.push(card[column.use]);
			}
		}
		rows.push(row);
	}
	// to CSV
	return arrayToCsv(rows);
}

export async function arrayToCsv(rows: string[][]): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const stringifier = stringify({});
		const data = []
		stringifier.on('readable', function () {
			let row: string;
			while (row = stringifier.read()) {
				data.push(row)
			}
		});
		stringifier.on('error', function (err) {
			if (debug) console.error(`CSV error: ${err.message}`);
			reject(err.message);
		});
		stringifier.on('finish', function () {
			const text = "\ufeff" + data.join('');
			resolve(text);
		});
		for (const row in rows) {
			stringifier.write(rows[row]);
		}
		stringifier.end()
	})
}