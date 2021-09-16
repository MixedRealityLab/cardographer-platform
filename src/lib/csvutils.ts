// card CSV utils
import type {CardDeckRevision, CardInfo, CardPropertyDef} from '$lib/types';
import {CardPropertyUse} from '$lib/types';
import stringify from 'csv-stringify';

const ROWTYPE_TITLE = 'title:';
const ROWTYPE_USE = 'use:';
const ROWTYPE_DEFAULT = 'default:';
const ROWTYPE_CARD = 'card:';
const ROWTYPE_EXPORT = 'export:';
const ROWTYPE_DESCRIPTION = 'description:';
//const PREFIX_BACK = 'back:';

const debug = true;

// CSV file as string[][]
// to updated propertyDefs and cards
export function readCards(revision: CardDeckRevision, cells: string[][], addColumns: boolean): CardDeckRevision {
	let propDefs: CardPropertyDef[] = revision.propertyDefs;
	let oldCards: CardInfo[] = revision.cards.slice();
	let defaults = revision.defaults;
//	let back = revision.back;

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

	let columns: CardPropertyDef[] = [];
	if (hasRowtype) {
		columns.push({} as CardPropertyDef);
	}
	// check columns = property defs
	for (let i = (hasRowtype ? 1 : 0); i < headers.length; i++) {
		const title = headers[i];
		let prop = revision.propertyDefs.find((pd) => pd.title ? pd.title == title : pd.use == title);
		const use = hasUse && cells[useRow].length > i ? guessUse(cells[useRow][i]) : guessUse(title);
		const defaultExport = hasExport && cells[exportRow].length > i ? isTrue(cells[exportRow][i]) : false;
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
	let now = new Date().toISOString();
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
	let newCards: CardInfo[] = [];
	// cards
	// explicit ID?
	const idColumn = columns.findIndex((c) => c.use == CardPropertyUse.Id);
	let cardCount = 0;
	for (let i = 1; i < cells.length; i++) {
		const values = cells[i];
		if (values.length < 1 || (hasRowtype && values[0] != ROWTYPE_CARD))
			continue;
		cardCount++;
		let id: string = idColumn >= 0 && values.length > idColumn ? values[idColumn] : '';
		if (!id) {
			id = `_${cardCount}`; // default id = card no.
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
	let counts = {};
	for (let p in props) {
		let prop = props[p];
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
		if (!columns[i].use)
			// ignore rowtype or unknown/unadded
			continue;
		if (columns[i].customFieldName) {
			if (!info.custom) {
				info.custom = {};
			}
			info.custom[columns[i].customFieldName] = value;
		} else {
			info[columns[i].use] = value;
		}
	}
	return info;
}

function isTrue(value: string): boolean {
	if (!value)
		return false;
	value = value.toLowerCase();
	return !(value.startsWith('t') || value == "0" || value.startsWith('f'));

}

function guessUse(name: string): CardPropertyUse {
	const s = name.toLowerCase();
	if (CardPropertyUse.Id == s)
		return CardPropertyUse.Id;
	if (CardPropertyUse.Revision == s)
		return CardPropertyUse.Revision;
	if (CardPropertyUse.Link == s)
		return CardPropertyUse.Link;
	if (CardPropertyUse.Name == s)
		return CardPropertyUse.Name;
	if (CardPropertyUse.Description == s)
		return CardPropertyUse.Description;
	if (CardPropertyUse.Slug == s)
		return CardPropertyUse.Slug;
	if (CardPropertyUse.Credits == s)
		return CardPropertyUse.Credits;
	if (CardPropertyUse.Created == s)
		return CardPropertyUse.Created;
	if (CardPropertyUse.LastModified == s)
		return CardPropertyUse.LastModified;
	if (CardPropertyUse.Width == s)
		return CardPropertyUse.Width;
	if (CardPropertyUse.Height == s)
		return CardPropertyUse.Height;
	if (CardPropertyUse.SizeName == s)
		return CardPropertyUse.SizeName;
	if (CardPropertyUse.SortBy == s)
		return CardPropertyUse.SortBy;
	if (CardPropertyUse.Category == s)
		return CardPropertyUse.Category;
	if (CardPropertyUse.Subtype == s)
		return CardPropertyUse.Subtype;
	if (CardPropertyUse.Attribute == s)
		return CardPropertyUse.Attribute;
	if (CardPropertyUse.Back == s)
		return CardPropertyUse.Back;
	if (CardPropertyUse.AssetFile == s)
		return CardPropertyUse.AssetFile;
	if (CardPropertyUse.Content == s)
		return CardPropertyUse.Content;
	if (CardPropertyUse.FrontUrl == s)
		return CardPropertyUse.FrontUrl;
	if (CardPropertyUse.BackUrl == s)
		return CardPropertyUse.BackUrl;
	if (CardPropertyUse.FrontTop == s)
		return CardPropertyUse.FrontTop;
	if (CardPropertyUse.BackTop == s)
		return CardPropertyUse.BackTop;
	if (CardPropertyUse.FrontLeft == s)
		return CardPropertyUse.FrontLeft;
	if (CardPropertyUse.BackLeft == s)
		return CardPropertyUse.BackLeft;
	if (CardPropertyUse.FrontWidth == s)
		return CardPropertyUse.FrontWidth;
	if (CardPropertyUse.BackWidth == s)
		return CardPropertyUse.BackWidth;
	if (CardPropertyUse.BackHeight == s)
		return CardPropertyUse.BackHeight;
	// default to attribute
	return CardPropertyUse.Attribute;
}

const BIG_SORT_BY = 10000;

function fixSortBy(i?: number): number {
	if (i === null || i === undefined)
		return BIG_SORT_BY;
	return i;
}

export async function exportCardsAsCsv(revision: CardDeckRevision, allColumns: boolean, withRowTypes: boolean, cards: CardInfo[]): Promise<string> {
	let rows: string[][] = [];
	let columns = revision.propertyDefs.slice();
	if (!allColumns) {
		columns = columns.filter((c) => c.defaultExport);
	}
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
				row.push(revision.defaults.custom[column.customFieldName]);
			} else {
				row.push(revision.defaults[column.use]);
			}
		}
		rows.push(row);
	}
	// cards
	if (!cards) {
		cards = revision.cards;
	}
	for (let c = 0; c < cards.length; c++) {
		const card = cards[c];
		let row = [];
		if (withRowTypes) {
			row.push(ROWTYPE_CARD);
		}
		for (let i = 0; i < columns.length; i++) {
			const column = columns[i];
			if (column.customFieldName) {
				row.push(card.custom[column.customFieldName]);
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
			let row;
			while (row = stringifier.read()) {
				data.push(row)
			}
		});
		stringifier.on('error', function (err) {
			if (debug) console.error(`CSV error: ${err.message}`);
			reject(err.message);
		});
		stringifier.on('finish', function () {
			const text = data.join('');
			resolve(text);
		});
		for (let row in rows) {
			stringifier.write(rows[row]);
		}
		stringifier.end()
	})
}