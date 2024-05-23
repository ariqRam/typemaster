<script>
	export let message;
	export let show = false;

	function closePopup() {
		show = false;
	}
</script>

{#if show}
	<div class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
		<div class="bg-white p-8 rounded shadow-md text-center">
			<p class="mb-4">{message}</p>
			<button class="bg-blue-500 text-white py-2 px-4 rounded" on:click={closePopup}>
				Close
			</button>
		</div>
	</div>
{/if}

<style>
	.fixed {
		z-index: 1000; /* Ensure the popup is above other elements */
	}
</style>
