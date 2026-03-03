LAUNCHDARKLY FEATURE FLAG + EXPERIMENT DEMO
Mahassin Abdallah
PROJECT OVERVIEW
This project is a minimal Node.js and Express backend demonstrating server-side feature flag evaluation and experimentation using the LaunchDarkly SDK.
The application simulates a recommendation engine whose behavior can be dynamically controlled through LaunchDarkly — without redeploying the application.

The demo includes:
• Server-side LaunchDarkly SDK integration
• Feature flag–controlled backend logic
• Multivariate experimentation
• Targeted rollouts
• Event tracking for experiment analysis
• Clean interactive demo UI

FEATURE FLAGS
Feature Flag: complex-recommendations
This flag toggles between two recommendation algorithms:
• False → Simple static ordering
• True → Complex shuffled ordering
This demonstrates how backend behavior can be safely changed without modifying or redeploying code.

EXPERIMENT
Experiment Flag: rec-count-experiment
This multivariate flag controls how many recommendations a user receives:
• Short → 2 recommendations
• Detailed → 3 recommendations
Users are deterministically bucketed based on their key, enabling consistent A/B testing.

TARGETING
The application supports targeted rollouts based on user key or attributes.
This allows specific users or user segments to receive different flag variations without affecting the entire user base.
EVENT TRACKING
The application emits a custom event:
recommendations_viewed
This enables experiment analysis within LaunchDarkly, including measuring engagement by variation and algorithm type.
TECHNOLOGY STACK
• Node.js
• Express.js
• LaunchDarkly Node Server SDK
• dotenv

HOW TO RUN LOCALLY
Clone the repository
Install dependencies using npm install
Create a .env file containing your LaunchDarkly Server-Side SDK key
Run the server using npm start
Open http://localhost:3000 in your browser

PURPOSE
This demo showcases how feature flags and experimentation can:
• Safely control backend behavior
• Enable targeted rollouts
• Support controlled A/B testing
• Reduce deployment risk
• Improve release confidence
All without redeploying the application.