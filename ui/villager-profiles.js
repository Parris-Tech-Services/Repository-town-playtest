// Background identities are independent of scheduled paid jobs.
// Edit NPC personalities here, not in the conversation/rendering controller.
// Source: the 38-villager NPC realism audit (2026-10-19).
export const VILLAGER_PROFILES = {
  Mabel: ['community gardener', 'practical and sunny', 'seedlings and shared gardens'], Arlo: ['amateur engineer', 'curious and hands-on', 'tinkering and mechanisms'],
  Bea: ['birdwatcher', 'gentle and observant', 'birds and trees'], Cas: ['dramatic storyteller', 'theatrical but kind', 'turning errands into adventures'],
  Dot: ['detail collector', 'precise and easily delighted', 'maps and overlooked patterns'], Ezra: ['local history keeper', 'warm and reflective', 'old stories and archives'],
  Flo: ['neighbourhood baker', 'upbeat and generous', 'recipes and friendly welcomes'], Gus: ['laid-back fixer', 'dry and reassuring', 'repairs and useful tools'],
  Hattie: ['tea-and-etiquette enthusiast', 'polite with a mischievous streak', 'tea and well-timed pauses'], Ivo: ['puzzle setter', 'playful and analytical', 'riddles and logic'],
  June: ['moonlit gardener', 'calm and dreamy', 'night walks and moon phases'], Kip: ['neighbourhood courier', 'brisk and helpful', 'shortcuts and messages'],
  Lou: ['street musician', 'rhythmic and warm', 'melodies and found sounds'], Merv: ['retired code reviewer', 'deadpan and exacting', 'clear explanations and suspicious shortcuts'],
  Nora: ['quiet caretaker', 'steady and reassuring', 'tidy spaces and helping neighbours'], Ollie: ['arcade enthusiast', 'excitable and competitive', 'games and unnecessary high scores'],
  Peg: ['repair café regular', 'encouraging and practical', 'repair and reuse'], Rafe: ['amateur astronomer', 'thoughtful and enthusiastic', 'constellations and clear nights'],
  Sadie: ['curious book-and-building collector', 'bright, nosy and quietly thoughtful', 'book stacks and unusual rooms'], Theo: ['philosophical walker', 'slow, thoughtful and gently funny', 'good questions and changing viewpoints'],
  Una: ['native-plant champion', 'earnest and encouraging', 'local plants and habitat'], Vern: ['friendly town gossip', 'cheerful and conspiratorial', 'neighbourly news and unusual sightings'],
  Win: ['weather watcher', 'observant and lightly dramatic', 'clouds, wind and changing light'], Zara: ['community organiser', 'decisive and welcoming', 'bringing people together and making plans'],
  Bluey: ["quiet open-source hacker", "wry and generous", "small programming tools and helping neighbours debug them"],
  Clem: ["retired birdwatcher", "unhurried and observant", "local birds, old paths and morning walks"],
  Dulcie: ["young experimenter", "inquisitive and friendly", "learning at school and sketching science ideas"],
  Errol: ["student athlete", "playful and persistent", "school projects, fitness and figuring out puzzles"],
  Fern: ["landscape painter", "imaginative and patient", "colour, murals and the light in Market Square"],
  Gwen: ["seed-exchange organiser", "practical and thoughtful", "gardening, neighbourly help and long memories"],
  Harlan: ["farming machinery tinkerer", "steady and curious", "wheat, soil and keeping farm machinery running"],
  Ida: ["local food enthusiast", "chatty and organised", "seasonal produce, recipes and fair prices"],
  Archie: ["home electronics hobbyist", "methodical and calm", "solar panels, electrical safety and power demand"],
  Bonnie: ["waterways enthusiast", "careful and warm", "water conservation, rainfall and keeping taps running"],
  Cooper: ["reuse champion", "resourceful and upbeat", "sorting materials, fixing broken things and reducing waste"],
  Daisy: ["volunteer first aider", "brave and measured", "fire prevention, community safety and training drills"],
  Elsie: ["local numbers buff", "patient and precise", "savings, the town budget and helping people plan"],
  Frankie: ["metalwork craftsperson", "direct and inventive", "foundry safety, tools and durable handmade objects"],
};

export function villagerProfile(name, job) {
  const p=VILLAGER_PROFILES[name] || ['town neighbour', 'friendly and curious', 'the people and projects of Repository Town'];
  return job ? [job,p[1],p[2]] : p;
}
