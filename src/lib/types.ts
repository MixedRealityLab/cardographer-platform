// Cardographer types - see datamodel.md
// deck summary caches latest revision info and adds only owners
// i.e. RBAC for all revisions in deck

export interface CardDeckSummary {
	_id: string
	name: string
	description?: string
	credits?: string
	isPublic: boolean
	owners: string[]
	currentRevision: number // integer
}

// summary is returned for list all revisions
export interface CardDeckRevisionSummary {
	// TODO Deck size?
	_id: string
	deckId: string
	revision: number // integer 1..
	slug?: string
	deckName: string
	deckDescription?: string
	deckCredits?: string
	created: string
	lastModified: string
	revisionName?: string
	revisionDescription?: string
	isUsable: boolean
	isPublic: boolean
	isLocked: boolean
	isTemplate: boolean
	cardCount: number // summary only
	// API only
	isCurrent?: boolean
}

// full revision data
export interface CardDeckRevision extends CardDeckRevisionSummary {
	propertyDefs: CardPropertyDef[]
	defaults: CardInfo
	//boards: BoardInfo[]
	cards: CardInfo[]
	build?: DeckBuild
	output?: DeckOutput
}

export interface BoardRegion {
	id: string
	name: string
	description?: string
	x?: number
	y?: number
	width?: number
	height?: number
	analyse: boolean
	// x & y significant
}

export interface BoardInfo {
	name: string
	description?: string
	regions: BoardRegion[]
}

// card property metadata
export interface CardPropertyDef {
	use: CardPropertyUse
	customFieldName?: string
	title?: string
	description?: string
	defaultExport?: boolean
	sortBy?: number
}

export enum BoardProperty {
	Id = "id",
	Name = "name",
	Description = "description",
	X = "x",
	Y = "y",
	Width = "width",
	Height = "Height",
	Analyse = "analyse",
	Graph = "graph"
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
	Back = "back",
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
	[key: string]: string
}

// single Card or deck default
export interface CardInfo {

	// standard metadata
	id: string // NB "back:..." for a card back
	revision: number // integer
	link?: string // URL
	name?: string
	description?: string
	slug?: string
	credits?: string
	created: string // ISODate
	lastModified: string // ISODate

	// basic card properties
	width?: number // physical, mm
	height?: number // physical, mm
	sizeName?: string // e.g. "poker"

	// deck-specific properties
	sortBy?: number
	category?: string
	subtype?: string // default subtype
	attribute?: string // default attribute
	custom?: CustomFields // also custom assetFile or content
	back?: string

	// card generation
	assetFile?: string // filename?
	content?: string

	// card output
	frontUrl?: string
	backUrl?: string
	frontFile?: string
	backFile?: string
	frontTop?: number // pixels
	backTop?: number // pixels
	frontLeft?: number //pixels
	backLeft?: number //pixels
	frontWidth?: number // pixels
	backWidth?: number // pixels
	frontHeight?: number // pixels
	backHeight?: number // pixels
}

// deck build info - to be refined
export interface DeckBuild {
	//not required? files?: FileInfo[]
	builderId: string
	builderName: string
	config?: any // TBD
	lastBuilt?: string // ISODate
	status: DeckBuildStatus
	messages?: string[]
	isDisabled: boolean
}

export enum DeckBuildStatus {
	Unbuilt = "unbuilt",
	Building = "building",
	Failed = "failed",
	Built = "built"
}

// output - to be refined
export interface DeckOutput {
	isUserModified: boolean
	atlases?: AtlasInfo[]
}

// atlas info - like unity DeckInfo
export interface AtlasInfo {
	name: string
	atlasURLs: string[]
	cardX: number[]
	cardY: number[]
	cardSize: number[]
	cardCount: number
	cardInfo: string[]
	builderId?: string
}

// simple internal user account
export interface User {
	name: string
	email: string
	password: string // hashed...
	disabled: boolean
	created: string

	resetCode?: string
	resetTime?: Date
}

// session
export interface Session {
	_id: string // mongo-style
	name: string
	url?: string
	description?: string
	credits?: string
	owners: string[] // User emails
	created: string // ISO date
	lastModified: string // ISO date
	isPublic: boolean
	isTemplate: boolean
	isArchived: boolean
	sessionType: string
	board?: BoardInfo
	decks: SessionDeck[]
}

// in SessionStage, a deck to use
export interface SessionDeck {
	deckId: string // (FK,
	revision: number // FK)
	deckName: string
	deckCredits?: string
}

// snapshot
export interface SessionSnapshotSummary {
	_id: string // mongo-style
	sessionId: string // FK
	sessionName: string
	sessionDescription?: string
	sessionCredits?: string
	sessionType: string
	originallyCreated: string // ISO date
	snapshotDescription?: string
}

export interface SessionSnapshot extends SessionSnapshotSummary {
	owners: string[]
	created: string // ISO date
	sessionStage?: number
	isPublic: boolean
	isNotForAnalysis: boolean

	legacyId?: string
	data?: any
}

export interface Analysis {
	_id: string
	name: string
	description?: string
	credits?: string
	created: string // ISO date
	lastModified: string // ISO date
	owners: string[]
	isPublic: boolean
	snapshotIds: string[]
	regions: AnalysisRegion[]
}

export interface AnalysisRegion {
	name: string
	type: RegionType
	colour: string
}

export enum RegionType {
	SubRegions = "SubRegions",
	Category = "Category",
	XAxis = "XAxis",
	YAxis = "YAxis",
	SingleColour = "SingleColour",
	Ignore = "Ignore"
}

//EOF
