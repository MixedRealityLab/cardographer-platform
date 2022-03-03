<script context="module" lang="ts">
	import {base} from '$app/paths'
	import {authenticateRequest, errorResponse} from "$lib/ui/token";
	import type {Load} from '@sveltejs/kit';

	export const load: Load = async function ({params, fetch, session}) {
		const {sessionId} = params;
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