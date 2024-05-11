import { json } from '@sveltejs/kit';
import { supabase } from "$lib/supabaseClient.js";

async function getUser(username) {
	const { data } = await supabase.from("users").select().eq('name', username);
	return data;
}


export async function POST({ request }) {
	const { username } = await request.json();

	const user = await getUser(username);
	if (user.length === 0) {
		console.log("Creating user..")
		const { data, error } = await supabase
			.from('users')
			.insert([{ name: username }])
			.select();
		console.log(data, error);
		return json(data);
	}
	return json(user);
}
