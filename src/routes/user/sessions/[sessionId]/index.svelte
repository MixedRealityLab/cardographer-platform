<script context="module" lang="ts">
	import {base} from '$lib/paths';
	import type {LoadInput, LoadOutput} from '@sveltejs/kit';

	export async function load({page, fetch, session}: LoadInput): Promise<LoadOutput> {
		const token = session.user?.token;
		if (!token) {
			console.log(`note, no user token`, session);
			return {}
		}
		const {sessionId} = page.params;
		const res = await fetch(`${base}/api/user/sessions/${sessionId}`, {
			headers: {authorization: `Bearer ${token}`}
		});

		if (res.ok) {
			return {
				props: {
					session: (await res.json())
				}
			};
		}

		return {
			status: res.status,
			error: new Error(`Could not load ${res.url}`)
		};
	}
</script>

<script lang="ts">
	import type {Session} from '$lib/types.ts'
	import SessionEditForm from '$lib/ui/SessionEditForm.svelte'
	import SessionTabs from "./_SessionTabs.svelte"

	export let session: Session
</script>
<SessionTabs page="details" session="{session}"/>

<div class="p-6">
	<SessionEditForm sess="{session}"/>
</div>