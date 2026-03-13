# v0.1.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

# Correction (AI_Town): import gl this way
import genlayer.gl as gl
# Correction (AI_Town): TreeMap and u256 imported separately
from genlayer import TreeMap, u256
import json

WINS_NEEDED = 3


class EvolutionArena(gl.Contract):

    game_count: u256
    games: TreeMap[u256, str]

    def __init__(self):
        self.game_count = u256(0)

    # ── CREATE GAME ──────────────────────────────────────────────────────────
    @gl.public.write
    def create_game(
        self,
        player_name: str,
        creature_name: str,
        creature_traits: str,
        creature_ability: str,
        creature_weakness: str,
    ) -> None:
        game_id = int(self.game_count) + 1
        self.game_count = u256(game_id)

        creature = {
            "name": creature_name,
            "traits": creature_traits,
            "ability": creature_ability,
            "weakness": creature_weakness,
        }

        state = {
            "game_id": game_id,
            "status": "waiting",
            "players": [player_name],
            "creatures": {player_name: creature},
            "scores": {player_name: 0},
            "current_round": 1,
            "current_scenario": None,
            "tactics": {},
            "round_winner": None,
            "round_verdict": None,
            "game_winner": None,
            "history": [],
        }
        self.games[u256(game_id)] = json.dumps(state)

    # ── JOIN GAME ─────────────────────────────────────────────────────────────
    @gl.public.write
    def join_game(
        self,
        game_id: int,
        player_name: str,
        creature_name: str,
        creature_traits: str,
        creature_ability: str,
        creature_weakness: str,
    ) -> None:
        key = u256(game_id)
        if key not in self.games:
            return
        state = json.loads(self.games[key])

        if state["status"] != "waiting":
            return
        if len(state["players"]) >= 2:
            return
        if player_name in state["players"]:
            return

        creature = {
            "name": creature_name,
            "traits": creature_traits,
            "ability": creature_ability,
            "weakness": creature_weakness,
        }

        state["players"].append(player_name)
        state["creatures"][player_name] = creature
        state["scores"][player_name] = 0

        # Generate the first scenario now that both creatures exist
        p1 = state["players"][0]
        p2 = state["players"][1]
        c1 = state["creatures"][p1]
        c2 = state["creatures"][p2]

        def generate_scenario():
            return gl.nondet.exec_prompt(
                f"You are the chaos engine for EVOLUTION ARENA — the most unhinged creature survival game ever made. "
                f"Two creatures are about to face each other in an impossible scenario. "
                f"Creature 1: {c1['name']} — Traits: {c1['traits']} — Special Ability: {c1['ability']} — Weakness: {c1['weakness']}. "
                f"Creature 2: {c2['name']} — Traits: {c2['traits']} — Special Ability: {c2['ability']} — Weakness: {c2['weakness']}. "
                f"Generate ONE wild, absurd, specific survival scenario that these two creatures must face. "
                f"It should be creative, funny, and dramatic. Between 20 and 40 words. "
                f"Examples of the vibe: "
                f"'A massive tsunami of hot sauce is heading toward a floating disco ball the size of a football stadium — the creatures have 60 seconds to reach high ground.', "
                f"'A rogue AI has launched 1000 rubber ducks filled with acid rain from orbit — the creatures must reach the underground bunker 3km away.', "
                f"'An army of sentient office chairs has blocked all exits from a burning skyscraper during a lightning storm.' "
                f"Return ONLY the scenario description. No labels. No extra text. Just the scenario."
            ).strip().strip('"').strip("'").strip()

        scenario = gl.eq_principle.prompt_non_comparative(
            generate_scenario,
            task="Generate a wild absurd survival scenario for two creatures",
            criteria="Creative, funny, dramatic scenario between 20-40 words describing a dangerous situation the creatures must survive"
        )

        if not scenario or len(scenario) < 10:
            scenario = "A volcano erupts underneath a floating city made entirely of trampolines — the creatures have 90 seconds to reach the escape rocket."

        state["current_scenario"] = scenario
        state["tactics"] = {}
        state["status"] = "battling"
        self.games[key] = json.dumps(state)

    # ── SUBMIT TACTIC ─────────────────────────────────────────────────────────
    @gl.public.write
    def submit_tactic(
        self, game_id: int, player_name: str, tactic: str
    ) -> None:
        key = u256(game_id)
        if key not in self.games:
            return
        state = json.loads(self.games[key])

        if state["status"] != "battling":
            return
        if player_name not in state["players"]:
            return
        if player_name in state["tactics"]:
            return  # already submitted this round

        state["tactics"][player_name] = tactic

        # When BOTH players have submitted tactics — AI judges the round
        if len(state["tactics"]) == 2:
            p1 = state["players"][0]
            p2 = state["players"][1]
            c1 = state["creatures"][p1]
            c2 = state["creatures"][p2]
            t1 = state["tactics"][p1]
            t2 = state["tactics"][p2]
            scenario = state["current_scenario"]

            def judge_round():
                return gl.nondet.exec_prompt(
                    f"You are the Supreme Arena Judge — an ancient, dramatic, slightly unhinged AI that decides which creature survives impossible scenarios. "
                    f"You judge based on creativity, how well the survival tactic uses the creature's traits, and pure entertainment value. "
                    f"THE SCENARIO: {scenario} "
                    f"CREATURE 1: {c1['name']} | Traits: {c1['traits']} | Special Ability: {c1['ability']} | Weakness: {c1['weakness']} "
                    f"Player {p1}'s survival tactic: {t1} "
                    f"CREATURE 2: {c2['name']} | Traits: {c2['traits']} | Special Ability: {c2['ability']} | Weakness: {c2['weakness']} "
                    f"Player {p2}'s survival tactic: {t2} "
                    f"Decide which creature SURVIVES. Be dramatic, funny, and specific about WHY their traits and tactic helped or failed them. "
                    f"Respond ONLY with this exact JSON and nothing else: "
                    f'{{\"winner\": \"NAME\", \"verdict\": \"Your dramatic 2-sentence ruling\"}} '
                    f"Replace NAME with exactly {p1} or exactly {p2}. No other text outside the JSON."
                ).replace("```json", "").replace("```", "").strip()

            judgment_str = gl.eq_principle.prompt_non_comparative(
                judge_round,
                task="Judge which creature survives the scenario based on their traits and tactic",
                criteria=f"JSON with winner being exactly '{p1}' or '{p2}' and a dramatic funny verdict under 60 words"
            )

            # Parse judgment — json.loads OUTSIDE the function
            try:
                judgment = json.loads(judgment_str)
                winner = str(judgment.get("winner", "")).strip()
                verdict = str(judgment.get("verdict", "The judge was too stunned to speak."))
                if winner not in [p1, p2]:
                    if p1.lower() in winner.lower():
                        winner = p1
                    elif p2.lower() in winner.lower():
                        winner = p2
                    else:
                        winner = p1
            except Exception:
                winner = p1
                verdict = "The arena's ancient AI malfunctioned. Victory awarded by cosmic coin flip."

            # Record round in history
            state["history"].append({
                "round": state["current_round"],
                "scenario": scenario,
                "tactics": {p1: t1, p2: t2},
                "winner": winner,
                "verdict": verdict,
            })

            # Update scores
            state["scores"][winner] = state["scores"].get(winner, 0) + 1
            state["round_winner"] = winner
            state["round_verdict"] = verdict

            # Check if someone won the game
            if state["scores"][winner] >= WINS_NEEDED:
                state["status"] = "finished"
                state["game_winner"] = winner

            else:
                # Generate next scenario
                next_round = state["current_round"] + 1

                def generate_next_scenario():
                    return gl.nondet.exec_prompt(
                        f"Generate a NEW wild survival scenario for round {next_round} of EVOLUTION ARENA. "
                        f"The previous scenario was: {scenario}. Make this one completely different and even more absurd. "
                        f"Creature 1: {c1['name']} — Traits: {c1['traits']}. "
                        f"Creature 2: {c2['name']} — Traits: {c2['traits']}. "
                        f"The scenario should challenge their specific traits in interesting ways. "
                        f"Between 20 and 40 words. Return ONLY the scenario. No labels. No extra text."
                    ).strip().strip('"').strip("'").strip()

                new_scenario = gl.eq_principle.prompt_non_comparative(
                    generate_next_scenario,
                    task="Generate a new wild survival scenario different from the previous one",
                    criteria="Creative absurd survival scenario between 20-40 words, clearly different from previous scenario"
                )

                if not new_scenario or len(new_scenario) < 10:
                    new_scenario = "A black hole the size of a watermelon has appeared in the arena cafeteria and it is slowly eating the building from the inside out."

                state["current_round"] = next_round
                state["current_scenario"] = new_scenario
                state["tactics"] = {}
                state["round_winner"] = None
                state["round_verdict"] = None
                state["status"] = "battling"

        self.games[key] = json.dumps(state)

    # ── VIEW METHODS ──────────────────────────────────────────────────────────
    @gl.public.view
    def get_game(self, game_id: int) -> str:
        key = u256(game_id)
        if key in self.games:
            return self.games[key]
        return ""

    @gl.public.view
    def get_game_count(self) -> int:
        return int(self.game_count)
