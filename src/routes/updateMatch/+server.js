import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabaseClient.js';

async function updateMatch(matchId) {
	try {
		const { data, error } = await supabase
			.from('matches')
			.update({ status: 'ready' })
			.eq('id', matchId)
			.select();


		if (error) {
			console.error('Error updating match:', error);
			return null;
		} else {
			console.log('Match updated successfully (updateMatch):', data);
			return data;
		}
	} catch (err) {
		console.error('Unexpected error:', err);
		return null;
	}
}

export async function POST({ request }) {
	const { matchId } = await request.json();

	const match = await updateMatch(matchId);
	return json({ status: 200 });
}
