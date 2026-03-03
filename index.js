console.log("Starting server...");

require("dotenv").config();
const express = require("express");
const LaunchDarkly = require("launchdarkly-node-server-sdk");

const app = express();
const port = process.env.PORT || 3000;

// LaunchDarkly client (server-side)
const ldClient = LaunchDarkly.init(process.env.LD_SDK_KEY);

ldClient.on("ready", () => {
  console.log("LaunchDarkly connected ✅");
});

ldClient.on("failed", (err) => {
  console.error("LaunchDarkly failed ❌", err);
});

// Mock product list
const products = ["MacBook Pro", "iPhone", "AirPods", "iPad", "Apple Watch"];

// Simple algorithm: static ordering
function simpleRecommendation() {
  return [...products];
}

// Complex algorithm: shuffled ordering
function complexRecommendation() {
  return [...products].sort(() => 0.5 - Math.random());
}

// Health check route
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Demo homepage route
app.get("/", (req, res) => {
  res.send(`
    <h2>LaunchDarkly Feature Flag + Experiment Demo ✅</h2>
    <p>Try:</p>
    <ul>
      <li><a href="/recommendations?user=123&type=basic">/recommendations?user=123&type=basic</a></li>
      <li><a href="/recommendations?user=999&type=premium">/recommendations?user=999&type=premium</a></li>
    </ul>
    <p>Also: <a href="/health">/health</a></p>
  `);
});

// Recommendations endpoint
app.get("/recommendations", async (req, res) => {
  // LaunchDarkly "context" (older SDKs call this "user")
  const user = {
    key: req.query.user || "anonymous",
    user_type: req.query.type || "basic",
  };

  try {
    await ldClient.waitForInitialization();

    // Feature flag: choose algorithm
    const useComplex = await ldClient.variation(
      "complex-recommendations",
      user,
      false
    );

    // Experiment: short vs detailed (2 vs 3 recommendations)
    const expVariant = await ldClient.variation(
      "rec-count-experiment",
      user,
      "short"
    );

    // If LD returns "variation 0/1" for any reason, normalize it
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

    // Track an event (useful for experiment metrics)
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
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});