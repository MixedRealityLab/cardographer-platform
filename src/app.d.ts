/// <reference types="@sveltejs/kit" />

declare namespace App {
	interface Locals {
		email?: string
		authenticated: boolean
		token?: string
	}

	// interface PageData {
	// 	wide: boolean
	// }
}