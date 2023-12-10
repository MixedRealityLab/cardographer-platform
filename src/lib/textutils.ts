import striptags1 from "striptags" ;

export function striptags(text:string): string {
	return striptags1(text.replace(/<br/g,' <br'))
}
