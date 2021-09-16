<script lang="ts">
	import {page, session} from '$app/stores';
	import type {PostFilesRequest} from '$lib/apitypes';
	import {base} from '$lib/paths';
	import type {CardDeckRevision} from '$lib/type';
	import {createEventDispatcher} from 'svelte';

	export let revision: CardDeckRevision;

	const dispatch = createEventDispatcher();

	let working = false;
	let error = '';
	let message = '';
	let files: FileList
	let input: HTMLInputElement

	async function toBase64(file): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const reader = new FileReader();
			reader.readAsDataURL(file);
			reader.onload = () => resolve(reader.result.split(',')[1]);
			reader.onerror = error => reject(error);
		});
	}

	async function handleSubmit() {
		if (files.length == 0) {
			console.log(`no file`);
			return;
		}
		//console.log(`submit`, files);
		message = '';
		error = '';

		const token = $session.user?.token;
		if (!token) {
			error = "Sorry, you don't seem to be logged in";
			return;
		}
		working = true;
		const {deckId, revId, file} = $page.params;
		let req: PostFilesRequest = {
			files: []
		}
		for (let fi = 0; fi < files.length; fi++) {
			const file = files[fi];

			const content = await toBase64(file);
			//console.log(`ready file ${file.name}`, content);
			req.files.push({
				name: file.name,
				content: content
			});
		}
		const url = `${base}/api/user/decks/${deckId}/revisions/${revId}/files${file.length == 0 ? '' : '/' + file}`;
		//console.log(`upload to ${url}`);
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${token}`,
				'content-type': 'application/json'
			},
			body: JSON.stringify(req)
		});
		//console.log(`done`, res);
		working = false;
		if (res.ok) {
			//message = "Uploaded";
			dispatch('refresh', {});
		} else {
			error = `Sorry, there was a problem (${res.statusText})`;
		}
	}

</script>

<input class="hidden" required id="file" type="file" bind:files bind:this={input} accept="*" multiple
       on:change={handleSubmit}/>

{#if error}
	<div class="message-error">{error}</div>
{/if}
{#if message}
	<div class="message-success">{message}</div>
{/if}

<button class="button" disabled={working || revision?.isLocked} on:click={() => {input.click()}}>
	<img src="{base}/icons/upload.svg" class="button-icon" alt=""/>
	Upload Files
</button>

