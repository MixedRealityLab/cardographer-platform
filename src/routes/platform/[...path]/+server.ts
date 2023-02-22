import {base} from "$app/paths";
import type {RequestHandler} from "@sveltejs/kit";
import {redirect} from "@sveltejs/kit";

export const GET: RequestHandler = async function ({params}) {
	throw redirect(302, base + '/' + params.path)
}