import type {Actions} from "@sveltejs/kit";
import { getCookieName } from "$lib/security";

export const actions: Actions = {
	default: async ({cookies}) => {
		cookies.set(getCookieName(), "", {
			path: '/',
			httpOnly: true,
			sameSite: 'none',
			secure: true
		})
		return ""
	}
}