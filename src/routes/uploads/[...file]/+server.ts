import { error } from '@sveltejs/kit'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ params }) => {
	const filePathParam = params.file;

	if (!filePathParam) {
		throw error(400, 'Invalid path');
	}

	const uploadsDir = resolve('/app/uploads');
	const targetPath = resolve(uploadsDir, filePathParam);

	if (!targetPath.startsWith(uploadsDir)) {
		throw error(403, 'Access denied');
	}

	try {
		const fileBuffer = await readFile(targetPath);
		return new Response(fileBuffer);
	} catch (err) {
		throw error(404, 'File not found');
	}
}