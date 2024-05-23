<script>
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabaseClient.js';
	import Sentence from './Sentence.svelte';
	import Popup from './Popup.svelte';

	let username;
	let matchId;
	let player;
	let matchReady = false;
	let qid;
	let roundId;
	let availableSentences = [1, 2, 3];
	let wins = [0, 0, 0, 0, 0];
	let matchCount = 0;
	let showPopup = false;
	let popupMessage = '';

	// Update the message reactively based on wins and matchCount
	$: message = `${wins[matchCount] ? 'YOU WIN' : 'YOU LOSE'}`;

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
		}

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
							qid = data[0].qid;
							availableSentences = availableSentences.filter((x) => x !== qid);
							console.log('availableSentences', availableSentences);
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
						console.log('round status', data[0].status);
						if (!data[0].score1 && !data[0].score2) {
							const win =
								player === 1 ? data[0].score1 >= data[0].score2 : data[0].score1 < data[0].score2;
							wins[matchCount++] = win ? player : 3 - player;
							showPopup = true; // Show the popup
							popupMessage = wins[matchCount - 1] === player ? 'YOU WIN' : 'YOU LOSE'; // Set the popup message
							console.log(
								'wins ',
								wins,
								'win',
								win,
								'player',
								player,
								'popupMessage: ',
								popupMessage
							);
						}
						qid = payload.new.qid;
						availableSentences = availableSentences.filter((x) => x !== qid);
						console.log('availableSentences', availableSentences);
						roundId = payload.new.id;
						console.log('roundId=', roundId, 'qid=', qid);
						console.log('dataroundId=', payload.new.id, 'dataqid=', payload.new.qid);
						matchReady = true;
					}
				}
			)
			.subscribe();

		if (player == 2) {
			setTimeout(() => {
				updateMatch(matchId);
			}, 2000);
		}

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
	<Sentence {username} {qid} {roundId} {player} {matchId} {availableSentences} />
	{#each wins as win}
		<span>{win === player ? 'O' : win === 3 - player ? 'X' : 'U'}</span>
	{/each}
{/if}

<Popup {message} bind:show={showPopup} />
