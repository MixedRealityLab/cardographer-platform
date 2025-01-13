<script lang="ts">
    import type { Session } from "$lib/types"
    export let session: Session
</script>

<div class="w-full py-1 px-2 bg-gray-700 text-2xl text-white flex items-center">
    <div class="flex grow justify-center text-ellipsis">
        {session.name}
    </div>
</div>