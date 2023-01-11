<script lang="ts">
	import {base} from "$app/paths";
	import {page} from '$app/stores'
	import type {FileInfo, PostFilesRequest} from "$lib/apitypes";
	import {DeckBuildStatus} from "$lib/types"
	import type {CardDeckRevision} from "$lib/types"
	import {toBase64} from "$lib/ui/download";
	import UploadButton from "$lib/ui/UploadButton.svelte"

	export let data
	export let error: string = null
	let building = data.revision.build && data.revision.build.status === DeckBuildStatus.Building

	async function refresh() {
		await Promise.all([
			refreshFiles(),
			refreshRevision()
		])
	}

	async function refreshRevision() {
		const res = await fetch(`${base}/api/user/decks/${$page.params.deckId}/${$page.params.revisionId}`);
		if (res.ok) {
			data.revision = await res.json() as CardDeckRevision
			building = data.revision.build && data.revision.build.status === DeckBuildStatus.Building
		} else {
			console.log(`error refreshing ${res.status}`);
		}
	}

	async function refreshFiles() {
		const path = $page.params.file.length > 0 ? '/' + $page.params.file : ''
		const res = await fetch(`${base}/api/user/decks/${$page.params.deckId}/${$page.params.revisionId}/files${path}`);
		if (res.ok) {
			data.files = await res.json() as FileInfo[]
		} else {
			console.log(`error refreshing ${res.status}`);
		}
	}

	function getPathFor(fileName: string): string {
		return `${$page.params.file.length == 0 ? '' : $page.params.file + '/'}${fileName}`
	}

	async function deleteFile(fileName: string) {
		const res = await fetch(`${base}/api/user/decks/${$page.params.deckId}/${$page.params.revisionId}/files/${getPathFor(fileName)}`,
			 {
				method: 'delete'
			})
		if (res.ok) {
			data.files = await res.json() as FileInfo[]
		} else {
			console.log(`error refreshing ${res.status}`);
		}
	}

	async function build() {
		building = true
		const res = await fetch(`${base}/api/user/decks/${$page.params.deckId}/${$page.params.revisionId}/build`,
			{
				method: 'post'
			})
		if (res.ok) {
			//files = await res.json() as FileInfo[]
			await refresh()
			const result = await res.json()
			if (result.error) {
				if (result.messages && result.messages.length > 0) {
					error = result.messages.join('')
				} else {
					error = result.error
				}
			}
		} else {
			error = res.statusText
			console.log(`error refreshing ${res.status}`);
		}
	}

	function removeLastPathSegment(path: string): string {
		const index = path.replace(/\/$/, '').lastIndexOf('/')
		if (index <= 0) {
			return ''
		} else {
			return path.substring(0, index).replace(/^\//, '')
		}
	}

	async function handleUpload(event: CustomEvent<FileList>) {
		const uploadFiles = event.detail
		if (uploadFiles.length == 0) {
			console.log(`no file`);
			return;
		}
		console.log(`submit`, uploadFiles);
		error = '';

		//working = true;
		let req: PostFilesRequest = {
			files: []
		}
		for (const file of uploadFiles) {
			const content = await toBase64(file);
			//console.log(`ready file ${file.name}`, content);
			req.files.push({
				name: file.name,
				content: content
			});
		}
		const url = `${base}/api/user/decks/${$page.params.deckId}/${$page.params.revisionId}/files${$page.params.file.length == 0 ? '' : '/' + $page.params.file}`;
		//console.log(`upload to ${url}`);
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json'
			},
			body: JSON.stringify(req)
		})
		//console.log(`done`, res);
		//working = false;
		if (res.ok) {
			data.files = await res.json() as FileInfo[]
		} else if (res.status == 413) {
			error = "Upload too large"
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}


	function downloadZip() {
		const path = $page.params.file.length > 0 ? $page.params.file : ''
		window.location.href = `../../../../../../../api/user/decks/${$page.params.deckId}/${$page.params.revisionId}/zip/${path}`
	}

	function urlFor(path: string): string {
		//if (dev) {
		//	return `${base}/api/cards/files/${$page.params.deckId}/${$page.params.revisionId}/${path}`
		//} else {
			return `${base}/uploads/${$page.params.deckId}/${$page.params.revisionId}/${path}`
		//}
	}
