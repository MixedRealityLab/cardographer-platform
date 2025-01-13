import striptags1 from "striptags" ;

export function striptags(text:string): string {
	text = striptags1(text.replace(/<br/g,' <br'))
	text = text.replace(/&#64;/g, '@')
	return text
}
