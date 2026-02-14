import fs from "fs-extra";
import { execSync } from "child_process";
import fetch from "node-fetch";

const HF_API_KEY = process.env.HF_API_KEY;

async function hfGenerate(prompt) {
  const response = await fetch(
    "https://router.huggingface.co/hf-inference/models/codellama/CodeLlama-7b-Instruct-hf",
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

  const text = await response.text();

  if (!response.ok) {
    console.error("HF ERROR:", text);
    throw new Error("HF request failed");
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch (err) {
    console.error("Invalid JSON response:", text);
    throw err;
  }

  if (!result[0] || !result[0].generated_text) {
    console.error("Unexpected HF format:", result);
    throw new Error("Invalid HF format");
  }

  return result[0].generated_text.trim();
}

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

async function generateLogic() {
  const prompt = `
Create JavaScript file logic.js.
Add click event to #calculate.
Multiply #price and #quantity.
Display result inside #total.
Use parseFloat.
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
  } catch (error) {
    console.error("Test execution failed.");
    return false;
  }
}

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

main();
