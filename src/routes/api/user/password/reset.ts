import {getDb} from "$lib/db";
import type {User} from "$lib/types";
import type {RequestHandler} from "@sveltejs/kit";
import {customAlphabet} from "nanoid";

export const post: RequestHandler = async function ({params, request}) {
	const {code,password} = await request.json();
	// check password
	const db = await getDb();
	const timeoutDate = new Date()
	timeoutDate.setHours(timeoutDate.getHours() - 2);
	const user = await db.collection<User>('Users').updateOne({
		resetCode: code,
		$lt: {
			resetTime: timeoutDate.getTime()
		}
	})
	if (!user) {
		if (debug) console.log(`password reset user not found: ${login.email}`);
		return {status: 200}
	}

	const nanoid = customAlphabet('useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict', 16)
	user.resetCode = nanoid()
	user.resetTime = new Date().getDate()

	await db.collection<User>('Users').updateOne({_id: user._id}, user)

	return {status: 200}
}