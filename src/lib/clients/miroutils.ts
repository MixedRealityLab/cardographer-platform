import type {BoardInfo, CardSnapshot, CommonInfo, CommentInfo, SnapshotInfo} from '$lib/analysistypes'
import {striptags} from "$lib/textutils";

const debug = false

const stickerTypes = ['sticker', 'sticky_note', 'square']

export function getSnapshotInfoFromMiroData(data): SnapshotInfo {
    const boards: BoardInfo[] = [];
// frame is a board
    // card is an image
    // shape is a zone
    for (const widget of data.widgets) {
        boundify(widget, data.widgets)
    }
    boards.push({
        id: '(no board)',
        cards: [],
        zones: [],
        comments: [],
    })
    for (const frame of data.widgets) {
        if (frame.type.toLowerCase() != 'frame') {
            continue;
        }
        let boardId = frame.title
        let board = boards.find((b) => b.id == boardId);
        if (!board) {
            if (debug) console.log(`add board ${boardId}`);
            board = {
                id: boardId,
                cards: [],
                zones: [],
                comments: [],
                nativeId: frame.id,
            }
            boards.push(board)
        }
    }
    for (const shape of data.widgets) {
        if (shape.type.toLowerCase() != 'shape') {
            continue;
        }
        let zoneId = shape.plainText
        if (!zoneId && shape.content) {
            zoneId = striptags(shape.content);
        }
        if (!zoneId) {
            if (debug) console.log(`ignore unnamed shape`, shape);
            continue;
        }
        const ci: CardSnapshot = {id:'Shape '+zoneId, zones: []};
        const {boardId} = findBoardId(shape, ci, data.widgets)
        let board = boards.find((b) => b.id == boardId);
        const zoneInfo = board.zones.find((z) => z.id == zoneId)
        if (!zoneInfo) {
            if (debug) console.log(`add zone ${zoneId}`);
            board.zones.push({
                id: zoneId,
                nativeId: shape.id,
            })
        }
    }
    for (const widget of data.widgets) {
        if (widget.type.toLowerCase() != 'image') {
            continue;
        }
        let id = widget.title || widget.url;
        if (!id) {
            if (debug) console.log(`ignore unnamed image`, widget);
            continue;
        }
        // URL or file path?
        const six = id.lastIndexOf('/');
        if (six >= 0) {
            id = id.substring(six + 1);
        }
        // extension?
        const dix = id.lastIndexOf('.');
        if (dix >= 0) {
            id = id.substring(0, dix);
        }

        const ci: CardSnapshot = {id, nativeId: widget.id, zones: []};
        const {boardId,frames} = findBoardId(widget, ci, data.widgets)
        let board = boards.find((b) => b.id == boardId);

        ci.comments = data.widgets.filter((w) => stickerTypes.includes(w.type.toLowerCase()) && (w.text || w.content) && cardOverlapping(widget, w)).map((w) => w.text || striptags(w.content))
        board.cards.push(ci);
        assignZones(widget, ci, data.widgets, frames)
        if (debug) console.log(`card ${id} in ${ci.zones.length} zones: ${JSON.stringify(ci.zones)}`);
    }
    for (const widget of data.widgets) {
        if (!stickerTypes.includes(widget.type.toLowerCase())) {
            continue;
        }
        const text = widget.text || striptags(widget.content);
        if (!text) {
            if (debug) console.log(`ignore empty comment`, widget);
            continue;
        }
        const ci: CommentInfo = {text, nativeId: widget.id, zones: []};
        const {boardId,frames} = findBoardId(widget, ci, data.widgets)
        let board = boards.find((b) => b.id == boardId);
        board.comments.push(ci);
        assignZones(widget, ci, data.widgets, frames)
        if (debug) console.log(`comment ${text} in ${ci.zones.length} zones: ${JSON.stringify(ci.zones)}`);
    }
    if (debug) console.log(JSON.stringify(boards))
    return {boards}
}



