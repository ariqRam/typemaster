<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
	import Sentence from './Sentence.svelte';

	let username;
	let matchId;
	let player;
	let matchReady = false;
	let qid;

	$: myQid = qid;

	onMount(() => {
		function getCookies() {
			const cookies = document.cookie.split(';');
			const selectCookies = {};
			for (const cookie of cookies) {
				const [key, value] = cookie.trim().split('=');
				if (key === 'username' || key === 'matchId' || key === 'player') {
					selectCookies[key] = value;
				}
			}
			return selectCookies;
		}

		({ username, matchId, player } = getCookies());

		async function updateMatch(matchId) {
			const response = await fetch('/updateMatch', {
				method: 'POST',
				body: JSON.stringify({ matchId }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			const result = await response.json();
			console.log('Match update response:', result);

			// Optionally, update the local state or trigger other actions based on the response
		}

		// Subscribe to changes in the 'matches' table
		const matchSubscription = supabase
			.channel('match1')
			.on(
				'postgres_changes',
				{ event: 'UPDATE', schema: 'public', table: 'matches', filter: `id=eq.${matchId}` },
				async (payload) => {
					if (payload.new.status == 'ready') {
						console.log('Match is ready:', payload.new);
						matchReady = true;
						const { data, error } = await supabase
							.from('rounds')
							.select()
							.eq('match', matchId)
							.limit(1);

						if (error) {
							console.error('Error fetching round data:', error);
						} else {
							qid = data[0].qid; // Ensure qid is updated reactively
							console.log('qid=', qid);
						}
					}
				}
			)
			.subscribe();

		if (player == 2) {
			// Call the updateMatch function
			setTimeout(() => {
				updateMatch(matchId);
			}, 2000);
		}

		// Unsubscribe from changes when the component is destroyed
		return () => {
			supabase.removeChannel(matchSubscription);
		};
	});
</script>

<h1>TypeMaster</h1>
<h2>{matchId}</h2>
{#if !matchReady && myQid === undefined}
	<h2>マッチを探している・・</h2>
{:else}
	<Sentence {username} qid={myQid} />
{/if}
