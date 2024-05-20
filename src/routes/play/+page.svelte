<script>
	import { onMount } from 'svelte';

	import Sentence from './Sentence.svelte';
	import { supabase } from '$lib/supabaseClient.js';

	let username;
	let matchId;
	let player2LoggedIn;
	onMount(() => {
		function getCookies() {
			const cookies = document.cookie.split(';');

			const selectCookies = {};
			for (const cookie of cookies) {
				const [key, value] = cookie.trim().split('=');
				if (key === 'username') {
					// Replace 'username' with the actual cookie name
					if (value.startsWith('{') && value.endsWith('}')) {
						// Value is an object, parse it
						selectCookies[key] = JSON.parse(value);
					} else {
						// Value is a simple string
						console.log('value', value);
						selectCookies[key] = value;
					}
				} else if (key === 'matchId') {
					selectCookies[key] = value;
				}
			}

			console.log('selectCookies', selectCookies);
			return selectCookies;
		}

		({ username, matchId } = getCookies());

		// Subscribe to changes in the 'matches' table
		const matchSubscription = supabase
			.channel('match1')
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
				(payload) => {
					console.log('payload received', payload);
					if (payload.new.player2) {
						player2LoggedIn = true;
						console.log('Player 2 has logged in:', payload.new);
					}
				}
			)
			.subscribe();

		// Unsubscribe from changes when the component is destroyed
		return () => {
			supabase.removeSubscription(matchSubscription);
		};
	});
</script>

<h1>TypeMaster</h1>
<h2>{matchId}</h2>
{#if player2LoggedIn}
	<h2>PLAYER 2 Logged In</h2>
{/if}
<Sentence {username} />
