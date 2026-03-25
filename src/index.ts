import { Hono } from 'hono'
import { fetchGithubUserData, Bindings } from './lib/fetch-userdata'

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => c.text('Hello Cloudflare Workers!'));

app.get('/api', async (c) => {
	const username = c.req.query('username')

	if (!username) { /* must implement an error handler to send json error responses */
		throw new Error('No username query provided');
	}

	try {
		const data = await fetchGithubUserData(username, c.env);
		return c.json(data); 
	} catch (error) { /* must implement an error handler to send json error responses */
		throw new Error('Unknown Error');
	}
})

export default app