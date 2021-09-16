<script type="ts">
	import {session} from '$app/stores';
	import LoginForm from '$lib/ui/LoginForm.svelte';
</script>

<svelte:head>
	<title>Cardographer</title>
</svelte:head>

<div class="max-w-screen-md mx-auto bg-white min-h-screen">
	{#if $session.user?.authenticated}
		<slot></slot>
	{:else}
		<div class="py-2">
			<div class="m-2 p-2 bg-red-300 rounded-lg text-center">You need to log in</div>
		</div>

		<LoginForm/>
	{/if}
</div>
