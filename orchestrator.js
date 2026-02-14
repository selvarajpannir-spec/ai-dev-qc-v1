import fs from "fs-extra";
import { execSync } from "child_process";
import fetch from "node-fetch";

const HF_API_KEY = process.env.HF_API_KEY;

async function hfGenerate(prompt) {
  const response = await fetch(
    "https://api-inference.huggingface.co/models/deepseek-ai/deepseek-coder-6.7b-instruct",
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
          max_new_tokens: 400
        }
      })
    }
  );

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error);
  }

  return result[0].generated_text;
}

async function generateUI() {
  const html = `
<!DOCTYPE html>
<html>
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

async function generateLogic() {
  const prompt = `
Create JavaScript logic.js file.
Add click event on #calculate.
Multiply #price * #quantity.
Set result to #total.
Return only JavaScript code.
`;

  const output = await hfGenerate(prompt);
  await fs.writeFile("project/logic.js", output);
}

function runTests() {
  try {
    execSync("npx playwright install --with-deps", { stdio: "inherit" });
    execSync("npx playwright test", { stdio: "inherit" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await generateUI();
  await generateLogic();

  const success = runTests();

  if (!success) {
    console.log("Test failed.");
  } else {
    console.log("All tests passed.");
  }
}

main();
