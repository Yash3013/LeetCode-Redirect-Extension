let problemData = null;

document.addEventListener("DOMContentLoaded", async function () {
  const inputField = document.getElementById("problemNumber");
  const goButton = document.getElementById("goButton");
  const potdButton = document.getElementById("potdButton");

  inputField.focus();

  async function fetchProblemData() {
    try {
      const response = await fetch("https://leetcode.com/api/problems/all/");
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format: Not JSON");
      }

      const data = await response.json();
      return data.stat_status_pairs;
    } catch (error) {
      console.error("Error fetching problem data:", error);
      alert("Failed to retrieve problem data. Try again later.");
      return null;
    }
  }

  problemData = await fetchProblemData();

  async function redirectToProblem() {
    let problemNumber = inputField.value.trim();
    if (problemNumber) {
      let problems = problemData;
      if (!problems) {
        problems = await fetchProblemData();
      }
      if (!problems) return;

      let problem = problems.find(p => p.stat.frontend_question_id === parseInt(problemNumber));
      if (problem) {
        let problemSlug = problem.stat.question__title_slug;
        let today = new Date().toISOString().split("T")[0];
        let url = `https://leetcode.com/problems/${problemSlug}/?envType=daily-question&envId=${today}`;
        chrome.tabs.create({ url: url });
      } else {
        alert("Problem not found. Please enter a valid problem number.");
      }
    }
  }

  goButton.addEventListener("click", redirectToProblem);
  inputField.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      redirectToProblem();
    }
  });

  potdButton.addEventListener("click", async function () {
    let today = new Date().toISOString().split("T")[0];
    try {
      const graphqlQuery = {
        query: `query questionOfToday {
          activeDailyCodingChallengeQuestion {
            question {
              titleSlug
            }
          }
        }`
      };

      const dailyResponse = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Referer": "https://leetcode.com",
          "Origin": "https://leetcode.com",
          "User-Agent": navigator.userAgent
        },
        body: JSON.stringify(graphqlQuery)
      });

      if (!dailyResponse.ok) {
        throw new Error(`HTTP error! Status: ${dailyResponse.status}`);
      }

      const contentType = dailyResponse.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Invalid response format: Not JSON");
      }

      const dailyData = await dailyResponse.json();

      if (
        dailyData?.data?.activeDailyCodingChallengeQuestion?.question?.titleSlug
      ) {
        let problemSlug = dailyData.data.activeDailyCodingChallengeQuestion.question.titleSlug;
        let url = `https://leetcode.com/problems/${problemSlug}/description/?envType=daily-question&envId=${today}`;
        chrome.tabs.create({ url: url });
      } else {
        throw new Error("Daily challenge data not found");
      }
    } catch (error) {
      console.error("Error fetching daily challenge:", error);
      alert("Failed to retrieve the daily challenge. Try again later.");
    }
  });
});
