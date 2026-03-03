console.log("Starting server...");

require("dotenv").config();
const express = require("express");
const LaunchDarkly = require("launchdarkly-node-server-sdk");

const app = express();
const port = 3000;

// Initialize LaunchDarkly client
const ldClient = LaunchDarkly.init(process.env.LD_SDK_KEY);

// Log when connected
ldClient.on("ready", () => {
  console.log("LaunchDarkly connected ✅");
});

ldClient.on("failed", (err) => {
  console.error("LaunchDarkly failed ❌", err);
});

// Mock product list
const products = [
  "MacBook Pro",
  "iPhone",
  "AirPods",
  "iPad",
  "Apple Watch",
];

// Simple recommendation algorithm
function simpleRecommendation() {
  return products.slice(0, 2);
}

// Complex recommendation algorithm
function complexRecommendation() {
  const shuffled = [...products].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, 3);
}

// Health check route
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// Main recommendations endpoint
app.get("/recommendations", async (req, res) => {
  const user = {
    key: req.query.user || "anonymous",
    user_type: req.query.type || "basic",
  };

  try {
    await ldClient.waitForInitialization();

    // Feature flag: choose recommendation algorithm
    const useComplex = await ldClient.variation(
      "complex-recommendations",
      user,
      false
    );

    // Experiment flag: choose short vs detailed recommendation count
    const expVariant = await ldClient.variation(
      "rec-count-experiment",
      user,
      "short"
    );

    const count = expVariant === "detailed" ? 3 : 2;

    const baseRecommendations = useComplex
      ? complexRecommendation()
      : simpleRecommendation();

    const recommendations = baseRecommendations.slice(0, count);

    // Track event for experiment analytics
    ldClient.track("recommendations_viewed", user, {
      algorithm: useComplex ? "complex" : "simple",
      expVariant,
      count,
    });

    res.json({
      user,
      algorithm: useComplex ? "Complex" : "Simple",
      expVariant,
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