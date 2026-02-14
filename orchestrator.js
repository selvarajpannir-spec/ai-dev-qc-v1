import fs from "fs-extra";
import { execSync } from "child_process";
import fetch from "node-fetch";

const HF_API_KEY = process.env.HF_API_KEY;

/**
 * Call Hugging Face Router API
 */
async function hfGenerate(prompt) {
  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/deepseek-ai/deepseek-coder-6.7b-instruct",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HF_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          temperature: 0,
          max_new_tokens: 400,
          return_full_text: false
        }
      })
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error("HF API Error:", result);
    throw new Error(result.error || "HF API failed");
  }

  if (!result || !result[0] || !result[0].generated_text) {
    console.error("Unexpected HF response:", result);
    throw new Error("Invalid HF response format");
  }

  return result[0].generated_text.trim();
}

/**
 * Generate static UI (locked)
 */
async function generateUI() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Calculator</title>
</head>
<body>

<input id="price" type="number" />
<input id="quantity" type="number" />
<button id="calculate">Calculate</button>

<div id="total"></div>

<script src="logic.js"></script>

</body>
</html>
`;

  await fs.ensureDir("project");
  await fs.writeFile("project/index.html", html);
}

/**
 * Generate logic.js using HF
 */
async function generateLogic() {
  const prompt = `
Create a JavaScript file named logic.js.

Requirements:
- Add click event listener to element with id "calculate"
- Multiply values from #price and #quantity
- Display result inside element #total
- Use parseFloat for numbers
- No explanation
- Return ONLY JavaScript code
`;

  const output = await hfGenerate(prompt);
  await fs.writeFile("project/logic.js", output);
}

/**
 * Run Playwright test
 */
function runTests() {
  try {
    execSync("npx playwright install --with-deps", { stdio: "inherit" });
    execSync("npx playwright test", { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error("Test execution failed.");
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log("Generating UI...");
  await generateUI();

  console.log("Generating logic.js...");
  await generateLogic();

  console.log("Running tests...");
  const success = runTests();

  if (!success) {
    console.log("Tests failed.");
  } else {
    console.log("All tests passed successfully.");
  }
}

main();main();
