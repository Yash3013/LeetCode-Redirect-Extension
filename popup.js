let problemData = null;

document.addEventListener("DOMContentLoaded", async function () {
  const inputField = document.getElementById("problemNumber");
  const goButton = document.getElementById("goButton");
  const potdButton = document.getElementById("potdButton");

  inputField.focus(); 

  try {
    const response = await fetch("https://leetcode.com/api/problems/all/");
    const data = await response.json();
    problemData = data.stat_status_pairs;
  } catch (error) {
    console.error("Error preloading problem data:", error);
  }

  async function redirectToProblem() {
    let problemNumber = inputField.value.trim();
    if (problemNumber) {
      try {
        let problems = problemData;
        if (!problems) {
          const response = await fetch("https://leetcode.com/api/problems/all/");
          const data = await response.json();
          problems = data.stat_status_pairs;
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

  potdButton.addEventListener("click", function () {
    chrome.tabs.create({ url: "https://leetcode.com/problem-of-the-day/" });
  });
});
