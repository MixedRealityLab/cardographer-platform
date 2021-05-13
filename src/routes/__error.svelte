<script context="module">
	export function load({ error, status }) {
		console.log(`${error.name}: ${error.message}`, error.stack);
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
