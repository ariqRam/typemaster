/** @type {import('./$types').LayoutServerLoad} */
export async function load({ cookies }) {
	const matchId = cookies.get('matchId');

	return {
		matchId
	};
}