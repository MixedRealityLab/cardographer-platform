import {getDb} from "$lib/db"
import type {User} from "$lib/types"
import type {RequestHandler} from "@sveltejs/kit"
import {hashPassword} from "../login";

export const post: RequestHandler = async function ({request}) {
	const {code, password} = await request.json();
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
		return {status: 404}
	}

	user.password = await hashPassword(password)
	delete user.resetCode
	delete user.resetTime

	await db.collection<User>('Users').replaceOne({_id: user._id}, user)

	return {status: 200}
}