function findBoardId(widget, ci:CommonInfo, widgets): {boardId:string,frames} {
	let frames = widgets.filter((w) => w.type.toLowerCase() == 'frame' && w.title && w.childrenIds.includes(widget.id))
	if (frames.length == 0) {
		frames = widgets.filter((w) => w.type.toLowerCase() == 'frame' && w.title && cardOverlapping(widget, w));
	}
	let boardId = '';
	if (frames.length == 0) {
		if (debug) console.log(`no board for image ${ci.id} ${widget.id}`);
	} else {
		if (frames.length > 1) {
			if (debug) console.log(`${frames.length} possible boards for image ${ci.id} ${widget.id}: ${JSON.stringify(frames.map((frame) => frame.title))}`);
		}
		let size = Infinity
		for (const frame of frames) {
			let widgetSize = 0
			widgetSize = frame.bounds.width * frame.bounds.height

			if (size < widgetSize || !boardId) {
				size = widgetSize
				boardId = frame.title
				ci.x = (widget.bounds.left - frame.bounds.left) / (frame.bounds.width - widget.bounds.width)
				ci.y = (widget.bounds.top - frame.bounds.top) / (frame.bounds.height - widget.bounds.height)
			}
		}
	}
	if (boardId == '') {
		boardId = '(no board)'
	}
	return {boardId,frames}
}

function assignZones(widget, ci:CommonInfo, widgets, frames) {
	const shapes = widgets.filter((w) => w.type.toLowerCase() == 'shape' && cardOverlapping(widget, w));
	for (const shape of shapes) {
		if (shape.plainText) {
			ci.zones.push({zoneId: shape.plainText, overlap: cardOverlap(widget, shape)});
		} else if (shape.content) {
			ci.zones.push({zoneId: striptags(shape.content), overlap: cardOverlap(widget, shape)});
		}
	}
	if (ci.zones.length == 0) {
		if (frames.length > 0) {
			for (const frame of frames) {
				ci.zones.push({zoneId: frame.title, overlap: cardOverlap(widget, frame)});
			}
		} else {
			ci.zones.push({zoneId: '(no board)', overlap: 1})
		}
	}
}

function cardInBounds(c, w) {
	return c.bounds.left >= w.bounds.left && c.bounds.right <= w.bounds.right &&
		c.bounds.bottom <= w.bounds.bottom && c.bounds.top >= w.bounds.top;
}

function boundify(w, widgets) {
	// ignore groups for now
	if (w.type.toLowerCase() == 'group') {
		return
	}
	if (!w.bounds) {
		let x = w.x
		let y = w.y
		let node = w
		for (let node = w; node.parentId !== null && node.parentId !== undefined; ) {
			let parent = widgets.find((w) => w.id == node.parentId)
			if (!parent) {
				console.log(`ERROR: miro parent not found: ${node.parentId}`)
				break
			}
			if (node.relativeTo == "parent_top_left") {
				x = x + parent.x - (parent.width / 2)
				y = y + parent.y - (parent.height / 2)
			} else {
				console.log(`ERROR: unhandled miro relativeTo: ${node.relativeTo}`)
				break
			}
			node = parent
		}
		if (w.origin != 'center') {
			console.log(`ERROR: unhandled miro origin: ${w.origin}`, w)
		}
		w.bounds = {
			left: x - (w.width / 2),
			right: x + (w.width / 2),
			top: y - (w.height / 2),
			bottom:  y + (w.height / 2),
			width: w.width,
			height: w.height
		}
	}
}

function cardOverlapping(c, w) {
	return c.bounds.left <= w.bounds.right && c.bounds.right >= w.bounds.left && c.bounds.top <= w.bounds.bottom && c.bounds.bottom >= w.bounds.top;
}
function cardOverlap(c, w): number {
	const overlapL = c.bounds.right <= w.bounds.left ? 0 : c.bounds.left >= w.bounds.left ? 1 : (c.bounds.right-w.bounds.left)/c.bounds.width;
	const overlapR = c.bounds.left >= w.bounds.right ? 0 : c.bounds.right <= w.bounds.right ? 1 : (w.bounds.right-c.bounds.left)/c.bounds.width;
	const overlapT = c.bounds.bottom <= w.bounds.top ? 0 : c.bounds.top >= w.bounds.top ? 1 : (c.bounds.bottom-w.bounds.top)/c.bounds.height;
	const overlapB = c.bounds.top >= w.bounds.bottom ? 0 : c.bounds.bottom <= w.bounds.bottom ? 1 : (w.bounds.bottom-c.bounds.top)/c.bounds.height;
	return overlapL*overlapR*overlapT*overlapB;
}