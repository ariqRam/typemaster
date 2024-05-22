<script>
	import { goto } from '$app/navigation';
	import { fade } from 'svelte/transition';
	import { sineIn } from 'svelte/easing';
	import { writable } from 'svelte/store';

	let username = '';
	let matchId;
	let name;
	let loggedIn = writable(false);
	let logValue;

	loggedIn.subscribe((value) => {
		logValue = value;
	});
	// Call login endpoint
	async function login() {
		loggedIn.set(false);
		const response = await fetch('/login', {
			method: 'POST',
			body: JSON.stringify({ username }),
			headers: {
				'Content-Type': 'application/json'
			}
		});
		console.log('Response: \n', response);
		const data = await response.json();
		if (response.ok) {
			loggedIn.set(true);
			document.cookie = `username=${data.user[0].name};`;
			document.cookie = `id=${data.user[0].id};`;
			document.cookie = `loggedIn=true;`;
			document.cookie = `matchId=${data.match[0].id};`;
			matchId = data.match[0].id;
			document.cookie = `player=${data.player};`;
			name = username;
			console.log(`Logged in as ${username}`);
			console.log(`matchId: ${data.match[0].id}`);
		}
		setTimeout(() => {
			goto('/play');
		}, 1500);
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
			on:click={() => {
				login();
			}}>Enter</button
		>
	</div>
	{#if name}
		<h1 class="text-3xl" in:fade={{ delay: 100, duration: 1000, easing: sineIn }}>
			Hello,
			{#if logValue}
				<span in:fade={{ delay: 100, duration: 1000, easing: sineIn }}>
					{name}
				</span>
			{/if}
		</h1>
	{/if}
</div>

<svelte:window on:keypress={(e) => e.key === 'Enter' && login()} />
