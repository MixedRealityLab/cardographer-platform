<script>
  //export let url;
  export let page; // chats, rewards, settings, resources
</script>

<div class="w-full pt-1 pb-1 bg-gray-700 text-white rid grid-cols-4 gap-1 text-center">
  <a href="decks" class="inline-block px-2"><div class="py-1 cursor-pointer" class:text-blue-400="{page=='decks'}">My Decks</div></a>
	<a href="newdeck" class="inline-block px-2"><div class="py-1 cursor-pointer" class:text-blue-400="{page=='newdeck'}">New Deck</div></a>
</div>

