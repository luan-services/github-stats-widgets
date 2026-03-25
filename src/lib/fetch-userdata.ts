import type { KVNamespace } from '@cloudflare/workers-types'
import { HTTPException } from 'hono/http-exception'
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export type Bindings = {
    GITHUB_TOKEN: string
    GITHUB_CACHE: KVNamespace 
}

export const fetchGithubUserData = async (username: string, env: Bindings) => {
    const key = `github_data:${username.toLowerCase()}`;

    const cache = await env.GITHUB_CACHE.get(key, 'json');

    /* if user data is already cached, return it */
    if (cache) {
        return cache;
    }


    const query = `
        query($username: String!) {
            user(login: $username) {
                followers { totalCount }
                following { totalCount }
                
                contributionsCollection {
                    totalCommitContributions
                    totalPullRequestContributions
                    totalPullRequestReviewContributions
                    totalIssueContributions
                    contributionCalendar {
                        totalContributions
                        weeks {
                            contributionDays {
                                date
                                contributionCount
                            }
                        }
                    }
                }
                    
                repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
                    totalCount
                    nodes {
                        name
                        stargazerCount
                        languages(orderBy: {field: SIZE, direction: DESC}) {
                            edges { 
                                size 
                                node { name color } 
                            }
                        }
                    }
                }
            }
        }
    `

    const response = await fetch('https://api.github.com/graphql', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Hono-Gamified-Badges'
        },
        body: JSON.stringify({ query, variables: { username } })
    })

    if (!response.ok) {
        const error = await response.text();
        throw new HTTPException(response.status as ContentfulStatusCode, {
            message: error || 'GitHub HTTP Error'
        });
    }

    const { data } = await response.json() as any

    if (data.errors) {
        const message = data.errors[0]?.message || 'GitHub GraphQL Error';
        throw new HTTPException(500, { message });
    }

    /* saves on cloudflare KV for 14400s (4 hours) */
    await env.GITHUB_CACHE.put(
        key, 
        JSON.stringify(data), 
        { 
            expirationTtl: 14400
        }
    );

    return data;
}