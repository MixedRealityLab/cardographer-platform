<script type="ts">
import LoginForm from '$lib/ui/LoginForm.svelte';
import {session} from '$app/stores';

</script>

{#if $session.user?.authenticated}
<slot></slot>

{:else}

<div class="m-2 p-2 bg-red-300 rounded-lg text-center">You need to log in</div>

<LoginForm/>

{/if}
