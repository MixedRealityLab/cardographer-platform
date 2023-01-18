import {getDb} from '$lib/db';
import type {User} from "$lib/types";
import {error} from "@sveltejs/kit";
import type {RequestHandler} from '@sveltejs/kit';
import {base} from "$app/paths";
import {customAlphabet} from 'nanoid'
import {createTransport} from 'nodemailer'

const debug = true;
const emailConfigured = 'SMTP_host' in process.env
const transport = createTransport({
	host: process.env["SMTP_host"],
	port: parseInt(process.env["SMTP_port"]),
	auth: {
		user: process.env["SMTP_user"],
		pass: process.env["SMTP_pass"]
	}
});


export const post: RequestHandler = async function ({request, url}) {
	const email = (await request.json()).email.toLowerCase()
	if (!email) {
		throw error(400)
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
		return new Response(undefined)
	}

	if (emailConfigured) {
		const sessionUrl = new URL('https://' + url.host + base + '/user/password/' + code).toString()
		await transport.sendMail({
			from: process.env['SMTP_email'],
			to: email,
			subject: 'Cardographer Password Reset',
			text: 'Reset Url: ' + sessionUrl,
			html: '<div><a href="' + sessionUrl + '">Continue Password Reset</a></div>'
		});
	} else {
		console.log("No Email Setup")
		console.log('https://' + url.host + base + '/user/password/' + code)
	}

	return new Response(undefined)
}
