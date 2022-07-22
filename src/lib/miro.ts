interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface Offset {
    top: number;
    left: number;
    bottom: number;
    right: number;
}
type Json = string | number | boolean | null | Json[] | {
    [key: string]: Json;
};
declare enum TagColor {
    Red = 'red',
    Magenta = 'magenta',
    Violet = 'violet',
    LightGreen = 'light_green',
    Green = 'green',
    DarkGreen = 'dark_green',
    Cyan = 'cyan',
    Blue = 'blue',
    DarkBlue = 'dark_blue',
    Yellow = 'yellow',
    Gray = 'gray',
    Black = 'black'
}
declare enum StickyNoteColor {
    Gray = 'gray',
    LightYellow = 'light_yellow',
    Yellow = 'yellow',
    Orange = 'orange',
    LightGreen = 'light_green',
    Green = 'green',
    DarkGreen = 'dark_green',
    Cyan = 'cyan',
    LightPink = 'light_pink',
    Pink = 'pink',
    Violet = 'violet',
    Red = 'red',
    LightBlue = 'light_blue',
    Blue = 'blue',
    DarkBlue = 'dark_blue',
    Black = 'black'
}
declare enum ShapeType {
    Rectangle = 'rectangle',
    Circle = 'circle',
    Triangle = 'triangle',
    WedgeRoundRectangleCallout = 'wedge_round_rectangle_callout',
    RoundRectangle = 'round_rectangle',
    Rhombus = 'rhombus',
    Parallelogram = 'parallelogram',
    Star = 'star',
    RightArrow = 'right_arrow',
    LeftArrow = 'left_arrow',
    Pentagon = 'pentagon',
    Hexagon = 'hexagon',
    Octagon = 'octagon',
    Trapezoid = 'trapezoid',
    FlowChartPredefinedProcess = 'flow_chart_predefined_process',
    LeftRightArrow = 'left_right_arrow',
    Cloud = 'cloud',
    LeftBrace = 'left_brace',
    RightBrace = 'right_brace',
    Cross = 'cross',
    Can = 'can'
}
export type FontFamily = 'arial' | 'cursive' | 'abril_fatface' | 'bangers' | 'eb_garamond' | 'georgia' | 'graduate' | 'gravitas_one' | 'fredoka_one' | 'nixie_one' | 'open_sans' | 'permanent_marker' | 'pt_sans' | 'pt_sans_narrow' | 'pt_serif' | 'rammetto_one' | 'roboto' | 'roboto_condensed' | 'roboto_slab' | 'caveat' | 'times_new_roman' | 'titan_one' | 'lemon_tuesday' | 'roboto_mono' | 'noto_sans' | 'plex_sans' | 'plex_serif' | 'plex_mono' | 'spoof' | 'tiempos_text' | 'noto_serif' | 'noto_serif_jp' | 'noto_sans_jp' | 'noto_sans_hebrew' | 'noto_serif_sc' | 'noto_serif_kr' | 'noto_sans_sc' | 'noto_sans_kr' | 'serif' | 'sans_serif' | 'monospace';
type IconShape = 'round' | 'square';
type StickyNoteShape = 'square' | 'rectangle';
export type TextAlign = 'left' | 'center' | 'right';
export type TextAlignVertical = 'top' | 'middle' | 'bottom';
export type Origin = 'center';
export type AppCardStatus = 'disabled' | 'disconnected' | 'connected';
export type ConnectorShape = 'straight' | 'elbowed' | 'curved';
export type StrokeCapShape = 'none' | 'stealth' | 'arrow' | 'filled_triangle' | 'triangle' | 'filled_diamond' | 'diamond' | 'filled_oval' | 'oval' | 'erd_one' | 'erd_many' | 'erd_one_or_many' | 'erd_only_one' | 'erd_zero_or_many' | 'erd_zero_or_one';
export type StrokeStyle = 'normal' | 'dotted' | 'dashed';
interface BaseMixin {
    readonly id: string;
    sync(): Promise<void>;
}
export interface PositionMixin {
    x: number;
    y: number;
}
export interface SizeMixin {
    width: number;
    height: number;
}
interface RotationMixin {
    rotation: number;
}
interface ContainerMixin {
    childrenIds: string[];
    add<T extends Item>(item: T): Promise<T>;
    remove<T extends Item>(item: T): Promise<void>;
    getChildren(): Promise<Item[]>;
}
interface ModifiableMixin {
    readonly createdAt: string;
    readonly createdBy: string;
    readonly modifiedAt: string;
    readonly modifiedBy: string;
}
interface WidgetMixin extends BaseMixin, PositionMixin, ModifiableMixin {
    readonly parentId: string | null;
    readonly type: ItemType;
    origin: Origin;
    sync(): Promise<void>;
}
interface EntityMixin extends BaseMixin {
    readonly type: EntityType;
    sync(): Promise<void>;
}
export type ItemType = 
'text'
 | 'sticky_note'
 | 'shape'
 | 'image'
 | 'frame'
 | 'preview'
 | 'card'
 | 'app_card'
 | 'connector'
 | 'usm'
 | 'mindmap'
 | 'kanban'
 | 'document'
 | 'mockup'
 | 'curve'
 | 'webscreen'
 | 'table'
 | 'svg'
 | 'emoji'
 | 'embed'
 | 'connector'
 | 'unsupported'
 | 'table_text'
 | 'rallycard'
 | 'stencil';
