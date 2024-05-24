<script>
	import { createEventDispatcher } from 'svelte';
	import { fly } from 'svelte/transition';
	// import { supabase } from '/vercel/path0/src/lib/supabaseClient.js';
	import { supabase } from '$lib/supabaseClient.js';

	let sentence = '';
	export let username;
	export let qid;
	export let roundId;
	export let player;
	export let totalScore;
	export let showPopup;
	const colors = ['', '#8CFA91', '#FA8C8C'];
	const dispatcher = createEventDispatcher();

	let counter = 0;
	let startTime;
	let elapsedSeconds = 0;
	let timer;

	$: typed = Array(sentence.length).fill(0); // 0: untyped, 1: correct, 2: wrong
	$: score = (typed.filter((x) => x === 1).length - elapsedSeconds.toFixed(2)).toFixed(2);
	$: scorePercent = (typed.filter((x) => x === 1).length / sentence.length) * 100;
	$: doneTyping = counter >= sentence.length;

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
				return data;
			}
		} catch (err) {
			console.error('Unexpected error:', err);
			return null;
		}
	}

	function onKeyPress(e) {
		if (!doneTyping & !showPopup) {
			if (counter === 0) {
				startTimer();
			}

			if (e.key === sentence[counter]) {
				typed[counter] = 1;
			} else {
				typed[counter] = 2;
			}
			counter++;

			if (counter >= sentence.length) {
				stopTimer();
				totalScore += parseFloat(score);
				dispatcher('updateTotalScore', { totalScore });
				updateRound(roundId, player, score);
				console.log(`End of sentence: ${timer}`);
			}
		} else {
			if (e.key === 'Enter') {
				dispatcher('closePopup'); // Dispatch event to notify parent to close popup
			}
		}
	}

	function onKeyDown(e) {
		if (e.key === 'Backspace' && counter > 0) {
			counter--;
			typed[counter] = 0;
		}
	}

	const loadTypingProblems = async () => {
		try {
			if (qid !== undefined) {
				sentence = await fetch(`./problems/${qid}.txt`).then((res) => res.text());
				resetTypingState();
			}
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

	const resetTypingState = () => {
		counter = 0;
		typed = Array(sentence.length).fill(0);
		elapsedSeconds = 0;
		score = 0;
		doneTyping = false;
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
