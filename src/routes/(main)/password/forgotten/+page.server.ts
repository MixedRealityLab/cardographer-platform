import type {Actions} from "@sveltejs/kit"
import {sendPasswordResetEmail} from "$lib/userutils"

export const actions: Actions = {
	default: async ({request, url}) => {
		const data = await request.formData();
		let email = data.get('email') as string;
		return await sendPasswordResetEmail(email, url)
	}
}