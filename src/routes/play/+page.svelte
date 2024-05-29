<script>
	import { onMount, onDestroy } from 'svelte';
	import { goto, beforeNavigate } from '$app/navigation';
	// import { supabase } from '/vercel/path0/src/lib/supabaseClient.js';
	import { supabase } from '$lib/supabaseClient.js';
	import Sentence from './Sentence.svelte';
	import Popup from './Popup.svelte';

	let username;
	let matchId;
	let player;
	let enemy;
	let matchReady = false;
	let matchDone = false;
	let qid;
	let roundId;
	let wins = [0, 0, 0, 0, 0];
	let matchCount = 0;
	let showPopup = false;
	let totalScore = 0;
	let winner;
	let win;

	// Function to handle the cleanup logic
	async function handleNavigationAway() {
		const { data, error } = await supabase
			.from('matches')
			.delete()
			.eq('id', matchId)
			.eq('status', 'created')
			.select()
			.single();
	}

	// Use the beforeNavigate hook to perform actions before navigation occurs
	beforeNavigate(async () => {
		await handleNavigationAway();
	});

	// Ensure cleanup on component destroy as well
	onDestroy(async () => {
		await handleNavigationAway();
	});
	// Update the message reactively based on wins and matchCount
	$: message = `${wins[matchCount - 1] === parseInt(player) ? 'YOU WON THE ROUND! Total Score: ' + totalScore : 'YOU LOST THE ROUND ! Total Score: ' + totalScore}`;

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
					if (payload.new.status == 'in-progress') {
						console.log('Match is ready:', payload.new);
						const { data: matchData, matchError } = await supabase
							.from('matches')
							.select(
								`
										player1:users!matches_player1_fkey (id, name),
										player2:users!matches_player2_fkey (id, name)
										`
							)
							.eq('id', matchId);
						enemy = player == 1 ? matchData[0].player2.name : matchData[0].player1.name;
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
					} else if (payload.new.status == 'done') {
						if (payload.new.score1 && payload.new.score2) {
							matchDone = true;
							winner =
								payload.new.score1 >= payload.new.score2
									? player == 1
										? username
										: enemy
									: player == 1
										? enemy
										: username;
							message =
								payload.new.score1 >= payload.new.score2
									? player == 1
										? 'YOU WON! '
										: 'YOU LOST! '
									: player == 1
										? 'YOU LOST! '
										: 'YOU WON! ';
							win = payload.new.score1 >= payload.new.score2 ? player == 1 : player == 2;
							message += 'Your score is ' + totalScore;
							showPopup = true;
							console.log('Match concluded');
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
							if (matchCount === 5) {
								matchDone = true;
								const { data: newData, error } = await supabase
									.from('matches')
									.update({
										status: 'done',
										[player == 1 ? 'score1' : 'score2']: totalScore
									})
									.eq('id', matchId)
									.select(
										`
										score1,
										score2,
										player1:users!matches_player1_fkey (id, name),
										player2:users!matches_player2_fkey (id, name)
										`
									);
								console.log('NEWDATA', newData[0]);
								if (error) {
									console.error('Error concluding match data:', error.message);
								} else if (newData[0].score1 && newData[0].score2) {
									winner =
										newData[0].score1 >= newData[0].score2
											? newData[0].player1.name
											: newData[0].player2.name;
									message =
										newData[0].score1 >= newData[0].score2
											? player == 1
												? 'YOU WON! '
												: 'YOU LOST! '
											: player == 1
												? 'YOU LOST! '
												: 'YOU WON! ';
									message += 'Your score is ' + totalScore;
									showPopup = true;
									console.log('Match concluded');
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

<h1>タイプマスター</h1>
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
		{matchDone}
		{showPopup}
		on:updateTotalScore={(e) => (totalScore = e.detail.totalScore)}
		on:closePopup={() => (showPopup = false)}
	/>
	{#each wins as win}
		<span>{win === parseInt(player) ? 'O' : win === 3 - player ? 'X' : ''}</span>
	{/each}
{/if}
<button
	class="border-gray-400 text-gray-400 float-right font-bold py-2 px-4 rounded-lg border-2"
	on:click={() => {
		goto('/');
	}}>タイトルへ</button
>

<Popup {matchDone} {winner} {win} {message} bind:show={showPopup} />
