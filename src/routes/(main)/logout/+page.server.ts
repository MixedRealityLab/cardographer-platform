import type {Actions} from "@sveltejs/kit";
import { getCookieName } from "$lib/security";
import {base} from "$app/paths";
import {redirect} from "@sveltejs/kit";

export const actions: Actions = {
	default: async ({cookies}) => {
		cookies.set(getCookieName(), "", {
			path: '/',
			httpOnly: true,
			sameSite: 'none',
			secure: true
		})
		throw redirect(302, base + "/")
	}
}