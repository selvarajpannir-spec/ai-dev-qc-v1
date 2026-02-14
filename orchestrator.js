import fs from "fs-extra";
import { execSync } from "child_process";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1"
});

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
  const response = await client.chat.completions.create({
    model: "openai/gpt-3.5-turbo",   // free/cheap via OpenRouter
    temperature: 0,
    messages: [
      {
        role: "user",
        content: `
Create JavaScript file logic.js.
Add click event to #calculate.
Multiply #price and #quantity.
Display result inside #total.
Use parseFloat.
Return ONLY JavaScript code.
`
      }
    ]
  });

  const output = response.choices[0].message.content;
  await fs.writeFile("project/logic.js", output);
}

function runTests() {
  try {
    execSync("npx playwright install --with-deps", { stdio: "inherit" });
    execSync("npx playwright test", { stdio: "inherit" });
    return true;
  } catch {
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
