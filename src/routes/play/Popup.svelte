<script>
	export let message;
	export let show = false;

	function closePopup() {
		show = false;
	}
</script>

{#if show}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
		<div class="bg-white p-16 rounded shadow-md text-center max-w-2xl w-full">
			<p class="mb-8 text-xl">{message}</p>
			<button class="bg-blue-500 text-white py-4 px-8 rounded" on:click={closePopup}>
				Close
			</button>
		</div>
	</div>
{/if}

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
