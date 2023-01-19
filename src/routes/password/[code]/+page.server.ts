import {getDb} from "$lib/db"
import {hashPassword} from "$lib/security"
import type {User} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {fail} from "@sveltejs/kit"


export const actions: Actions = {
	default: async ({request, params}) => {
		const {code} = params
		const data = await request.formData();
		let password = data.get('password') as string;
		if (!password) {
			return fail(400)
		}
		// check password
		const db = await getDb();
		const timeoutDate = new Date()
		timeoutDate.setHours(timeoutDate.getHours() - 2);
		const user = await db.collection<User>('Users').findOne({
			resetCode: code,
			disabled: false,
			resetTime: {
				$gt: timeoutDate
			}
		})

		if (!user) {
			return fail(404)
		}

		user.password = await hashPassword(password)
		delete user.resetCode
		delete user.resetTime

		await db.collection<User>('Users').replaceOne({_id: user._id}, user)

		return {success: true}
	}
}