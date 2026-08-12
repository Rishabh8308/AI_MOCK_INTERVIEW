import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN // Optional: for higher rate limits
});

/**
 * Fetches GitHub profile and top repositories for a given username.
 */
export const fetchGitHubProfile = async (username) => {
    try {
        // Fetch user profile
        const { data: user } = await octokit.users.getByUsername({ username });
        
        // Fetch repositories (top 10 by stars)
        const { data: repos } = await octokit.repos.listForUser({
            username,
            sort: 'stars',
            per_page: 10
        });
        
        // Simplify repository data for AI context
        const repoSummary = repos.map(repo => ({
            name: repo.name,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            topics: repo.topics || []
        }));

        return {
            profile: {
                username: user.login,
                name: user.name,
                bio: user.bio,
                avatarUrl: user.avatar_url,
                publicRepos: user.public_repos
            },
            repositories: repoSummary
        };
    } catch (error) {
        console.error(`GitHub API Error for ${username}:`, error.message);
        throw new Error(`Could not fetch GitHub profile: ${error.message}`);
    }
};
