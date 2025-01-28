import {getDb} from "$lib/db"
import {verifyAuthentication} from "$lib/security"
import type {User} from "$lib/types"
import {getUserIsAdmin, GUEST_EMAIL} from "$lib/userutils"
import type {PageServerLoad} from "./$types"

export const load: PageServerLoad = async function ({locals}) {
	await verifyAuthentication(locals, true, true)
	if (locals.email == GUEST_EMAIL) {
		return {
			users: []
		}
	}
	const db = await getDb();
	const user = await db.collection<User>('Users')
		.findOne({email: locals.email})
	const isAdmin = await getUserIsAdmin(user)
	let filter = isAdmin ? {} : {email: user.email}
	let users = await db.collection<User>('Users')
		.find(filter, {
			projection: {
				email: true, name: true, created: true, disabled: true,
				isAdmin: true, isPublisher: true, isDeckBuilder: true,
				isVerified: true,
			}
		})
		.toArray()
	users.forEach((u) => delete u._id)
	users.sort((a, b) => (a.email).toLowerCase().localeCompare((b.email).toLowerCase()))
	return {
		users: users
	}
}