</script>

<div>
	{#if building}
		<div class="loader-small">&nbsp;</div>
	{/if}
	<button class="iconButton mr-3" disabled={building || data.revision.isLocked} on:click={build}
	        title={data.revision.isLocked ? 'Revision Locked, Building Disabled' : 'Build Cards'}>
		<svg fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
			<g>
				<path d="M17.59,3.41L15,6V5c0-1.1-0.9-2-2-2H9C6.24,3,4,5.24,4,8h5v3h6V8l2.59,2.59c0.26,0.26,0.62,0.41,1,0.41h0.01 C19.37,11,20,10.37,20,9.59V4.41C20,3.63,19.37,3,18.59,3h-0.01C18.21,3,17.85,3.15,17.59,3.41z"/>
			</g>
			<g>
				<path d="M9,13v7c0,0.55,0.45,1,1,1h4c0.55,0,1-0.45,1-1v-7H9z"/>
			</g>
		</svg>
	</button>
	{#if data.files.length > 0}
		<button class="iconButton" title="Download Files" on:click={downloadZip}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
				<path fill-rule="evenodd"
				      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
				      clip-rule="evenodd"/>
			</svg>
		</button>
	{/if}
	<UploadButton class="iconButton" disabled={data.revision.isLocked} multiple="true" on:upload={handleUpload}
	              title={data.revision.isLocked ? 'Revision Locked, Upload Disabled' : 'Upload Files'}>
		<svg fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
			<path clip-rule="evenodd"
			      d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
			      fill-rule="evenodd"/>
		</svg>
	</UploadButton>
</div>
<div class="flex items-center px-6 py-2">
	<div class="flex-1 block font-semibold">
		Files /{$page.params.file}
	</div>
</div>
{#if error}
	<div class="message-error mx-6 whitespace-pre-line">{error}</div>
{/if}

<style>
    .fileItem {
        @apply flex flex-1 items-center py-1.5 transition-colors duration-500 hover:text-blue-700;
    }
</style>

<div class="p-6">
	{#if $page.params.file.length > 0}
		<a class="flex flex-1 items-center py-1.5"
		   href="{base}/user/decks/{$page.params.deckId}/{$page.params.revisionId}/build/{removeLastPathSegment($page.params.file)}">
			<img src="{base}/icons/up.svg" class="w-6 mx-4" alt="back"/>
			<div>Back to /{removeLastPathSegment($page.params.file)}</div>
		</a>
	{/if}
	{#each data.files as childFile}
		<div class="flex items-center">
			{#if childFile.isDirectory}
				<a class="fileItem"
				   href="{base}/user/decks/{$page.params.deckId}/{$page.params.revisionId}/build/{childFile.path}">
					<svg xmlns="http://www.w3.org/2000/svg" class="w-6 mx-4" fill="none" viewBox="0 0 24 24"
					     stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						      d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/>
					</svg>
					<div>{childFile.name}</div>
				</a>
			{:else}
				<a class="fileItem" rel="external" target="_blank" href={urlFor(childFile.path)}>
					<svg xmlns="http://www.w3.org/2000/svg" class="w-6 mx-4" fill="none" viewBox="0 0 24 24"
					     stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
						      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
					</svg>
					<div>{childFile.name}</div>
				</a>
			{/if}
			<button class="text-gray-300 transition-colors duration-500 hover:text-red-500"
			        on:click={() => {deleteFile(childFile.name)}}>
				<svg xmlns="http://www.w3.org/2000/svg" class="w-5 mx-4 my-2" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd"
					      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
					      clip-rule="evenodd"/>
				</svg>
			</button>
		</div>
	{/each}
</div>

