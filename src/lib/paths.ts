import { base as sbase } from '$app/paths';

// working around serving from a path with node
// something is odd
console.log(`svelte base = ${sbase}`);
const isBrowser=new Function("try {return this===window;}catch(e){ return false;}");
const browser = isBrowser();
console.log(`browser = ${browser}`);

//export const loadBase = browser ? sbase : '';


