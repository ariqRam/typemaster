<script>
	import { onMount } from 'svelte';

	import Sentence from './Sentence.svelte';
	let username;
	onMount(() => {
		function getUsernameFromCookie() {
			const cookies = document.cookie.split(';');

			for (const cookie of cookies) {
				const [key, value] = cookie.trim().split('=');
				if (key === 'username') {
					// Replace 'username' with the actual cookie name
					if (value.startsWith('{') && value.endsWith('}')) {
						// Value is an object, parse it
						return JSON.parse(value);
					} else {
						// Value is a simple string
						console.log('value', value);
						return value;
					}
				}
			}

			return null; // Username not found
		}

		username = getUsernameFromCookie();
	});
</script>

<h1>TypeMaster</h1>
<Sentence {username} />
