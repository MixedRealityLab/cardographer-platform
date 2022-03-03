import type {LoginRequest} from '../../../../lib/apitypes';
import {getDb} from '../../../../lib/db';
import type {User} from "../../../../lib/types";
import type {RequestHandler} from '@sveltejs/kit';
import {customAlphabet} from 'nanoid'

const debug = true;



export const post: RequestHandler = async function ({request}) {
	const login = await request.json() as LoginRequest;
	if (!login.email) {
		return {
			status: 400
		}
	}
	// check password
	const db = await getDb();
	const user = await db.collection<User>('Users').findOne({email: login.email})
	if (!user) {
		if (debug) console.log(`password reset user not found: ${login.email}`);
		return {status: 200}
	}

	const nanoid = customAlphabet('useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict', 16)
	user.resetCode = nanoid()
	user.resetTime = new Date().getDate()

	// TODO Email!

	await db.collection<User>('Users').updateOne({_id: user._id}, user)

	return {status: 200}
}
