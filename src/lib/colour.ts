export interface Colour {
	r: number,
	g: number,
	b: number
}

const magma: Colour[] = [{r: 252, g: 253, b: 191}, {r: 183, g: 55, b: 121}, {r: 0, g: 0, b: 4}]
const viridis: Colour[] = [{r: 253, g: 231, b: 37}, {r: 33, g: 145, b: 140}, {r: 68, g: 1, b: 84}]
const plasma: Colour[] = [{r: 240, g: 249, b: 33}, {r: 204, g: 71, b: 120}, {r: 13, g: 8, b: 135}]

export function redGreen(mix: number): Colour {
	return {
		r: 255 * (1 - mix),
		g: 255 * mix,
		b: 0,
	}
}

export function blendColour(mix: number, colourSpace: Colour[]): Colour {
	let rightMix = mix * 2
	let leftColour = colourSpace[0]
	let rightColour = colourSpace[1]
	if (mix > 0.5) {
		rightMix = (mix * 2) - 1
		leftColour = colourSpace[1]
		rightColour = colourSpace[2]
	}
	const leftMix = 1 - rightMix
	console.log(mix, leftMix, rightMix)
	return {
		r: leftColour.r * leftMix + rightColour.r * rightMix,
		g: leftColour.g * leftMix + rightColour.g * rightMix,
		b: leftColour.b * leftMix + rightColour.b * rightMix,
	}
}

export function magmaColour(mix: number): Colour {
	return blendColour(mix, magma)
}

export function viridisColour(mix: number): Colour {
	return blendColour(mix, viridis)
}

export function plasmaColour(mix: number): Colour {
	return blendColour(mix, plasma)
}

function componentToHex(c: number): string {
	const hex = Math.round(c).toString(16)
	return hex.length == 1 ? "0" + hex : hex;
}

export function hexValue(colour: Colour): string {
	return "#" + componentToHex(colour.r) + componentToHex(colour.g) + componentToHex(colour.b);
}