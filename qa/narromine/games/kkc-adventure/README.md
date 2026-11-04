# The King Killer Chronicle: Text Adventure

A canonical, simulation-first text adventure game set in Patrick Rothfuss's University era. Single-file HTML/JavaScript application with persistent game state via localStorage.

## Play Online

🎮 **[Play the Game](https://joshualparris.github.io/kkc-adventure/)**

## Features

- **18+ Explorable Locations** - University campus with atmospheric descriptions
- **5 Canonical NPCs** - Simmon, Wilem, Master Elodin, Master Kilvin, Master Dal with branching dialogue
- **Skill-Based Dialogue** - Wit, Empathy, Authority, and Scholarship checks influence outcomes
- **Living Economy** - Earn money by busking, pay tuition, manage resources
- **Time System** - 4 day-parts: morning, afternoon, evening, night with NPCs moving through locations
- **Relationship Tracking** - 0-100 standing with each NPC affects dialogue and outcomes
- **Class Attendance** - Attend courses to improve relationships and track academic progress
- **Persistent State** - Game saves automatically via browser localStorage
- **Canon-Faithful** - All locations, NPCs, and mechanics grounded in the books

## How to Play

```
look              - Examine your surroundings
go [direction]    - Move north, south, east, west, up, down, enter, out
talk to [name]    - Start a conversation
ask [name] about [topic]  - Ask about specific topics
wait              - Advance time to next day-part
eat               - Reduce hunger
sleep             - Rest and recover fatigue
busk              - Earn money performing music
attend [class]    - Attend Artificery, Sympathy, or Naming class
study [subject]   - Study to improve a dialogue skill
pay tuition       - Pay your academic fees
status            - Check character state
inventory / inv   - View your items
help              - See available actions
quit / exit       - End the game
```

## Technical Details

- **Single File:** `index.html` contains all HTML, CSS, and JavaScript
- **No Dependencies:** Runs entirely in the browser with built-in APIs
- **Persistent:** Game state saved to localStorage automatically
- **Responsive:** Works on desktop and mobile browsers
- **Canon-First:** All content grounded in Rothfuss's published works

## Development

To run locally, simply open `index.html` in a web browser. No build process or server required.

## License

This is a fan project inspired by Patrick Rothfuss's Kingkiller Chronicle series. All canon lore and character names are copyright Patrick Rothfuss.

---

**Start your University morning now →** [Play](https://joshualparris.github.io/kkc-adventure/)
