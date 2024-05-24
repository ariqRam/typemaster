<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	// import { supabase } from '/vercel/path0/src/lib/supabaseClient.js';
	import { supabase } from '$lib/supabaseClient.js';
	import Sentence from './Sentence.svelte';
	import Popup from './Popup.svelte';

	let username;
	let matchId;
	let player;
	let matchReady = false;
	let qid;
	let roundId;
	let wins = [0, 0, 0, 0, 0];
	let matchCount = 0;
	let showPopup = false;
	let totalScore = 0;

	// Update the message reactively based on wins and matchCount
	$: message = `${wins[matchCount - 1] === parseInt(player) ? 'YOU WIN | Total Score: ' + totalScore : 'YOU LOSE | Total Score: ' + totalScore}`;

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
							.order('created_at', { ascending: true })
							.limit(1);

						if (error) {
							console.error('Error fetching round data:', error);
						} else if (data.length) {
							qid = data[0].qid;
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
				{ event: 'UPDATE', schema: 'public', table: 'rounds', filter: `match=eq.${matchId}` },
				async (payload) => {
					console.log('Round subscription payload:', payload);
					const { data, error } = await supabase
						.from('rounds')
						.select()
						.eq('id', wins[wins.length - 2] !== 0 ? payload.new.id : payload.new.id + 1)
						.limit(1);

					if (error) {
						console.error('Error fetching round data:', error);
					} else if (data.length) {
						if (payload.new.status === 2) {
							matchReady = false;
							qid = undefined;
							// Handle round completion
							const win =
								parseInt(player) === 1
									? payload.new.score1 >= payload.new.score2
									: payload.new.score1 < payload.new.score2;
							wins[matchCount++] = win ? parseInt(player) : 3 - player;
							showPopup = true; // Show the popup
							console.log(matchCount);
							if (matchCount === 5) {
								message = 'Total Score ' + totalScore;
								console.log('match is done, total score is', totalScore);
								if (parseInt(player) === 1) {
									const { data, error } = await supabase
										.from('matches')
										.update({
											status: 'done',
											score1: payload.new.score1,
											score2: payload.new.score2
										})
										.eq('id', matchId)
										.select();
									if (error) {
										console.error('Error concluding match data:', error.message);
									} else {
										console.log('Match concluded');
										goto('/');
									}
								} else {
									goto('/');
								}
							} else {
								qid = data[0].qid;
								roundId = data[0].id;
								console.log('roundId=', roundId, 'qid=', qid);
								matchReady = true;
							}
						}
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
	<Sentence
		{username}
		{qid}
		{roundId}
		{player}
		{totalScore}
		{showPopup}
		on:updateTotalScore={(e) => (totalScore = e.detail.totalScore)}
		on:closePopup={() => (showPopup = false)}
	/>
	{#each wins as win}
		<span>{win === parseInt(player) ? 'O' : win === 3 - player ? 'X' : 'U'}</span>
	{/each}
{/if}

<Popup {message} bind:show={showPopup} />
