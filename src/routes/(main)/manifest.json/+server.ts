import { json } from '@sveltejs/kit';
import type {RequestHandler} from "@sveltejs/kit"
import {base} from "$app/paths";


export const GET: RequestHandler = async function () {
	return json({
		"theme_color": "#374151",
		"background_color": "#e5e7eb",
		"display": "standalone",
		"start_url": base + '/',
		"name": "Cardographer",
		"short_name": "Cardographer",
		"icons": [
			{
				"src":`${base}/cards.svg`,
				"sizes": "24x24",
				"type": "image/svg"
			},
			{
				"src": `${base}/icon-192.png`,
				"sizes": "192x192",
				"type": "image/png"
			},
			{
				"src": `${base}/icon-256.png`,
				"sizes": "256x256",
				"type": "image/png"
			},
			{
				"src": `${base}/icon-384.png`,
				"sizes": "384x384",
				"type": "image/png"
			},
			{
				"src": `${base}/icon-512.png`,
				"sizes": "512x512",
				"type": "image/png"
			}
		]
	})
}
