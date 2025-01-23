import {getDb} from "./db";
import type {User} from "./types";
import type {Db} from 'mongodb';
import {error, fail} from "@sveltejs/kit";
import {base} from "$app/paths"
import {createTransport} from "nodemailer"
import {customAlphabet} from "nanoid"

const adminUsers = (process.env["ADMIN_USERS"] ?? "").split(", ;")

export const GUEST_EMAIL = "guest"

//const debug = false;
const emailConfigured = 'SMTP_host' in process.env
const transport = createTransport({
	host: process.env["SMTP_host"],
	port: parseInt(process.env["SMTP_port"]),
	secure: !!process.env["SMTP_secure"],
	auth: {
		user: process.env["SMTP_user"],
		pass: process.env["SMTP_pass"]
	}
});
if (emailConfigured) {
	console.log(`Email config: ${process.env["SMTP_host"]}:${process.env["SMTP_port"]} ${!!process.env["SMTP_secure"] ? '(secure)' : ''} user ${process.env["SMTP_user"]}`)
}

export async function getUserIsAdmin(user: User): Promise<boolean> {
	if (user.isAdmin && !user.disabled) {
		return true
	}
	if (adminUsers.indexOf(user.email) >= 0) {
		console.log(`User ${user.email} promoted to default admin / enabled`)
		user.isAdmin = true
		user.disabled = false
		const db = await getDb();
		await db.collection<User>('Users').updateOne({email: user.email}, {
			$set: {
				isAdmin: true,
				disabled: false,
			}
		})
		return true
	}
	return false
}

function getGuestUser(): User {
	return {
		name: "Guest",
		email: GUEST_EMAIL,
		isGuest: true,
		password: "foo",
		disabled: false,
		created: "2024-12-03T11:34:00Z",
	}
}

export async function getUser(db: Db, email: string, authEmail: string): Promise<User> {
	if (email == GUEST_EMAIL) {
		return getGuestUser()
	}
	let user = await db.collection<User>('Users')
		.findOne({email: email}, {
			projection: {
				email: true, name: true, created: true, disabled: true,
				isAdmin: true, isPublisher: true, isDeckBuilder: true,
				isVerified: true,
			}
		})
	if (!user) {
		throw error(404, `User ${email} not found`);
	}
	//if (email != authEmail) {
	const authUser = email != authEmail
		? await db.collection<User>('Users').findOne({email: authEmail})
		: user
	const isAdmin = await getUserIsAdmin(authUser)
	if (email != authEmail && !isAdmin) {
		throw error(404, `User ${email} not found`);
	}
	delete user._id
	user.localIsAdmin = isAdmin
	return user
}

const RESET_WAIT_MINUTES = 1

export async function sendPasswordResetEmail(email: string, url: URL): Promise<any> {
	if (!email) {
		return fail(400)
	}
	const db = await getDb();
	const timeoutDate = new Date(Date.now() - RESET_WAIT_MINUTES * 60 * 1000)
	const inProgress = await db.collection<User>('Users').countDocuments({
		email: email,
		disabled: false,
		resetTime: {
			$gt: timeoutDate
		}
	})
	if (inProgress != 0) {
		console.log(`password reset done recently: ${email}`);
		return fail(422, {error: "Sent recently"})
	}

	// check password
	const nanoid = customAlphabet('useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict', 16)
	const code = nanoid()
	const user = await db.collection<User>('Users').updateOne({email: email, disabled: false}, {
		$set: {
			resetCode: code,
			resetTime: new Date()
		}
	})
	if (user.modifiedCount == 0) {
		console.log(`password reset user not found or disabled: ${email}`);
		return fail(404, {error: "Email not Found"})
	}

	const protocol = url.host.indexOf("localhost") == 0 ? "http" : "https"
	const sessionUrl = new URL(protocol + '://' + url.host + base + '/password/' + code).toString()
	if (emailConfigured) {
		await transport.sendMail({
			from: process.env['SMTP_email'],
			to: email,
			subject: 'Cardographer Password Reset',
			text: 'Reset Url: ' + sessionUrl,
			html: '<div><a href="' + sessionUrl + '">Continue Password Reset</a></div>'
		});
		console.log(`Sent password reset email to ${email}`)
	} else {
		console.log("Unable to send password reset email: no Email Setup")
		console.log(sessionUrl)
	}

	return {success: true}
}

export async function isLocalUserDisabled(locals: App.Locals): Promise<boolean> {
	if (!locals.authenticated) {
		throw error(401, "Authentication Required")
	}
	if (locals.email == GUEST_EMAIL) {
		return false
	}
	const db = await getDb()
	const user = await db.collection<User>('Users')
		.findOne({email: locals.email}, {
			projection: {
				disabled: true,
				isAdmin: true, isPublisher: true, isDeckBuilder: true,
				isVerified: true,
			}
		})
	if (!user) {
		console.log(`user ${locals.email} no longer exists?!`)
		return true
	}
	return user.disabled
}

export async function verifyLocalUserIsDeckBuilder(locals: App.Locals): Promise<void> {
	if (!locals.authenticated) {
		throw error(401, "Authentication Required")
	}
	const user = await getLocalUser(locals)
	if (!user.isDeckBuilder) {
		throw error(403, "Forbidden")
	}
}

export async function verifyLocalUserIsPublisher(locals: App.Locals): Promise<void> {
	if (!locals.authenticated) {
		throw error(401, "Authentication Required")
	}
	const user = await getLocalUser(locals)
	if (!user.isPublisher) {
		throw error(403, "Forbidden")
	}
}

export async function verifyLocalUserIsAdmin(locals: App.Locals): Promise<void> {
	if (!locals.authenticated) {
		throw error(401, "Authentication Required")
	}
	const user = await getLocalUser(locals)
	if (!user.isAdmin) {
		throw error(403, "Forbidden")
	}
}

export async function getLocalUser(locals: App.Locals): Promise<User> {
	if (locals.email == GUEST_EMAIL) {
		return getGuestUser()
	}
	const db = await getDb()
	const user = await db.collection<User>('Users')
		.findOne({email: locals.email}, {
			projection: {
				disabled: true,
				isAdmin: true, isPublisher: true, isDeckBuilder: true,
				isVerified: true,
			}
		})
	if (!user) {
		throw error(500, `Local user ${locals.email} not found`);
	}
	return user
}