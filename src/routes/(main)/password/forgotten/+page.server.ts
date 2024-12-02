import {base} from "$app/paths"
import {getDb} from "$lib/db"
import type {User} from "$lib/types"
import type {Actions} from "@sveltejs/kit"
import {fail} from "@sveltejs/kit"
import {customAlphabet} from "nanoid"
import {createTransport} from "nodemailer"

const debug = true;
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

export const actions: Actions = {
	default: async ({request, url}) => {
		const data = await request.formData();
		let email = data.get('email') as string;
		console.log(`reset password for ${email}`)
		if (!email) {
			return fail(400)
		}
		// check password
		const db = await getDb();
		const nanoid = customAlphabet('useandom26T198340PX75pxJACKVERYMINDBUSHWOLFGQZbfghjklqvwyzrict', 16)
		const code = nanoid()
		const user = await db.collection<User>('Users').updateOne({email: email, disabled: false}, {
			$set: {
				resetCode: code,
				resetTime: new Date()
			}
		})
		if (user.modifiedCount == 0) {
			if (debug) console.log(`password reset user not found: ${email}`);
			return fail(404, {error: "Email not Found"})
		}

		if (emailConfigured) {
			const sessionUrl = new URL('https://' + url.host + base + '/password/' + code).toString()
			await transport.sendMail({
				from: process.env['SMTP_email'],
				to: email,
				subject: 'Cardographer Password Reset',
				text: 'Reset Url: ' + sessionUrl,
				html: '<div><a href="' + sessionUrl + '">Continue Password Reset</a></div>'
			});
		} else {
			console.log("No Email Setup")
			console.log('https://' + url.host + base + '/password/' + code)
		}

		return {success: true}
	}
}