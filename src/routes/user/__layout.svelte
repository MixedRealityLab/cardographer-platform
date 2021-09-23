<script type="ts">
	import {session} from '$app/stores';
	import AppBar from "$lib/ui/AppBar.svelte";
	import LoginForm from '$lib/ui/LoginForm.svelte';
</script>

<div class="max-w-screen-md mx-auto bg-white min-h-screen">
	{#if $session.user?.authenticated}
		<slot></slot>
	{:else}
		<AppBar/>

		<LoginForm/>
	{/if}
</div>
