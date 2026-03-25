import type { KVNamespace } from '@cloudflare/workers-types'

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

    /* must implement an error handler to send json error responses */
    if (!response.ok) {
        throw new Error('Github API Error')
    }

    const { data } = await response.json() as any

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