console.log("Starting server...");

require("dotenv").config();
const express = require("express");
const LaunchDarkly = require("launchdarkly-node-server-sdk");

const app = express();
const port = process.env.PORT || 3000;

// Initialize LaunchDarkly client (server-side SDK)
const ldClient = LaunchDarkly.init(process.env.LD_SDK_KEY);

ldClient.on("ready", () => {
  console.log("LaunchDarkly connected ✅");
});

ldClient.on("failed", (err) => {
  console.error("LaunchDarkly failed ❌", err);
});

// Mock product list
const products = ["MacBook Pro", "iPhone", "AirPods", "iPad", "Apple Watch"];

// Simple recommendation algorithm
function simpleRecommendation() {
  return [...products];
}

// Complex recommendation algorithm
function complexRecommendation() {
  return [...products].sort(() => 0.5 - Math.random());
}

// Health check route
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// -----------------------------
// Light Modern Demo Homepage UI
// -----------------------------
app.get("/", (req, res) => {
  res.send(`
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>LaunchDarkly Demo</title>
<style>
:root {
  --bg: #f6f7fb;
  --card: #ffffff;
  --text: #111827;
  --muted: #6b7280;
  --border: #e5e7eb;
  --shadow: 0 10px 30px rgba(17,24,39,0.08);
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  background: var(--bg);
  color: var(--text);
}
.wrap {
  max-width: 960px;
  margin: 0 auto;
  padding: 60px 20px;
}
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  padding: 24px;
}
h1 { margin: 0 0 8px; font-size: 26px; }
p { margin: 0 0 20px; color: var(--muted); }
label { font-size: 12px; color: var(--muted); display:block; margin-bottom:6px; }
input, select {
  width:100%;
  padding:10px;
  border:1px solid var(--border);
  border-radius:12px;
}
button {
  margin-top:14px;
  padding:10px 16px;
  border:none;
  border-radius:12px;
  background:#111827;
  color:white;
  cursor:pointer;
}
button:hover { opacity:.9; }
pre {
  margin-top:20px;
  padding:16px;
  background:#0b1020;
  color:#e8ecff;
  border-radius:12px;
  overflow:auto;
  font-size:13px;
}
.row { display:grid; grid-template-columns:1fr; gap:14px; }
@media (min-width:600px) {
  .row { grid-template-columns:1fr 1fr; }
}
</style>
</head>
<body>
<div class="wrap">
  <div class="card">
    <h1>LaunchDarkly Feature Flag + Experiment Demo</h1>
    <p>Toggle behavior via LaunchDarkly without redeploying the app.</p>

    <div class="row">
      <div>
        <label>User key</label>
        <input id="userKey" value="123" />
      </div>
      <div>
        <label>User type</label>
        <select id="userType">
          <option value="basic">basic</option>
          <option value="premium">premium</option>
        </select>
      </div>
    </div>

    <button onclick="run()">Get recommendations</button>

    <pre id="output">Click the button to load data...</pre>
  </div>
</div>

<script>
async function run() {
  const user = document.getElementById("userKey").value;
  const type = document.getElementById("userType").value;
  const res = await fetch("/recommendations?user=" + user + "&type=" + type);
  const data = await res.json();
  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}
run();
</script>

</body>
</html>
`);
});

// -----------------------------
// Recommendations Endpoint
// -----------------------------
app.get("/recommendations", async (req, res) => {
  const user = {
    key: req.query.user || "anonymous",
    user_type: req.query.type || "basic",
  };

  try {
    await ldClient.waitForInitialization();

    const useComplex = await ldClient.variation(
      "complex-recommendations",
      user,
      false
    );

    const expVariant = await ldClient.variation(
      "rec-count-experiment",
      user,
      "short"
    );

    const normalizedVariant =
      expVariant === "variation 1"
        ? "detailed"
        : expVariant === "variation 0"
        ? "short"
        : expVariant;

    const count = normalizedVariant === "detailed" ? 3 : 2;

    const baseRecommendations = useComplex
      ? complexRecommendation()
      : simpleRecommendation();

    const recommendations = baseRecommendations.slice(0, count);

    ldClient.track("recommendations_viewed", user, {
      algorithm: useComplex ? "complex" : "simple",
      expVariant: normalizedVariant,
      count,
    });

    res.json({
      user,
      algorithm: useComplex ? "Complex" : "Simple",
      expVariant: normalizedVariant,
      recommendations,
    });
  } catch (error) {
    console.error("Error evaluating flags:", error);
    res.status(500).json({ error: "LaunchDarkly evaluation failed" });
  }
}); app.listen(port, () => { 
    console.log(`Server running at http://localhost:${port}`);
 });