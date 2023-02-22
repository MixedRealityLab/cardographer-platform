import {makeTokenCookie} from "$lib/security";
import type {Actions} from "@sveltejs/kit";

export const actions: Actions = {
	default: async ({setHeaders}) => {
		setHeaders({"set-cookie": makeTokenCookie("")})
		return ""
	}
}