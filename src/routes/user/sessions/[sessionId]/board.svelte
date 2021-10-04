<script context="module" lang="ts">
	import {loadBase} from '$lib/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token"
	import type {LoadInput, LoadOutput} from '@sveltejs/kit'

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {sessionId} = page.params
		const res = await fetch(`${loadBase}/api/user/sessions/${sessionId}`, authenticateRequest(session))
		if (res.ok) {
			return {
				props: {
					session: (await res.json())
				}
			}
		}

		return errorResponse(res)
	}
</script>

<script lang="ts">
	import {base} from '$app/paths'
	import type {Session} from "$lib/types"
	import UploadButton from "$lib/ui/UploadButton.svelte"
	import SessionTabs from './_SessionTabs.svelte'

	import {page, session as pageSession} from '$app/stores'

	export let session: Session

	let working = false
	let error = ''
	let message = ''

	// submit form
	async function upload(event: CustomEvent<FileList>) {
		const files = event.detail
		console.log(`submit`, files)
		message = ''
		error = ''

		working = true
		const {sessionId} = $page.params
		const csvData = await files[0].text()
		const res = await fetch(`${base}/api/user/sessions/${sessionId}/board`, authenticateRequest($pageSession, {
			method: 'PUT',
			headers: {
				'content-type': 'text/csv'
			},
			body: csvData
		}))
		working = false
		if (res.ok) {
			message = "Updated"
			session = (await res.json()).session
		} else {
			error = `Sorry, there was a problem (${res.statusText})`
		}
	}
</script>

<SessionTabs session="{session}"/>

<div class="p-6 flex flex-col">
	{#if session.board}
		<div class="font-semibold">{session.board.name}</div>
		{#if session.board.description}
			<div>{session.board.description}</div>
		{/if}
		{#each session.board.regions as region}
			<div class="text-sm">
				{#if !region.analyse}
					Ignore
				{/if}
				{region.name}
			</div>
		{/each}
	{:else}
		<span class="self-center">No Board</span>
	{/if}

	{#if error}
		<div class="mt-1 border-red-500 bg-red-300 rounded-md w-full py-2 px-2">{error}</div>
	{/if}
	{#if message}
		<div class="mt-1 border-green-500 bg-green-300 rounded-md w-full py-2 px-2">{message}</div>
	{/if}

	<UploadButton class="button mt-4" on:upload={upload} types=".csv,text/csv">
		<img alt="" class="w-3.5 mr-1" src="{base}/icons/upload.svg"/>Upload CSV
	</UploadButton>
</div>