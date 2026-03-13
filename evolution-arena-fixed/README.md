# 🧬 Evolution Arena — GenLayer Game

> Build a creature. Survive impossible scenarios. The AI decides who lives.

Built on **GenLayer** — AI consensus that lives permanently on-chain.

---

## 🚀 How to Deploy (3 steps, takes ~10 minutes)

### Step 1 — Deploy the contract

1. Go to **[GenLayer Studio](https://studio.genlayer.com)**
2. Create a new contract
3. Paste everything from `evolution_contract.py`
4. Click **Deploy**
5. Copy the contract address — it looks like `0xABC123...`

---

### Step 2 — Add your contract address

Open `app/page.tsx` in GitHub (or your code editor) and look for **line ~10**:

```ts
const CONTRACT_ADDRESS = "PASTE_YOUR_CONTRACT_ADDRESS_HERE";
```

Replace it with your real address:

```ts
const CONTRACT_ADDRESS = "0xYourAddressHere";
```

Save and commit.

---

### Step 3 — Deploy to Vercel

1. Push this folder to a **new GitHub repository**
2. Go to **[vercel.com](https://vercel.com)** → click **Add New Project**
3. Import your GitHub repository
4. Leave all settings as default — Vercel detects Next.js automatically
5. Click **Deploy** ✅

Your game is live!

---

## 🎮 How the Game Works

| Step | What Happens |
|------|-------------|
| Player 1 clicks **Create Game** | Builds their creature, game is created on-chain |
| Player 1 shares the **Game ID** | Player 2 uses it to join with their own creature |
| AI generates a wild scenario | e.g. "A tsunami of hot sauce is heading toward a floating disco ball..." |
| Both players submit a **survival plan** | How does YOUR creature survive this? Use your traits! |
| **AI Judge decides** | Picks the more creative/entertaining survivor and explains why |
| First to **3 rounds** wins | Full battle history with all verdicts shown |

---

## 💡 Tips for Players

- **Be weird** — the AI rewards creativity, not logic
- **Use your traits** — reference your creature's abilities in your survival plan
- **Your weakness can help** — a funny weakness makes the verdicts more dramatic
- **Keep it short and vivid** — 2-3 sentences hits harder than a wall of text

---

## 📁 File Structure

```
evolution-arena/
├── app/
│   ├── layout.tsx            ← Page title & metadata
│   └── page.tsx              ← ⭐ MAIN GAME FILE (edit CONTRACT_ADDRESS here)
├── public/
│   └── logo/
│       ├── mark.svg          ← GenLayer triangle mark (white)
│       └── logo.svg          ← GenLayer full logo (white)
├── evolution_contract.py     ← GenLayer intelligent contract
├── package.json
├── next.config.js
├── tsconfig.json
└── README.md
```

---

## 🛠 Local Development (optional)

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000)

---

Built for the **GenLayer Playverse Challenge** 🏆  
Powered by GenLayer Intelligent Contracts
