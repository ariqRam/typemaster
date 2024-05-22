import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';
import { randomInt } from 'crypto';

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

async function getOpenMatch() {
	const { data, error } = await supabase
		.from('matches')
		.select()
		.order('created_at', { ascending: false })
		.is('player2', null)
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

async function createRound(matchId) {
	try {
		const qid = randomInt(3) + 1;
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

	const matchData = await getOpenMatch();

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

		const roundData = await createRound(matchData.id);

		return json({ user, match: updatedMatch, player: 2, status: 200 });
	}
}
