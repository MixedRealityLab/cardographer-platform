<script lang="ts">
	import LiveView from "$lib/ui/LiveView.svelte";
    import type {PageLoad} from './$types';

    export let data: PageLoad
</script>

<svelte:head>
	<title>Cardographer Live: {data.session.name}</title>
</svelte:head>

<div class="h-screen w-screen flex flex-col" style="height: 100svh">

    <div class="grow">
    <LiveView session={data.session} isOwner={data.isOwner}></LiveView>
    </div>
</div>