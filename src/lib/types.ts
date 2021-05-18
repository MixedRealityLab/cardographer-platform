// cardographer types - see datamodel.md

// deck summary caches latest revision info and adds only owners
// i.e. RBAC for all revisions in deck
export interface CardDeckSummary {
	_id: string;
	name: string;
	description?: string;
	credits?: string;
	isPublic: boolean;
	owners: string[];
}

// summary is returned for list all revisions
export interface CardDeckRevisionSummary {
	_id: string;
	deckId: string;
	revision: number; // integer 1..
	slug?: string;
	deckName: string;
	deckDescription?: string;
	deckCredits?: string;
	created: string;
	lastModified: string;
	revisionName?: string;
	revisionDescription?: string;
	isUsable: boolean;
	isPublic: boolean;
	isLocked: boolean;
	isTemplate: boolean;
	cardCount: number; // summary only
}
// full revision data
export interface CardDeckRevision extends CardDeckRevisionSummary {
	propertyDefs: CardPropertyDef[];
	defaults: CardInfo;
	cards: CardInfo[];
	build?: DeckBuild;
	output?: DeckOutput;
}

// card property metadata
export interface CardPropertyDef {
	use: CardPropertyUse;
	customFieldName?: string;
	title?: string;
	description?: string;
	defaultExport?: boolean;
	sortBy?: number;
}

// all pre-defined card property types
export enum CardPropertyUse {
	Id = "id",
	Revision = "revision",
	Link = "link",
	Name = "name",
	Description = "description",
	Slug = "slug",
	Credits = "credits",
	Created = "created",
	LastModified = "lastModified",
	Width = "width",
	Height = "height",
	SizeName = "sizeName",
	SortBy = "sortBy",
	Category = "category",
	Subtype = "subtype",
	Attribute = "attribute",
	AssetFile = "assetFile",
	Content = "content",
	FrontUrl = "frontUrl",
	BackUrl = "backUrl",
	FrontFile = "frontFile",
	BackFile = "backFile",
	FrontTop = "frontTop",
	FrontLeft = "frontLeft",
	FrontWidth = "frontWidth",
	FrontHeight = "frontHeight",
	BackTop = "backTop",
	BackLeft = "backLeft",
	BackWidth = "backWidth",
	BackHeight = "backHeight"
}

export type CustomFields = {
	[key:string] : string;
}

// single Card or deck default
export interface CardInfo {

	// standard metadata
	id: string;
	revision: number; // integer
	link?: string; // URL
	name?: string;
	description?: string;
	slug?: string;
	credits?: string;
	created: string; // ISODate
	lastModified: string; // ISODate

	// basic card properties
	width?: number; // physical, mm
	height?: number; // physical, mm
	sizeName?: string; // e.g. "poker"

	// deck-specific properties
	sortBy?: number;
	categody?: string;
	subtype?: string; // default subtype
	attriute?: string; // default attribute
	custom?: CustomFields; // also custom assetFile or content

	// card generation
	assetFile?: string; // filename?
	content?: string;

	// card output
	frontUrl?: string;
	backUrl?: string;
	frontFile?: string;
	backFile?: string;
	frontTop?: number; // pixels
	backTop?: number; // pixels
	frontLeft?: number; //pixels
	backLeft?: number; //pixels
	frontWidth?: number; // pixels
	backWidth?: number; // pixels
	frontHeight?: number; // pixels
	backHeight?: number; // pixels
}

// deck build info - to be refined
export interface DeckBuild {
	files?: FileInfo[];
	buildType: string;
	config?: any; // TBD
	lastBuilt?: string; // ISODate
	status: DeckBuildStatus;
	messages?: string[];
	isDisabled: boolean;
}

export enum DeckBuildStatus {
	Unbuilt = "unbuilt",
	Building = "building",
	Failed = "failed",
	Built = "built"
}

export interface FileInfo {
	path: string;
	mimeType: string;
	length: number;
}

// output - to be refined
export interface DeckOutput {
	files: FileInfo[];
	isUserModified: boolean;
}

//EOF
