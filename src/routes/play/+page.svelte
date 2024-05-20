<script>
	import { onMount } from 'svelte';

	import Sentence from './Sentence.svelte';
	let username;
	let matchId;
	onMount(() => {
		function getCookies() {
			const cookies = document.cookie.split(';');

			const selectCookies = {};
			for (const cookie of cookies) {
				const [key, value] = cookie.trim().split('=');
				if (key === 'username') {
					// Replace 'username' with the actual cookie name
					if (value.startsWith('{') && value.endsWith('}')) {
						// Value is an object, parse it
						selectCookies[key] = JSON.parse(value);
					} else {
						// Value is a simple string
						console.log('value', value);
						selectCookies[key] = value;
					}
				} else if (key === 'matchId') {
					selectCookies[key] = value;
				}
			}

			console.log('selectCookies', selectCookies);
			return selectCookies;
		}

		({ username, matchId } = getCookies());
	});
</script>

<h1>TypeMaster</h1>
<h2>{matchId}</h2>
<Sentence {username} />