interface Base extends WidgetMixin {
}
export type WidgetPropsOnly<T> = Omit<T, 'sync' | 'add' | 'remove' | 'getChildren'>;
interface Card extends WidgetMixin, Omit<SizeMixin, 'height'>, Readonly<Pick<SizeMixin, 'height'>>, RotationMixin {
    readonly type: 'card';
    title: string;
    description: string;
    dueDate?: string;
    assignee?: {
        userId: string;
    };
    style: {
        cardTheme?: string;
    };
    tagIds: string[];
}
type CardProps = {
    height?: number;
    width?: number;
    readonly type?: 'card';
    title?: string;
    description?: string;
    dueDate?: string;
    assignee?: {
        userId?: string;
    };
    style?: {
        cardTheme?: string;
    };
    tagIds?: string[];
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    rotation?: number;
};
interface CardField {
    value?: string;
    fillColor?: string;
    textColor?: string;
    iconUrl?: string;
    iconShape?: IconShape;
    tooltip?: string;
}
interface AppCard extends Omit<Card, 'type' | 'dueDate' | 'assignee'> {
    readonly type: 'app_card';
    readonly owned: boolean;
    status: AppCardStatus;
    fields?: CardField[];
}
type AppCardProps = {
    height?: number;
    width?: number;
    readonly type?: 'app_card';
    title?: string;
    description?: string;
    style?: {
        cardTheme?: string;
    };
    tagIds?: string[];
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    rotation?: number;
    readonly owned?: boolean;
    status?: AppCardStatus;
    fields?: CardField[];
};
interface Frame extends WidgetMixin, SizeMixin, ContainerMixin {
    readonly type: 'frame';
    title: string;
    style: {
        fillColor: string;
    };
}
type FrameProps = {
    height?: number;
    width?: number;
    readonly type?: 'frame';
    title?: string;
    style?: {
        fillColor?: string;
    };
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    childrenIds?: string[];
};
interface Image extends WidgetMixin, SizeMixin, RotationMixin {
    readonly type: 'image';
    title: string;
    readonly url: string;
}
type ImageProps = {
    height?: number;
    width?: number;
    readonly type?: 'image';
    title?: string;
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    rotation?: number;
    readonly url?: string;
} & {
    url: string;
};
interface Connector extends Omit<WidgetMixin, 'x' | 'y'> {
    readonly type: 'connector';
    shape: ConnectorShape;
    start?: {
        item: string;
        position?: {
            x: number;
            y: number;
        };
    };
    end?: {
        item: string;
        position?: {
            x: number;
            y: number;
        };
    };
    style: {
        startStrokeCap?: StrokeCapShape;
        endStrokeCap?: StrokeCapShape;
        strokeStyle?: StrokeStyle;
        strokeWidth?: number;
        strokeColor?: string;
    };
}
type ConnectorProps = {
    readonly type?: 'connector';
    style?: {
        startStrokeCap?: StrokeCapShape;
        endStrokeCap?: StrokeCapShape;
        strokeStyle?: StrokeStyle;
        strokeWidth?: number;
        strokeColor?: string;
    };
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    shape?: ConnectorShape;
    start?: {
        item?: string;
        position?: {
            x?: number;
            y?: number;
        };
    };
    end?: {
        item?: string;
        position?: {
            x?: number;
            y?: number;
        };
    };
};
export type UnsupportedType = 'curve' | 'document' | 'emoji' | 'table' | 'kanban' | 'mockup' | 'svg' | 'usm' | 'mindmap' | 'webscreen' | 'stencil' | 'unsupported'; // Default case
interface Unsupported extends WidgetMixin {
    readonly type: UnsupportedType;
}
type UnsupportedProps = {
    readonly type?: UnsupportedType;
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
};
interface Preview extends WidgetMixin, SizeMixin {
    readonly type: 'preview';
    readonly url: string;
}
type PreviewProps = {
    height?: number;
    width?: number;
    readonly type?: 'preview';
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    readonly url?: string;
};
interface Shape extends WidgetMixin, Readonly<SizeMixin>, RotationMixin {
    readonly type: 'shape';
    content: string;
    shape: ShapeType | `${ShapeType}`;
    style: {
        fillColor: string;
        fontFamily: FontFamily;
        fontSize: number;
        textAlign: TextAlign;
        textAlignVertical: TextAlignVertical;
    };
}
type ShapeProps = {
    height?: number;
    width?: number;
    readonly type?: 'shape';
    style?: {
        fillColor?: string;
        fontFamily?: FontFamily;
        fontSize?: number;
        textAlign?: TextAlign;
        textAlignVertical?: TextAlignVertical;
    };
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    rotation?: number;
    shape?: ShapeType | `${ShapeType}`;
    content?: string;
};
interface StickyNote extends WidgetMixin, SizeMixin {
    readonly type: 'sticky_note';
    shape: StickyNoteShape;
    content: string;
    style: {
        fillColor: StickyNoteColor | `${StickyNoteColor}`;
        textAlign: TextAlign;
        textAlignVertical: TextAlignVertical;
    };
    tagIds: string[];
}
type StickyNoteProps = {
    height?: number;
    width?: number;
    readonly type?: 'sticky_note';
    style?: {
        fillColor?: StickyNoteColor | `${StickyNoteColor}`;
        textAlign?: TextAlign;
        textAlignVertical?: TextAlignVertical;
    };
    tagIds?: string[];
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    shape?: StickyNoteShape;
    content?: string;
};
interface Embed extends WidgetMixin, Readonly<SizeMixin> {
    readonly type: 'embed';
    x: number;
    y: number;
    readonly width: number;
    readonly height: number;
    readonly url: string;
    previewUrl: string;
    mode: 'inline' | 'modal';
}
type EmbedProps = {
    readonly height?: number;
    readonly width?: number;
    readonly type?: 'embed';
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    readonly url?: string;
    previewUrl?: string;
    mode?: 'inline' | 'modal';
} & {
    url: string;
};
interface Text extends WidgetMixin, Omit<SizeMixin, 'height'>, Readonly<Pick<SizeMixin, 'height'>>, RotationMixin {
    readonly type: 'text';
    content: string;
    style: {
        fillColor: string;
        fillOpacity: number;
        fontFamily: FontFamily;
        fontSize: number;
        textAlign: TextAlign;
    };
}
type TextProps = {
    height?: number;
    width?: number;
    readonly type?: 'text';
    style?: {
        fillColor?: string;
        fillOpacity?: number;
        fontFamily?: FontFamily;
        fontSize?: number;
        textAlign?: TextAlign;
    };
    readonly parentId?: string | null;
    origin?: Origin;
    readonly id?: string;
    x?: number;
    y?: number;
    readonly createdAt?: string;
    readonly createdBy?: string;
    readonly modifiedAt?: string;
    readonly modifiedBy?: string;
    rotation?: number;
    content?: string;
};
export type Item = Card | AppCard | Frame | Image | Unsupported | Preview | Shape | StickyNote | Text | Embed | Connector;
export type EntityType = 'tag';
interface Tag extends EntityMixin {
    readonly type: 'tag';
    title: string;
    color: TagColor | `${TagColor}`;
}
export type TagProps = {
    readonly type?: 'tag';
    title?: string;
    readonly id?: string;
    color?: TagColor | `${TagColor}`;
};
export type Entity = Tag;
type DropEvent = {
    x: number;
    y: number;
    target: HTMLElement;
};
type AppCardOpenEvent = {
    appCard: AppCard;
};
type AppCardConnectEvent = {
    appCard: AppCard;
};
type SelectionUpdateEvent = {
    items: Item[];
};
type AppEventType = 'icon:click' | 'app_card:open' | 'app_card:connect' | 'selection:update';
type EventType = 'drop' | AppEventType;
interface BoardUI {
    openPanel(options: {
        url: string;
        height?: number;
    }): Promise<void>;
    closePanel(): Promise<void>;
    openModal(options: {
        url: string;
        height?: number;
        width?: number;
        fullscreen?: boolean;
    }): Promise<void>;
    closeModal(): Promise<void>;
    on(event: 'drop', handler: (event: DropEvent) => void): void;
    on(event: 'icon:click', handler: () => void): void;
    on(event: 'app_card:open', handler: (event: AppCardOpenEvent) => void): void;
    on(event: 'app_card:connect', handler: (event: AppCardConnectEvent) => void): void;
    on(event: 'selection:update', handler: (event: SelectionUpdateEvent) => void): void;
    on(event: EventType, handler: (event: DropEvent) => void): void;
    off(event: 'drop', handler: (event: DropEvent) => void): void;
    off(event: 'icon:click', handler: () => void): void;
    off(event: 'app_card:open', handler: (event: AppCardOpenEvent) => void): void;
    off(event: 'app_card:connect', handler: (event: AppCardConnectEvent) => void): void;
    off(event: 'selection:update', handler: (event: SelectionUpdateEvent) => void): void;
    off(event: EventType, handler: (event: DropEvent) => void): void;
}
interface BoardViewport {
    get(): Promise<Rect>;
    set(options: {
        viewport: Rect;
        padding?: Offset;
        animationDurationInMs?: number;
    }): Promise<Rect>;
    zoomTo(items: BoardWidgets): Promise<void>;
}
export type BoardNode = Item | Tag;
type BoardNodes = BoardNode[];
type BoardInput = BoardNode | BoardNodes;
type BoardWidgets = Item | Item[];
export type BoardInfo = {
    readonly id: string;
    readonly createdAt: string;
    readonly updatedAt: string;
};
type GetFilter = {
    id: string[] | string;
} | {
    type?: string[] | string;
    tags?: string[] | string;
};
type AppDataValue = Exclude<Json, null>;
type AppData = Record<string, AppDataValue>;
type UserInfo = {
    id: string;
};
export interface Board {
    readonly ui: BoardUI;
    readonly viewport: BoardViewport;
    createCard(props?: CardProps): Promise<Card>;
    createAppCard(props?: AppCardProps): Promise<AppCard>;
    createFrame(props?: FrameProps): Promise<Frame>;
    createImage(props: ImageProps): Promise<Image>;
    createPreview(props: PreviewProps): Promise<Preview>;
    createShape(props?: ShapeProps): Promise<Shape>;
    createStickyNote(props?: StickyNoteProps): Promise<StickyNote>;
    createText(props?: TextProps): Promise<Text>;
    createEmbed(props: EmbedProps): Promise<Embed>;
    createConnector(props: ConnectorProps): Promise<Connector>;
    createTag(props?: TagProps): Promise<Tag>;
    sync(item: BaseMixin): Promise<void>;
    remove(input: BoardNode): Promise<void>;
    bringToFront(input: Item): Promise<void>;
    sendToBack(input: Item): Promise<void>;
    getById(id: string): Promise<BoardNode>;
    get(filter: GetFilter & {
        type: 'card';
    }): Promise<Card[]>;
    get(filter: GetFilter & {
        type: 'frame';
    }): Promise<Frame[]>;
    get(filter: GetFilter & {
        type: 'image';
    }): Promise<Image[]>;
    get(filter: GetFilter & {
        type: 'preview';
    }): Promise<Preview[]>;
    get(filter: GetFilter & {
        type: 'shape';
    }): Promise<Shape[]>;
    get(filter: GetFilter & {
        type: 'sticky_note';
    }): Promise<StickyNote[]>;
    get(filter: GetFilter & {
        type: 'text';
    }): Promise<Text[]>;
    get(filter: GetFilter & {
        type: 'embed';
    }): Promise<Embed[]>;
    get(filter: GetFilter & {
        type: 'tag';
    }): Promise<Tag[]>;
    get(filter?: GetFilter): Promise<BoardNode[]>;
    getInfo(): Promise<BoardInfo>;
    getUserInfo(): Promise<UserInfo>;
    getSelection(): Promise<Item[]>;
    getAppData<T extends AppData>(): Promise<T>;
    getAppData<T extends AppDataValue>(key: string): Promise<T>;
    getAppData<T extends AppData | AppDataValue>(key?: string): Promise<T>;
    setAppData<T extends AppData>(key: string, value: AppDataValue): Promise<T>;
    getIdToken(): Promise<string>;
}
export interface Miro {
    readonly board: Board;
    readonly clientVersion: string;
}
