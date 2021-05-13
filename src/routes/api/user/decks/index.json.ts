import {getDb} from '$lib/db.ts';
import type {CardDeckSummary} from '$lib/types.ts';
import type {RequestHandler} from '@sveltejs/kit';

export async function get(): RequestHandler {
  console.log(`get decks`);
  const db = await getDb();
  // TODO user ID / email
  const decks = await db.collection('CardDeckSummaries').find({})
  	.toArray() as CardDeckSummary[];
  console.log(decks);
  return {
    body: {
      decks: decks
    }
  }
}
  
