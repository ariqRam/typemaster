import { json } from '@sveltejs/kit';
// import { supabase } from '/vercel/path0/src/lib/supabaseClient.js';
import { supabase } from '$lib/supabaseClient.js';



function getRandomScrambledArray() {
	// Create an array with numbers from 1 to 20
	const array = Array.from({ length: 20 }, (_, i) => i + 1);

	// Shuffle the array using Fisher-Yates algorithm
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]]; // Swap elements
	}

	// Return the first 5 elements from the shuffled array
	return array.slice(0, 5);
}

async function getUser(username) {
	const { data, error } = await supabase
		.from('users')
		.select()
		.eq('name', username);

	if (error) {
		console.error('Error fetching user:', error);
		return null;
	}
	return data;
}

async function getOpenMatch(playerId) {
	const { data, error } = await supabase
		.from('matches')
		.select()
		.order('created_at', { ascending: false })
		.is('player2', null)
		.neq('player1', playerId)
		.limit(1);

	if (error) {
		console.error('Error fetching open match:', error);
		return null;
	}
	return data[0];
}

async function createMatch(userId) {
	try {
		const { data, error } = await supabase
			.from('matches')
			.insert([{ player1: userId }])
			.select();

		if (error) {
			console.error('Error creating match:', error);
			return null;
		} else {
			console.log('Match created successfully:', data);
			return data;
		}
	} catch (err) {
		console.error('Unexpected error:', err);
		return null;
	}
}

async function createRound(matchId, qid) {
	try {
		console.log("qid", qid);
		const { data, error } = await supabase
			.from('rounds')
			.insert([{ match: matchId, qid }])
			.select();

		if (error) {
			console.error('Error creating round:', error);
			return null;
		} else {
			console.log('Round created successfully:', data);
			return data;
		}
	}
	catch (err) {
		console.error('Unexpected createRound error:', err);
		return null
	}
}

async function updateMatchWithPlayer2(matchId, userId) {
	try {
		const { data, error } = await supabase
			.from('matches')
			.update({ player2: userId })
			.eq('id', matchId)
			.select();
		console.log(data, error);

		if (error) {
			console.error('Error updating match:', error);
			return null;
		} else {
			console.log('Match updated successfully(login):', data);
			return data;
		}
	} catch (err) {
		console.error('Unexpected error:', err);
		return null;
	}
}

export async function POST({ request }) {
	const { username } = await request.json();

	let user = await getUser(username);
	if (!user || user.length === 0) {
		console.log('Creating user...');
		const { data, error } = await supabase
			.from('users')
			.insert([{ name: username }])
			.select();

		if (error) {
			console.error('Error creating user:', error);
			return json({ error, status: 500 });
		}

		user = data;
		console.log('userdata', user);
	}

	const matchData = await getOpenMatch(user[0].id);

	if (!matchData) {
		const newMatch = await createMatch(user[0].id);
		if (!newMatch) {
			return json({ error: 'Error creating match', status: 500 });
		}
		return json({ user, match: newMatch, player: 1, status: 200 });
	}
	else { // if player 2
		console.log("Match found", matchData);
		const updatedMatch = await updateMatchWithPlayer2(matchData.id, user[0].id);

		if (!updatedMatch) {
			return json({ error: 'Error updating match', status: 500 });
		}
		const qids = getRandomScrambledArray();
		// create round
		for (let i = 0; i < 5; i++) {
			const roundData = await createRound(matchData.id, qids[i]);
		}

		return json({ user, match: updatedMatch, player: 2, status: 200 });
	}
}
