import type {RequestHandler} from "@sveltejs/kit";
import {error, text} from "@sveltejs/kit";
import {parse} from 'node-html-parser'

const escapeHTML = str => str.replace(/[&<>'"]/g,
	tag => ({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		"'": '&#39;',
		'"': '&quot;'
	}[tag]));

export const GET: RequestHandler = async function ({fetch}) {
	const response = await fetch('https://www.myrunningman.com/episodes/newest');
	if (response.ok) {
		const html = await response.text()
		const doc = parse(html)
		const links = doc.getElementsByTagName('a')
		const linkList = Array.prototype.slice.call(links)
		let previousLink = null
		let body = '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>MyRunningMan Most Recent Episodes</title>'
		linkList.forEach((link) => {
			if (link.getAttribute('href').startsWith('magnet:')) {
				// noinspection HtmlExtraClosingTag
				body += '<item><title>'
					+ escapeHTML(previousLink.textContent)
					+ '</title><link>'
					+ escapeHTML(link.getAttribute('href').replace('magnet://', 'magnet:'))
					+ '</link></item>'
			}

			previousLink = link;
		})
		body += '</channel></rss>'

		return text(body, {
			headers: {
				'Content-Type': 'text/xml; charset=UTF-8'
			}
		})
	} else {
		throw error(response.status, response.statusText)
	}
}