<script context="module" lang="ts">
	import type {FileInfo} from '$lib/apitypes'
	import {loadBase} from '$lib/paths'
	import type {CardDeckRevision} from "$lib/types"
	import {authenticateRequest, errorResponses} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {deckId, revisionId, file} = page.params
		const path = file.length > 0 ? '/' + file : ''
		const authHeader = authenticateRequest(session)
		const responses = await Promise.all([
			fetch(`${loadBase}/api/user/decks/${deckId}/${revisionId}/files${path}`, authHeader),
			fetch(`${loadBase}/api/user/decks/${deckId}/${revisionId}`, authHeader)
		])

		if (responses.every((res) => res.ok)) {
			return {
				props: {
					files: await responses[0].json() as FileInfo[],
					revision: await responses[1].json() as CardDeckRevision
				}
			}
		}
		return errorResponses(responses)
	}
</script>
<script lang="ts">
	import {base} from '$app/paths'
	import {page, session} from '$app/stores'
	import {DeckBuildStatus} from "$lib/types";
	import type {CardDeckRevision} from "$lib/types"
	import DeckTabs from "../_DeckTabs.svelte"
	import FileUploadForm from '$lib/ui/FileUploadForm.svelte'

	let {deckId, revisionId, file} = $page.params
	export let files: FileInfo[]
	export let revision: CardDeckRevision
	export let error = ""

	let building = revision.build && revision.build.status === DeckBuildStatus.Building

	async function refresh() {
		await Promise.all([
			refreshFiles(),
			refreshRevision()
		])
	}

	async function refreshRevision() {
		const {deckId, revisionId} = $page.params
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}`, authenticateRequest($session));
		if (res.ok) {
			revision = await res.json() as CardDeckRevision
			building = revision.build && revision.build.status === DeckBuildStatus.Building
		} else {
			console.log(`error refreshing ${res.status}`);
		}
	}

	async function refreshFiles() {
		const {deckId, revisionId, file} = $page.params
		const path = file.length > 0 ? '/' + file : ''
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}/files${path}`, authenticateRequest($session));
		if (res.ok) {
			files = await res.json() as FileInfo[]
		} else {
			console.log(`error refreshing ${res.status}`);
		}
	}

	async function uploadFinished(event: CustomEvent) {
		console.log(event)
		files = event.detail as FileInfo[]
	}

	async function deleteFile(path: string) {
		const {deckId, revisionId} = $page.params
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}/files/${path}`,
			authenticateRequest($session, {
				method: 'delete'
			}));
		if (res.ok) {
			files = await res.json() as FileInfo[]
		} else {
			console.log(`error refreshing ${res.status}`);
		}
	}

	async function build() {
		const {deckId, revisionId} = $page.params
		building = true
		const res = await fetch(`${base}/api/user/decks/${deckId}/${revisionId}/build`,
			authenticateRequest($session, {
				method: 'post'
			}));
		if (res.ok) {
			//files = await res.json() as FileInfo[]
			await refresh()
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
			return '/' + path.substring(0, index)
		}
	}
</script>

<DeckTabs revision="{revision}"/>
<div class="flex items-center px-6 py-2">
	<div class="flex-1 block font-semibold">
		Files /{$page.params.file}
	</div>
	<button class="button-slim mr-4" disabled={building} on:click={build}>Build</button>

	<FileUploadForm on:finished={uploadFinished}/>
</div>
{#if error}
	<div class="message-error mx-6">{error}</div>
{/if}


<div class="p-6">
	{#if $page.params.file.length > 0}
		<a class="flex flex-1 items-center py-1.5"
		   href="{base}/user/decks/{deckId}/{revisionId}/build{removeLastPathSegment($page.params.file)}">
			<img src="{base}/icons/up.svg" class="w-6 mx-4" alt="back"/>
			<div>Back to /{removeLastPathSegment($page.params.file)}</div>
		</a>
	{/if}
	{#each files as file}
		<div class="flex items-center">
			{#if file.isDirectory}
				<!-- TODO: fix files/ to actual path to handle sub-sub-directories -->
				<a class="flex flex-1 items-center py-1.5" href="{'build/'+file.name}">
					<img src="{base}/icons/folder.svg" class="w-6 mx-4" alt="Directory"/>
					<div>{file.name}</div>
				</a>
			{:else}
				<a class="flex flex-1 items-center py-1.5" target="_blank"
				   href="{base}/uploads/{deckId}/{revisionId}/{$page.params.file.length > 0 ? $page.params.file + '/' : ''}{file.name}">
					<img src="{base}/icons/file.svg" class="w-6 mx-4" alt="File"/>
					<div>{file.name}</div>
				</a>
			{/if}
			<button class="opacity-25 transition-opacity duration-500 hover:opacity-100"
			        on:click={() => {deleteFile(($page.params.file.length > 0 ? $page.params.file + '/' : '')+ file.name)}}><img
					src="{base}/icons/delete.svg" class="w-5 mx-4 my-2" alt="Delete"/></button>
		</div>
	{/each}
</div>

