<script>
	import { fade } from 'svelte/transition';

	let username;
	// Call login endpoint
	async function login() {
		const response = await fetch('/login', {
			method: 'POST',
			body: JSON.stringify({ username }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		console.log(response);
	}
</script>

<div class="m-10">
	<h1 class="pb-5 text-3xl">TypeMaster</h1>

	<input
		type="text"
		id="last_name"
		class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
		placeholder="Username"
		bind:value={username}
		required
	/>
	<div class="pt-5">
		<button
			class="{username !== ''
				? 'border-gray-400 text-gray-400'
				: 'border-gray-300 text-gray-300'} float-right font-bold py-2 px-4 rounded-lg border-2"
			on:click={login}>Enter</button
		>
	</div>
	{#if username}
		<h1 class="text-3xl" in:fade>Hello, {username}</h1>
	{/if}
</div>
