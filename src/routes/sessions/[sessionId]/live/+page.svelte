<script lang="ts">
	import LiveView from "$lib/ui/LiveView.svelte";
    import type {PageLoad} from './$types';

    export let data: PageLoad
</script>

<svelte:head>
	<title>Cardographer Live: {data.session.name}</title>
</svelte:head>

<div class="h-screen w-screen flex flex-col" style="height: 100svh">

    <div>Session {data.session.name} {data.readonly ? '(Readonly)' : ''}</div>
    <div>{data.session.decks.length} decks, {data.session.decks.flatMap(deck=>deck['cards']).length} cards</div>

    <div class="grow">
    <LiveView session={data.session}></LiveView>
    </div>
</div>