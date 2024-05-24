<script>
	import { goto } from '$app/navigation';
	import JSConfetti from 'js-confetti';

	export let message;
	export let show = false;
	export let matchDone;
	export let winner;
	export let win;
	const jsConfetti = new JSConfetti();
	// if(matchDone) jsConfetti.addConfetti()

	$: matchDone && win && jsConfetti.addConfetti() && console.log('CONFETTI', win, winner);

	function closePopup() {
		show = false;
		if (matchDone) {
			console.log('redirecting to home..');
			goto('/');
		}
	}

	function onKeyPress(e) {
		if (e.key === 'Enter' && matchDone) {
			closePopup();
			if (matchDone) goto('/');
		}
	}
</script>

{#if show}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
		<div class="bg-white p-16 rounded shadow-md text-center max-w-2xl w-full">
			<p class="mb-8 text-xl">{message}</p>
			{#if matchDone}
				<p>Winner: {winner}</p>
			{/if}
			<button
				class="border-gray-400 text-gray-400 py-2 px-2 rounded-lg border-2"
				on:click={closePopup}
			>
				Close [Enter]
			</button>
		</div>
	</div>
{/if}

<svelte:window on:keypress={onKeyPress} />

<style>
	.fixed {
		z-index: 1000; /* Ensure the popup is above other elements */
	}
	.bg-white {
		width: 80%; /* Set a width for the popup */
		max-width: 800px; /* Set a maximum width for the popup */
		height: auto; /* Allow the height to adjust based on content */
		padding: 2rem; /* Increase padding for a bigger look */
	}
	.text-xl {
		font-size: 1.25rem; /* Increase the font size for the message */
	}
	.py-4 {
		padding-top: 1rem; /* Increase padding for the button */
		padding-bottom: 1rem;
	}
	.px-8 {
		padding-left: 2rem;
		padding-right: 2rem;
	}
</style>
