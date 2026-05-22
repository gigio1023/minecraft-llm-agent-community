# Mob Registry

This document catalogues the basic passive and hostile mobs an agent will encounter, along with their precise Entity IDs for version 1.21.11.

---

## 🐄 1. Passive Mobs (Livestock)
Passive mobs do not attack the player. They are the primary source of early-game food and resources like wool and leather.

| Mob Name | Entity ID | Namespaced ID | Primary Drops | Behavior |
| :--- | :---: | :--- | :--- | :--- |
| **Cow** | 30 | `cow` | Raw Beef, Leather | Roams aimlessly. Follows players holding Wheat. |
| **Sheep** | 111 | `sheep` | Raw Mutton, Wool | Roams aimlessly. Follows players holding Wheat. Can be sheared for Wool without killing. |
| **Pig** | 100 | `pig` | Raw Porkchop | Roams aimlessly. Follows players holding Carrots/Potatoes/Beetroots. |
| **Chicken** | 26 | `chicken` | Raw Chicken, Feather | Roams aimlessly. Follows players holding Seeds. Periodically drops Eggs. |

---

## 🧟 2. Hostile Mobs
Hostile mobs spawn in darkness (Light Level 0) or at night. They will actively track and attack the player if within range.

| Mob Name | Entity ID | Namespaced ID | Primary Drops | Danger/Attack Mechanic |
| :--- | :---: | :--- | :--- | :--- |
| **Zombie** | 150 | `zombie` | Rotten Flesh | Melee attacker. Burns in daylight. |
| **Skeleton** | 115 | `skeleton` | Arrow, Bone | Ranged attacker (shoots arrows). Burns in daylight. Will try to maintain distance. |
| **Spider** | 124 | `spider` | String, Spider Eye | Melee attacker. Can climb walls. Neutral in daylight, hostile at night or in darkness. |
| **Creeper** | 32 | `creeper` | Gunpowder | Silent approach. Explodes when close to the player, destroying blocks and dealing massive damage. Does NOT burn in daylight. |

---

## ⚠️ Agent Combat Logic
When handling mobs via Mineflayer:
1. **Targeting**: Mobs are considered entities. Use `bot.entities` to locate them.
2. **Pathfinding**: Use `bot.pathfinder.setGoal(new goals.GoalFollow(entity, range))` to approach.
3. **Attacking**: Use `bot.attack(entity)`.
4. **Cooldowns**: Minecraft has a combat cooldown (attack indicator). Spam-clicking `bot.attack` deals minimal damage. Agents must wait approximately 0.6 to 1.0 seconds between strikes depending on the weapon equipped.
