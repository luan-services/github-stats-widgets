import { Hono } from 'hono'
import { fetchGithubUserData, Bindings } from './lib/fetch-userdata'
import { errorHandler } from './middleware/error-handler';
import { HTTPException } from 'hono/http-exception';

const app = new Hono<{ Bindings: Bindings }>();

app.onError(errorHandler);

app.get('/', (c) => c.text('Hello Cloudflare Workers!'));

app.get('/api', async (c) => {
	const username = c.req.query('username')
	if (!username) { /* must implement an error handler to send json error responses */
		throw new HTTPException(404, { message: 'No username query provided' });
	}
	const data = await fetchGithubUserData(username, c.env);
	return c.json(data); 
})

export default app