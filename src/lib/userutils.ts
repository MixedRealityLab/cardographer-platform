import { getDb } from "./db";
import { User } from "./types";
import type {Db} from 'mongodb';
import {error} from "@sveltejs/kit";

const adminUsers = (process.env["ADMIN_USERS"] ?? "").split(", ;")

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