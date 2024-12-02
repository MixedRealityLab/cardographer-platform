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

		const hash = await hashPassword(password)

		await db.collection<User>('Users').updateOne(
			{_id: user._id}, {
			$set: {
				isVerified: true,
				password: hash
			},
			$unset: {
				"resetCode" :"", 
				"resetTime": ""
			},
		})
		console.log(`Reset password for ${user.email}`)
		return {success: true}
	}
}