/**
 * Fetch LeetCode profile data using GraphQL
 */
export const fetchLeetCodeProfile = async (username) => {
    const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          reputation
        }
        submitStats {
          acSubmissionNum {
            difficulty
            count
          }
        }
        tagProblemCounts {
          advanced {
            tagName
            problemsSolved
          }
          intermediate {
            tagName
            problemsSolved
          }
          fundamental {
            tagName
            problemsSolved
          }
        }
      }
    }`;

    try {
        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com'
            },
            body: JSON.stringify({ query, variables: { username } })
        });
        const result = await response.json();
        if (result.errors) {
            console.error("LeetCode API errors:", result.errors);
            return null;
        }
        if (!result.data || !result.data.matchedUser) {
            console.warn("Profile not found or private:", username);
            return null;
        }
        return result.data.matchedUser;
    } catch (err) {
        console.error("Fetch LeetCode data failed:", err);
        return null;
    }
};
