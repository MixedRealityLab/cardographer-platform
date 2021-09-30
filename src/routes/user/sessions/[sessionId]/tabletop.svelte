<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import {authenticateRequest, errorResponse} from "$lib/ui/token";
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const {sessionId} = page.params;
		const res = await fetch(`${base}/api/user/sessions/${sessionId}`, authenticateRequest(session));

		if (res.ok) {
			return {
				props: {
					session: (await res.json())
				}
			};
		}
		return errorResponse(res)
	}
</script>

<script lang="ts">
	import type {Session} from "$lib/types"
	import SessionTabs from './_SessionTabs.svelte'

	export let session: Session
</script>

<SessionTabs session="{session}"/>