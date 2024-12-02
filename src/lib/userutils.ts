import { getDb } from "./db";
import { User } from "./types";
import type {Db} from 'mongodb';
import {error, fail} from "@sveltejs/kit";
import {base} from "$app/paths"
import {createTransport} from "nodemailer"
import {customAlphabet} from "nanoid"

const adminUsers = (process.env["ADMIN_USERS"] ?? "").split(", ;")

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

export async function getUserIsAdmin(user:User) : Promise<boolean> {
    if (user.isAdmin && !user.disabled) {
        return true
    }
    if (adminUsers.indexOf(user.email)>=0) {
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

export async function getUser(db:Db, email:string, authEmail:string): Promise<User> {
	let user = await db.collection<User>('Users')
		.findOne({email:email}, {
			projection: {
				email: true, name: true, created: true, disabled: true,
				isAdmin: true, isPublisher: true, isDeckBuilder: true,
				isVerified: true,
			}
		})
    if (!user) {
        throw error(404, `User ${email} not found`);
    }
    if (email != authEmail) { 
        const authUser = await db.collection<User>('Users')
		    .findOne({email: authEmail})
    	const isAdmin = await getUserIsAdmin(authUser)
        if (!isAdmin) {
            throw error(404, `User ${email} not found`);
        }
    }
    delete user._id
    return user
}

export async function sendPasswordResetEmail(email: string, url: string) : Promise<any> {
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

