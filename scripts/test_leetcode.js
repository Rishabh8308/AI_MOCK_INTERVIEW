async function testLeetCodeRequest() {
    const username = "rishabh_dob_";
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
          advanced { tagName problemsSolved }
          intermediate { tagName problemsSolved }
          fundamental { tagName problemsSolved }
        }
      }
    }`;

    try {
        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, variables: { username } })
        });
        const result = await response.json();
        console.log(JSON.stringify(result, null, 2));
    } catch (err) {
        console.error("Error:", err);
    }
}

testLeetCodeRequest();
