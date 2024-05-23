<script>
	import { fly } from 'svelte/transition';

	import { supabase } from '$lib/SupabaseClient.js';

	let sentence = '';
	export let username;
	export let qid;
	export let roundId;
	export let player;
	export let matchId;
	export let availableSentences;
	export let totalScore;
	const colors = ['', '#8CFA91', '#FA8C8C'];

	let counter = 0;
	let startTime;
	let elapsedSeconds = 0;
	let timer;

	$: typed = Array(sentence.length).fill(0); // 0 : untyped, 1 : correct, 2 : wrong
	$: score = (typed.filter((x) => x === 1).length - elapsedSeconds.toFixed(2)).toFixed(2);
	$: scorePercent = (typed.filter((x) => x === 1).length / sentence.length) * 100;
	$: doneTyping = counter >= sentence.length;

	async function createRound(matchId) {
		try {
			const newQid = Math.floor(Math.random() * (availableSentences.length - 1));
			console.log('qid', qid, 'newQid', availableSentences[newQid]);
			const { data, error } = await supabase
				.from('rounds')
				.insert([{ match: matchId, qid: availableSentences[newQid] }])
				.select();

			if (error) {
				console.error('Error creating round:', error);
				return null;
			} else {
				console.log('Round created successfully:', data);
				// qid = data[0].qid; // Update qid from the response
				// loadTypingProblems();
				return data;
			}
		} catch (err) {
			console.error('Unexpected createRound error:', err);
			return null;
		}
	}

	async function updateRound(roundId, player, score) {
		try {
			const playerKey = `score${player}`;
			const { data, error } = await supabase
				.from('rounds')
				.update({ [playerKey]: score })
				.eq('id', roundId)
				.select();

			if (error) {
				console.error('Error updating round:', error);
				return null;
			} else {
				console.log('Round updated successfully (updateRound):', data);
				if (data[0].status == 2) createRound(matchId);
				return data;
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			return null;
		}
	}

	function onKeyPress(e) {
		if (!doneTyping) {
			if (counter == 0) {
				startTimer();
			}

			if (e.key === sentence[counter]) {
				typed[counter] = 1;
				counter++;
			} else {
				typed[counter] = 2;
				counter++;
			}
			console.log(counter, sentence.length);
			if (counter >= sentence.length) {
				stopTimer();
				totalScore += score;
				updateRound(roundId, player, score);
				console.log(`end of sentence ${timer}`);
			}
		}
	}

	function onKeyDown(e) {
		if (e.key == 'Backspace') {
			typed[counter - 1] = 0;
			counter--;
		}
	}

	// Function to load typing problems from files
	const loadTypingProblems = async () => {
		try {
			const i = qid;
			console.log('qid from Sentence', qid);
			sentence = await fetch(`./problems/${i}.txt`).then((res) => res.text());
		} catch (error) {
			console.error('Error loading typing problems:', error);
		}
	};

	const startTimer = () => {
		startTime = performance.now();
		timer = requestAnimationFrame(updateTimer);
	};

	const updateTimer = (currentTime) => {
		if (doneTyping) return;
		elapsedSeconds = (currentTime - startTime) / 1000;
		timer = requestAnimationFrame(updateTimer);
	};

	const stopTimer = () => {
		cancelAnimationFrame(timer);
	};

	$: if (qid !== undefined) {
		loadTypingProblems();
	}
</script>

<div>
	<div class="m-10 text-xl">
		<p>
			{#each sentence as letter, index (index)}
				{#if !typed[index]}
					<span id={'char' + index} class="character" style="background: {colors[typed[index]]}">
						{letter === ' ' ? '\u00A0' : letter}
					</span>
				{:else}
					<span
						in:fly={{ y: 50, duration: 100 }}
						id={'char' + index}
						class="character"
						style="background: {colors[typed[index]]}">{letter === ' ' ? '\u00A0' : letter}</span
					>
				{/if}
			{/each}
		</p>
	</div>
	<h1 class="text-3xl">{username}</h1>
	<h1>Score: {score}</h1>
	{#if doneTyping}
		<h2>Time: {elapsedSeconds.toFixed(2)}s</h2>
		<h2>Score: {scorePercent.toFixed(1)}%</h2>
		<h2>Total Score: {totalScore}</h2>
	{/if}
</div>

<svelte:window on:keydown={onKeyDown} on:keypress={onKeyPress} />

<style>
	.character {
		display: inline-block;
		padding: 0px;
	}
</style>
