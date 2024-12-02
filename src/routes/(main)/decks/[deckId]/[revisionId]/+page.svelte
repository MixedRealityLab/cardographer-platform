<script lang="ts">
	import {enhance} from "$app/forms";
	import type {CardDeckRevision} from "$lib/types"
	import DeckHeader from "./DeckHeader.svelte";

	export let data

	let error = ''
	let message = ''
</script>

<DeckHeader deck={data.revision}/>

<form class="p-6 flex flex-col gap-4" method="post" use:enhance>
	<label>
		<span>Title</span>
		<input name="deckName" bind:value={data.revision.deckName} class="block w-full" required type="text"
		       disabled={!data.revision.isOwnedByUser}/>
	</label>
	<label>
		<span>Description</span>
		<textarea name="deckDescription" bind:value={data.revision.deckDescription} class="block w-full"
		          rows="3" disabled={!data.revision.isOwnedByUser}></textarea>
	</label>
	<div>
		<span class="text-sm text-gray-800">Created</span>
		<div class="px-3">{new Date(data.revision.created).toLocaleString('en-gb', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		})}</div>
	</div>
	<label>
		<span>Credits</span>
		<input name="deckCredits" bind:value={data.revision.deckCredits} class="block w-full" type="text"
		       disabled={!data.revision.isOwnedByUser}/>
	</label>
	<label>
		<span>Revision Subtitle</span>
		<input name="revisionName" bind:value={data.revision.revisionName} class="block w-full" type="text"
		       disabled={!data.revision.isOwnedByUser}/>
	</label>
	<label>
		<span>Revision Description</span>
		<textarea name="revisionDescription" bind:value={data.revision.revisionDescription} class="block w-full"
		          rows="3" disabled={!data.revision.isOwnedByUser}></textarea>
	</label>
	<label>
		<span>Slug (for filenames and URLs)</span>
		<input name="slug" bind:value={data.revision.slug} class="block w-full" type="text" disabled={!data.revision.isOwnedByUser}/>
	</label>
	<label>
		<span>Image DPI (Dots Per Inch)</span>
		<input name="imageDpi" bind:value={data.revision.imageDpi} class="block w-full" type="number"
		       disabled={!data.revision.isOwnedByUser}/>
	</label>
	<div class="flex flex-wrap justify-center gap-4 py-1">
		<label class="flex items-center gap-2">
			<input name="isUsable" bind:checked={data.revision.isUsable} class="form-checkbox" type="checkbox"
			       disabled={!data.revision.isOwnedByUser}>
			<span>Usable</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isPublic" bind:checked={data.revision.isPublic} class="form-checkbox" type="checkbox"
			       disabled={!data.revision.isOwnedByUser || !data.localUser?.isPublisher}>
			<span>Public</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isLocked" bind:checked={data.revision.isLocked} class="form-checkbox" type="checkbox"
			       disabled={!data.revision.isOwnedByUser}>
			<span>Locked</span>
		</label>
		<label class="flex items-center gap-2">
			<input name="isTemplate" bind:checked={data.revision.isTemplate} class="form-checkbox" type="checkbox"
			       disabled={!data.revision.isOwnedByUser}>
			<span>Template</span>
		</label>
		{#if data.build}
			<label class="flex items-center">
				<input name="buildDisabled" type="checkbox" class="form-checkbox" bind:checked={data.revision.build.isDisabled}
				       disabled={!data.revision.isOwnedByUser}>
				<span class="ml-2">Disable re-build</span>
			</label>
		{/if}

	</div>

	{#if error}
		<div class="message-error">{error}</div>
	{/if}
	{#if message}
		<div class="message-success">{message}</div>
	{/if}

	<input class="button self-center mt-2" type='submit' value='Save' disabled={!data.revision.isOwnedByUser}>
</form>