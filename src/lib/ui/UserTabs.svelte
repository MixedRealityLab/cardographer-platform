<script type="ts">
import { base } from '$lib/paths';
//export let url;
export let page; // chats, rewards, settings, resources
</script>

<div class="w-full pt-1 pb-0 bg-gray-700 text-white rid grid-cols-4 gap-1 text-center">
  <a href="{base}/user/decks" class="inline-block"><div class="px-2 py-1 cursor-pointer" class:bg-gray-400="{page=='decks'}">My Decks</div></a>
	<a href="{base}/user/newdeck" class="inline-block"><div class="px-2 py-1 cursor-pointer" class:bg-gray-400="{page=='newdeck'}">New Deck</div></a>
</div>
