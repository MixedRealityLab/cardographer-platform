<script lang="ts">
	import type {CardDeckRevision} from "$lib/types"
	import type {ActionData} from "./$types"

	export let data: CardDeckRevision
	export let form: ActionData

	let error = ''
	let message = ''
</script>

<form class="p-6 flex flex-col gap-4" method="post">
	<label>
		<span>Title</span>
		<input bind:value="{data.deckName}" class="block w-full" id="deckName" required type="text"/>
	</label>
	<label>
		<span>Description</span>
		<textarea bind:value="{data.deckDescription}" class="block w-full" id="deckDescription" rows="3"
		          type="text"></textarea>
	</label>
	<label>
		<span>Credits</span>
		<input bind:value="{data.deckCredits}" class="block w-full" id="deckCredits" type="text"/>
	</label>
	<label>
		<span>Revision Subtitle</span>
		<input bind:value="{data.revisionName}" class="block w-full" id="revisionName" type="text"/>
	</label>
	<label>
		<span>Revision Description</span>
		<textarea bind:value="{data.revisionDescription}" class="block w-full" id="revisionDescription" rows="3"
		          type="text"></textarea>
	</label>
	<label>
		<span>Slug (for filenames and URLs)</span>
		<input bind:value="{data.slug}" class="block w-full" id="slug" type="text"/>
	</label>
	<div class="flex flex-wrap justify-center gap-4 py-1">
		<label class="flex items-center gap-2">
			<input bind:checked="{data.isUsable}" class="form-checkbox" type="checkbox">
			<span>Usable</span>
		</label>
		<label class="flex items-center gap-2">
			<input bind:checked="{data.isPublic}" class="form-checkbox" type="checkbox">
			<span>Public</span>
		</label>
		<label class="flex items-center gap-2">
			<input bind:checked="{data.isLocked}" class="form-checkbox" type="checkbox">
			<span>Locked</span>
		</label>
		<label class="flex items-center gap-2">
			<input bind:checked="{data.isTemplate}" class="form-checkbox" type="checkbox">
			<span>Template</span>
		</label>
		{#if data.build}
			<label class="flex items-center">
				<input type="checkbox" class="form-checkbox" bind:checked="{data.build.isDisabled}">
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

	<input class="button self-center mt-2" type='submit' value='Save'>
</form>