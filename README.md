Spotted. 

A Rumour Containment Simulator

Spotted. is a simulation-based platform that models how misinformation propagates through social networks and investigates how strategic interventions can reduce its spread.

Inspired by the intrigue of anonymous gossip and interconnected social circles, Spotted. brings together **social network analysis, probabilistic simulation, and intervention optimization** to explore an important question:

**When resources are limited, which users should we intervene on to contain a rumour most effectively?**

Rather than assuming that the most connected users are always the best intervention targets, Spotted. evaluates multiple strategies across repeated simulation runs and compares their effectiveness using measurable results.

Key Features

* **Synthetic Social Network Generation:** Generate networks of connected users for controlled experiments.
* **Rumour Propagation Simulation:** Model how information spreads between connected users over discrete time steps.
* **Limited Intervention Budget:** Select a fixed number of users to intervene on and prevent them from spreading the rumour.
* **Baseline Strategy Comparison:** Compare random selection and highest-degree selection against a proposed optimization strategy.
* **Greedy Intervention Optimization:** Iteratively select users based on their estimated marginal contribution to reducing the spread, recalculating their value after every selection.
* **Repeated Simulations:** Run multiple trials to account for randomness in propagation.
* **Visual Network Exploration:** View the network and distinguish between unaware, spreading, and contained users.
* **Performance Metrics:** Compare average final reach, percentage reduction, variation across runs, and execution time.
* **Before-and-After Analysis:** Compare rumour propagation with no intervention and with different intervention strategies.

Problem Statement

Misinformation can spread rapidly through interconnected social networks. However, identifying the most effective points for intervention is challenging, especially when only a limited number of users can be targeted.

A highly connected user may not always be the most effective intervention point. The value of intervening on one user can also change after other users have already been selected.

Spotted. addresses this challenge by simulating rumour propagation, evaluating competing intervention strategies, and measuring their effectiveness over repeated trials.

How It Works

1. **Generate a network:** Create a synthetic social network consisting of users and connections.
2. **Introduce a rumour:** Select an initial source user who starts spreading the information.
3. **Simulate propagation:** Model the spread through connected users according to a configurable sharing probability.
4. **Apply interventions:** Select users according to a chosen strategy and prevent the selected users from spreading the rumour.
5. **Repeat the experiment:** Run multiple trials to account for variations in spreading behaviour.
6. **Compare strategies:** Evaluate the results against a no-intervention scenario and simple baselines.
7. **Visualize the outcome:** Present the network, spread progression, and performance metrics through the dashboard.

Intervention Strategies

| Strategy                 | Description                                                                                                    |
| ------------------------ | -------------------------------------------------------------------------------------------------------------- |
| No Intervention          | Establishes the baseline spread without any intervention.                                                      |
| Random Selection         | Selects users randomly within the available intervention budget.                                               |
| Highest-Degree Selection | Prioritizes users with the largest number of direct connections.                                               |
| Greedy Optimization      | Selects the user with the greatest estimated marginal reduction in spread, recalculating after each selection. |

The greedy strategy accounts for the fact that intervention targets can overlap in their influence. Selecting one user may reduce the additional benefit of selecting another user in the same part of the network.

Evaluation Metrics

Spotted. evaluates intervention strategies using:

* **Average Final Reach:** Average number of users exposed to the rumour across simulation runs.
* **Spread Reduction (%):** Percentage reduction in average reach relative to the no-intervention baseline.
* **Run-to-Run Variation:** Standard deviation of final reach across repeated trials.
* **Intervention Budget:** Number of users selected for intervention.
* **Execution Time:** Time taken to evaluate a strategy.

The spread reduction is calculated as:

$$
\text{Reduction (\%)} =
\frac{E_0-E_s}{E_0}\times100
$$

Here, \(E_0\) is the average final reach without intervention, and \(E_s\) is the average final reach under a particular strategy.

Actual experimental results will be reported by the application; no strategy is assumed to be the winner in advance.

Technology Stack

| Component             | Technology              |
| --------------------- | ----------------------- |
| Frontend              | React, TypeScript, Vite |
| Styling               | Tailwind CSS            |
| Network Visualization | Cytoscape.js            |
| Charts                | Recharts                |
| Backend               | Python, FastAPI         |
| Graph Analysis        | NetworkX                |
| Numerical Operations  | NumPy                   |
| Version Control       | Git and GitHub          |

Project Structure

```text
spotted/
├── backend/
│   ├── main.py
│   ├── schemas.py
│   ├── network_generator.py
│   ├── spread_simulator.py
│   ├── strategies.py
│   ├── experiments.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── NetworkGraph.tsx
│   │   │   ├── MetricsCards.tsx
│   │   │   ├── SpreadChart.tsx
│   │   │   └── StrategyComparison.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── package.json
│
└── README.md
```
Prerequisites

* Python 3.10 or later
* Node.js and npm
* Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
cd YOUR_REPOSITORY
```

Replace the repository URL with the actual GitHub URL.

### 2. Set up the backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The backend will run at `http://localhost:8000`.

Interactive API documentation, when enabled, is available at `http://localhost:8000/docs`.

### 3. Set up the frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite, usually `http://localhost:5173`.

### Windows note

For Windows Command Prompt, activate the virtual environment using:

```bat
.venv\Scripts\activate
```

Run the backend and frontend in separate terminals.

Experimental Approach

To ensure meaningful comparisons, strategies should be evaluated on the same underlying network with comparable source-user selections and reproducible trial seeds wherever practical.

Each strategy must respect the same intervention budget. Results should be aggregated across multiple simulation runs instead of relying on a single outcome.

The project investigates the following challenges:

* Are the most-connected users always the best intervention targets?
* How much does random variation affect the outcome?
* How does intervention budget influence containment?
* How does selecting one user change the marginal value of other candidates?
* Does the proposed strategy consistently outperform simple baselines, and at what computational cost?

Potential Applications

* Studying misinformation propagation in synthetic social networks.
* Exploring network-based containment strategies.
* Comparing intervention policies under resource constraints.
* Demonstrating how network structure affects information diffusion.
* Supporting educational experiments in graph algorithms and simulation.

Scope: Spotted. is an experimental simulator, not a real-world misinformation detector. It does not verify claims, identify actual misinformation, or connect to real social-media accounts.

Team

Built by a two-member team as a hackathon project.

* **Member 1:** Network generation, propagation simulation, optimization algorithms, and backend.
* **Member 2:** Frontend dashboard, interactive network visualization, charts, and user experience.

Future Improvements

* Support additional network structures and community configurations.
* Explore alternative propagation models and intervention mechanisms.
* Evaluate larger networks and optimize simulation performance.
* Add interactive, step-by-step playback of rumour propagation.
* Investigate additional intervention strategies and robustness tests.


