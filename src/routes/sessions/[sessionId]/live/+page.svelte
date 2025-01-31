<script lang="ts">
	import LiveView from "$lib/ui/LiveView.svelte";
    import type {PageData} from './$types';

    export let data: PageData
</script>

<svelte:head>
	<title>Cardographer Live: {data.session.name}</title>
</svelte:head>

<div class="h-screen w-screen flex flex-col position-relative" style="height: 100svh">

    <LiveView session={data.session} isOwner={data.isOwner}></LiveView>

</div>