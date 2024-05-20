<script>
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';

	let sentence = '';
	export let username;
	const colors = ['', '#8CFA91', '#FA8C8C'];
	console.log(document.cookie);

	let counter = 0;

	let startTime;
	let elapsedSeconds = 0;
	let timer;

	$: typed = Array(sentence.length).fill(0); // 0 : untyped, 1 : correct, 2 : wrong
	$: score = Math.ceil(typed.filter((x) => x === 1).length - elapsedSeconds.toFixed(2));
	$: scorePercent = (typed.filter((x) => x === 1).length / sentence.length) * 100;
	$: doneTyping = counter < sentence.length;

	function onKeyPress(e) {
		// const isAlphabetic = /^[a-zA-Z,. ?]$/.test(e.key);
		if (doneTyping) {
			if (counter == 0) {
				startTimer();
			}

			if (e.key === sentence[counter]) {
				typed[counter] = 1;
				console.log(`${e.key} ${typed[counter]}`);
				counter++;
			} else {
				typed[counter] = 2;
				console.log(`${e.key} ${typed[counter]}`);
				counter++;
			}
			if (!doneTyping) {
				stopTimer();
				console.log('end of sentence ${timer}');
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
			const i = Math.floor(Math.random() * 3) + 1;
			console.log(i);
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
		if (!doneTyping) return;
		elapsedSeconds = (currentTime - startTime) / 1000;
		timer = requestAnimationFrame(updateTimer);
	};

	const stopTimer = () => {
		cancelAnimationFrame(timer);
	};

	// Load typing problems when component mounts
	onMount(() => {
		loadTypingProblems();
	});
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
						style=" background: {colors[typed[index]]}">{letter === ' ' ? '\u00A0' : letter}</span
					>
				{/if}
			{/each}
		</p>
	</div>
	<h1 class="text-3xl">{username}</h1>
	<h1>Score: {score}</h1>
	{#if !doneTyping}
		<h2>Time: {elapsedSeconds.toFixed(2)}s</h2>
		<h2>Score: {scorePercent.toFixed(1)}%</h2>
	{/if}
</div>

<svelte:window on:keydown={onKeyDown} on:keypress={onKeyPress} />

<style>
	.character {
		display: inline-block;
		padding: 0px;
	}
</style>
