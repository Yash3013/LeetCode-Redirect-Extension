let problemData = null;

document.addEventListener("DOMContentLoaded", async function () {
  const inputField = document.getElementById("problemNumber");
  const goButton = document.getElementById("goButton");
  const potdButton = document.getElementById("potdButton");

  inputField.focus();

  async function fetchProblemData() {
    try {
      const response = await fetch("https://leetcode.com/api/problems/all/");
      const data = await response.json();
      return data.stat_status_pairs;
    } catch (error) {
      console.error("Error preloading problem data:", error);
      return null;
    }
  }

  problemData = await fetchProblemData();

  async function redirectToProblem() {
    let problemNumber = inputField.value.trim();
    if (problemNumber) {
      try {
        let problems = problemData || await fetchProblemData();
        if (!problems) {
          alert("Failed to retrieve problem data. Try again later.");
          return;
        }
        let problem = problems.find(p => p.stat.frontend_question_id === parseInt(problemNumber));
        if (problem) {
          let problemSlug = problem.stat.question__title_slug;
          let today = new Date().toISOString().split("T")[0];
          let url = `https://leetcode.com/problems/${problemSlug}/?envType=daily-question&envId=${today}`;
          chrome.tabs.create({ url: url });
        } else {
          alert("Problem not found. Please enter a valid problem number.");
        }
      } catch (error) {
        console.error("Error fetching problem data:", error);
        alert("Failed to retrieve problem details. Try again later.");
      }
    }
  }

  goButton.addEventListener("click", redirectToProblem);
  inputField.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      redirectToProblem();
    }
  });

  potdButton.addEventListener("click", async function (event) {
    event.preventDefault();
    potdButton.disabled = true;
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
          "Referer": "https://leetcode.com"
        },
        body: JSON.stringify(graphqlQuery)
      });
      
      const dailyData = await dailyResponse.json();
      
      if (
        dailyData &&
        dailyData.data &&
        dailyData.data.activeDailyCodingChallengeQuestion &&
        dailyData.data.activeDailyCodingChallengeQuestion.question &&
        dailyData.data.activeDailyCodingChallengeQuestion.question.titleSlug
      ) {
        let problemSlug = dailyData.data.activeDailyCodingChallengeQuestion.question.titleSlug;
        let url = `https://leetcode.com/problems/${problemSlug}/description/?envType=daily-question&envId=${today}`;
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          if (tabs.length > 0) {
            chrome.tabs.update(tabs[0].id, {url: url});
          }
        });
      } else {
        console.error("Daily challenge data not found:", dailyData);
        alert("Failed to retrieve the daily challenge. Try again later.");
      }
    } catch (error) {
      console.error("Error fetching daily challenge:", error);
      alert("Failed to retrieve the daily challenge. Try again later.");
    } finally {
      potdButton.disabled = false;
    }
  });
});
