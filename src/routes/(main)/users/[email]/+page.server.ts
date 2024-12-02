import {getDb} from "$lib/db"
import {getUser} from "$lib/userutils";
import {verifyAuthentication} from "$lib/security";
import type {User} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {error} from "@sveltejs/kit"
import { getUserIsAdmin } from "../../../../lib/userutils";

export const actions: Actions = {
	default: async ({locals, request, params}) => {
		verifyAuthentication(locals)
		const {email} = params
		const db = await getDb()
		let localUser = await db.collection<User>('Users')
			.findOne({email:locals.email})
		const isAdmin = getUserIsAdmin(localUser)
		let user = await db.collection<User>('Users')
			.findOne({email:email})
    	if (!user) {
        	throw error(404, `User ${email} not found`);
    	}
		if (email != locals.email && !isAdmin) {
			throw error(401, `User Write Access Not Permitted`);
		}
		const data = await request.formData();
		if (!isAdmin) {
			// can only change name :-)
			const updateResult = await db.collection<User>('Users').updateOne({
				email: email
			}, {
				$set: {
					name: data.get('name') as string || user.name,
				}
			})
		} else {
			// admin updates...
			const updateResult = await db.collection<User>('Users').updateOne({
				email: email
			}, {
				// note, cannot disable or un-admin yourself, just in case :-)
				$set: {
					name: data.get('name') as string || user.name,
					disabled: email!=locals.email && data.get('isDisabled') == 'on',
					isDeckBuilder: data.get('isDeckBuilder') == 'on',
					isPublisher: data.get('isPublisher') == 'on',
					isAdmin: (email==locals.email && user.isAdmin) || data.get('isAdmin') == 'on',
				}
			})
		}
		return {success: true}
	}
}