<script lang="ts">
	import {base} from "$app/paths";

	import {page} from '$app/stores'
	import UploadButton from "$lib/ui/UploadButton.svelte"
	import SessionHeader from "../SessionHeader.svelte";
	import type {PageData} from './$types'

	export let data: PageData


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
		const res = await fetch(`${base}/api/user/sessions/${sessionId}/board`, {
			method: 'PUT',
			headers: {
				'content-type': 'text/csv'
			},
			body: csvData
		})
		working = false
		if (res.ok) {
			message = "Updated"
			data = (await res.json()).session
		} else {
			error = `Sorry, there was a problem (${res.statusText})`
		}
	}
</script>

<SessionHeader session={data}/>

<div class="p-6 flex flex-col">
	{#if data.board}
		<div class="font-semibold">{data.board.name}</div>
		{#if data.board.description}
			<div>{data.board.description}</div>
		{/if}
		{#each data.board.regions as region}
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