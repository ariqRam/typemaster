<script>
	import { onMount } from 'svelte';

	let sentence = "";
	const colors = ["", "green", "red"];
	
	let counter = 0;
	
	let startTime;
  let elapsedSeconds = 0;
	let timer;

	$: typed	= Array(sentence.length).fill(0); // 0 : untyped, 1 : correct, 2 : wrong
	$: score = typed.filter(x => x === 1).length;
	$: scorePercent = (score / sentence.length) * 100;
	$: doneTyping=counter<sentence.length;

	function onKeyDown(e) {
		// const isAlphabetic = /^[a-zA-Z,. ?]$/.test(e.key);
		const disallowedKeys = ["Control", "Alt", "Meta", "Escape", "Tab", "Shift"];
		if (doneTyping) {
			if (counter == 0) {
				startTimer();
			}
			if(!disallowedKeys.includes(e.key)) {
				if (e.key === sentence[counter]) {
					typed[counter] = 1;
					console.log(`${e.key} ${typed[counter]}`);
					counter++;
				} else if (e.key == 'Backspace') {
					typed[counter - 1] = 0;
					counter--;
				} else {
					typed[counter] = 2;
					console.log(`${e.key} ${typed[counter]}`);
					counter++;
				}
		} 
		if(!doneTyping) {
			stopTimer();
			console.log("end of sentence ${timer}");
		}
			}
	}

	 // Function to load typing problems from files
  const loadTypingProblems = async () => {
    try {
			const i = Math.floor(Math.random() * 3) + 1;
			console.log(i);
      sentence = await fetch(`./problems/${i}.txt`).then(res => res.text());
    } catch (error) {
      console.error("Error loading typing problems:", error);
    }
  }

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
	<p>
		{#each sentence as letter, index (index)}
		<span class="character" style="background: {colors[typed[index]]}">{letter === ' ' ? '\u00A0' : letter}</span>
		{/each}
	</p>
	<h1>Score: {score}</h1>
	{#if !doneTyping}
		<h2>Time: {elapsedSeconds.toFixed(2)}s</h2>
		<h2>Score: {scorePercent.toFixed(1)}%</h2>
	{/if}
</div>

<style>
	.character {
		display: inline-block;
		padding: 0px;
	}
</style>

<svelte:window on:keydown|preventDefault={onKeyDown} />