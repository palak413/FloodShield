# 🎤 FloodShield — 3-Minute Hackathon Demonstration Script

This script is structured for an impactful, high-energy 3-minute presentation for hackathon judges in the **Heat & Water** track.

---

### **0:00 – 0:20 | The Problem (Monsoon Paralysis in Mumbai)**
> *"Good morning judges. Every July, Mumbai grinds to a halt under monsoon waterlogging. But here is the critical insight: weather forecasts only tell citizens that it will rain 40 millimeters today. They don't tell a commuter that Milan Subway is about to become a vehicular submarine, or tell a resident near the Mithi River that the Arabian Sea high tide just forced the BMC floodgates shut.*
> 
> *Our product principle is: **'Don't just show people the weather. Help them understand localized risk and decide what to do next.'** This is FloodShield."*

---

### **0:20 – 0:50 | Geographic Console & Baseline Assessment**
*(Action: Click on the interactive map on 'Milan Subway, Santacruz' or select it from the header dropdown)*

> *"Here on the FloodShield console, we have modeled 8 grounded vulnerability hotspots across the Mumbai Metropolitan Region using real coordinates, elevation data, and municipal ward profiles.*
> 
> *Notice Milan Subway: It has a depression index of 10 out of 10—a classic saucer underpass. Under a baseline monsoon shower of 25 mm/h, it registers a Moderate Risk score of 48 out of 100. Our risk panel breaks down exactly why: Topographical saucer depth contributes 21 points, while precipitation load contributes 14 points. Notice our 3 clear, context-specific recommendations: avoid underpass transit, inspect depth markers, and buffer commute times."*

---

### **0:50 – 1:35 | Signature Feature: Storm Simulator**
*(Action: Click 'Storm Simulator' tab in header, then click preset 'Severe Cloudburst' [85 mm/h, Spring High Tide, Degraded Drainage])*

> *"Now, let's test our signature feature: the Storm Simulator. This is a fully interactive, deterministic engine.*
> 
> *Suppose a sudden convective cloudburst strikes western Mumbai at 85 mm per hour, lasting 4 hours, and synchronizing with an Arabian Sea Spring High Tide above 4.5 meters.*
> 
> *Watch what happens in real time: The side-by-side impact matrix shows an immediate escalation of **+43 Risk Points**, jumping from 48 to **91 out of 100 — High Risk**.*
> 
> *Our engine clearly explains the mechanics: precipitation volume has blown past the BMC design threshold of 25–50 mm/h, and the tidal lock shuts outfall gates, trapping runoff within the underpass."*

---

### **1:35 – 2:00 | Actionable Precautionary Guidance & Trust**
*(Action: Scroll down to view the 3 updated recommendations and ethical disclaimer)*

> *"Notice how the recommendations instantly adapt:
> 1. 'AVOID LOW-LYING UNDERPASS TRANSIT: Underpasses accumulate localized runoff rapidly; delay transit and heed official Mumbai Traffic Police advisories.'
> 2. 'VEHICLE PRESERVATION: Relocate parked vehicles to upper podium decks immediately.'
> 3. 'TIDAL PEAK ADVISORY: Outfall gates closed during high tide; expect peak water stagnation for the next 2-3 hours.'
> 
> And critically, as an environmental intelligence product, we maintain total honesty: we explicitly badge this as a deterministic heuristic model, never falsely claiming to be an unverified live hydrodynamic sensor."*

---

### **2:00 – 2:25 | AWS Serverless Architecture & Live Verification**
*(Action: Click 'AWS Inspector' in header, point out the architecture diagram, click 'Verify')*

> *"Under the hood, FloodShield is powered by an AWS Serverless architecture designed in `ap-south-1` Mumbai.*
> 
> *The React frontend talks to an Amazon API Gateway HTTP API that invokes an AWS Lambda function running on Node.js 22 arm64 Graviton.*
> 
> *When we trigger the verification test right here in the console, you can see the real HTTP POST request to `/assess` returning HTTP 200 OK in under 20 milliseconds, providing full input factor validation, transparent scoring, and execution provenance."*

---

### **2:25 – 3:00 | Project Limitations, User Impact & Intended Environmental Value**
> *"In summary, FloodShield bridges the fatal gap between macro meteorological forecasts and hyper-local survival decisions during urban monsoons.*
> 
> *Our project is intentionally transparent about its limitations: It is a scenario vulnerability tool based on municipal engineering benchmarks, not a hydrodynamic telemetry sensor. It helps citizens and logistics managers make informed timing decisions before entering low-lying saucer bottlenecks.*
> 
> *FloodShield transforms unpredictable monsoon chaos into clear, proactive, and resilient urban intelligence. Thank you, and we'd love to take your questions."*
