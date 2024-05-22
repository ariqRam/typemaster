<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
	import Sentence from './Sentence.svelte';

	let username;
	let matchId;
	let player;
	let matchReady = false;
	let qid;
	let roundId;

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
						const { data, error } = await supabase
							.from('rounds')
							.select()
							.eq('match', matchId)
							.limit(1);

						if (error) {
							console.error('Error fetching round data:', error);
						} else {
							qid = data[0].qid; // Ensure qid is updated reactively
							roundId = data[0].id;
							console.log('roundId=', roundId, 'qid=', qid);
							matchReady = true;
						}
					}
				}
			)
			.subscribe();

		const roundSubscription = supabase
			.channel('round1')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'rounds', filter: `match=eq.${matchId}` },
				async (payload) => {
					matchReady = false;
					qid = undefined;
					console.log('Round subscription payload:', payload);
					const { data, error } = await supabase
						.from('rounds')
						.select()
						.eq('id', payload.new.id)
						.limit(1);
					if (error) {
						console.error('Error fetching round data:', error);
					} else {
						qid = data[0].qid; // Ensure qid is updated reactively
						roundId = data[0].id;
						console.log('roundId=', roundId, 'qid=', qid);
						console.log('dataroundId=', data[0].id, 'dataqid=', data[0].qid);
						matchReady = true;
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
			supabase.removeChannel(roundSubscription);
		};
	});
</script>

<h1>TypeMaster</h1>
<h2>{matchId}</h2>
{#if !matchReady || qid === undefined}
	<h2>マッチを探している・・</h2>
{:else}
	<Sentence {username} {qid} {roundId} {player} {matchId} />
{/if}
