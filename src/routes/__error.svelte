<script context="module" lang="ts">
	import type {ErrorLoadInput, LoadOutput} from "@sveltejs/kit"

	export async function load({error, status}: ErrorLoadInput): Promise<LoadOutput> {
		console.log(`${error.name}: ${error.message}`, error.stack)
		return {
			props: {
				title: `${status}: ${error.message}`
			}
		};
	}
</script>

<script>
	export let title;
</script>

<h1>{title}</h1>
