<script lang="ts">
	import {goto} from '$app/navigation'
	import {base} from '$app/paths'
	import {formatDate} from "$lib/ui/formatutils";
	import type {Session, SessionSnapshot} from "$lib/types"
	import ConfirmDialog from '$lib/ui/ConfirmDialog.svelte'
	import { createEventDispatcher } from 'svelte';

	const dispatch = createEventDispatcher();
	export let session: Session
    export let snapshot: SessionSnapshot

    async function openDefaultAnalysis(e) {
        e.preventDefault()
        // TODO
        console.log('open default analysis...')
		//const res = await fetch(`${base}/sessions/${session._id}`, {
		//	method: 'DELETE'
		//})
		//if (res.ok) {
		await goto(`${base}/analyses`)
	}

</script>

<div class="listItem flex-col p-1">
    <div class="flex">
        <div class="flex-1">Snapshot at {formatDate(snapshot.created)}</div>
        <ConfirmDialog
        title="Delete snapshot {formatDate(snapshot.created)}?"
        cancelTitle="Cancel"
        confirmTitle="Delete"
        let:confirm="{confirmThis}">
            <button class="iconButton" on:click={(ev) => { confirmThis( () => {snapshot.deleting=true; dispatch('delete')} ); ev.preventDefault() } }
                    title='Delete data' disabled={snapshot.deleting}>
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path clip-rule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        fill-rule="evenodd"/>
                </svg>
            </button>
        </ConfirmDialog>    
    </div>
        <input type="hidden" name="id" value="{snapshot._id}"/>
        <label>
            <input name="description-{snapshot._id}" bind:value="{snapshot.snapshotDescription}" class="mt-1 block w-full" type="text" placeholder="description"/>
        </label>
        <div class="flex justify-left gap-2 p-1">
            <label class="flex items-center">
                <input name="isNotForAnalysis-{snapshot._id}" bind:checked="{snapshot.isNotForAnalysis}" class="form-checkbox" type="checkbox">
                <span class="ml-2">No Analysis</span>
            </label>
            <button class="button" disabled={snapshot.isNotForAnalysis} on:click="{openDefaultAnalysis}">Open Default Analysis</button>
        </div>
</div>
