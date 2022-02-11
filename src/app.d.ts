/// <reference types="@sveltejs/kit" />

declare namespace App {
	interface Locals {
		email?: string;
		authenticated: boolean;
		userToken?: string;
	}

	interface Platform {}

	interface Session {
		email?: string;
		authenticated: boolean;
		userToken?: string;
	}

	interface Stuff {}
}