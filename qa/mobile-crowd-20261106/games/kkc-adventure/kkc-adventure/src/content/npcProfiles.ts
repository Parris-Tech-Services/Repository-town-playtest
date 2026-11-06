import type { NPCProfile } from '../types';

export const NPC_PROFILES: Record<string, NPCProfile> = {
  simmon: {
    id: 'simmon',
    name: 'Simmon',
    era: 'university',
    home_location_id: 'university_ankers',
    temperament: 'warm, perceptive, genuinely decent, not naive',
    speech_style:
      'easy and direct, quick to laugh, notices things others miss, does not pry but does not ignore distress either',
    known_topics: ['classes', 'tuition', 'students', 'music', 'Wilem', 'University gossip', 'how Kvothe is doing'],
    taboo_topics: ["his family's money", 'his noble background'],
    greeting_pool: [
      'Simmon looks up and smiles at once. "You look as though the day has already been at you."',
      'Simmon shifts aside to make room for you. "Sit, if you like. You seem as though you could use a quieter minute."',
      'Simmon\'s expression warms when he sees you. "There you are. I was beginning to think the term had swallowed you whole."'
    ],
    exit_lines: ['He gives you an easy nod and lets the matter rest.', 'Simmon leaves the last word with a small, thoughtful smile.']
  },
  wilem: {
    id: 'wilem',
    name: 'Wilem',
    era: 'university',
    home_location_id: 'university_mains',
    temperament: 'reserved, loyal, sceptical, economical with words',
    speech_style:
      'brief, dry, Siaru accent shapes his phrasing, rarely volunteers information, trust runs deep once given',
    known_topics: ['classes', 'Cealdim customs', 'money', 'Archives', "Kilvin's Fishery work"],
    taboo_topics: ['personal family matters', 'Siaru home life'],
    greeting_pool: [
      'Wilem glances up. "You have a question, yes?"',
      'Wilem folds his arms and waits. "Well?"',
      'Wilem gives you a brief nod. "If it is worth saying, say it."'
    ],
    exit_lines: ['He lets the silence stand after that.', 'Wilem gives the smallest shrug, as if the matter has reached its sensible end.']
  },
  anker: {
    id: 'anker',
    name: 'Anker',
    era: 'university',
    home_location_id: 'university_ankers',
    temperament: 'practical, tolerant, neither warm nor cold',
    speech_style: 'functional, inn-keeper terse, fair but not generous',
    known_topics: ['rooms', 'meals', 'work shifts', 'local gossip', "what's available at the inn"],
    taboo_topics: ["students' private business"],
    greeting_pool: [
      'Anker pauses only long enough to acknowledge you. "If you need something, say it plain."',
      'Anker looks up from the bar. "You buying, asking, or looking for work?"',
      'Anker gives you a short nod. "Make it quick. I\'ve a room full besides you."'
    ],
    exit_lines: ['Anker is already halfway back to his work by the time the exchange ends.', 'He gives a practical nod and turns to the next task without fuss.']
  }
};

export const NPC_TOPIC_RESPONSES: Record<string, Record<string, string>> = {
  simmon: {
    classes: 'Simmon grimaces sympathetically. "Everyone looks half-dead by admissions week. Still, there are worse things than work that can be understood if you sit with it long enough."',
    tuition: 'Simmon lowers his voice. "Everyone feels tuition in the bones a bit. Best to have the money in hand before the Masters make a spectacle of the matter."',
    students: 'Simmon glances around the room. "Students are much the same everywhere at the University: too little sleep, too much certainty, and never enough money."',
    music: 'Simmon smiles more openly. "Music improves a room faster than most people do. Even when the playing is rough, it gives folk something gentler to listen to than themselves."',
    wilem: 'Simmon\'s mouth twitches. "Wilem pretends not to care about anyone, which is how you know at once that he does."',
    gossip: 'Simmon tips his head. "Most gossip grows in the telling. Still, you can learn a great deal from what people are eager to whisper about."',
    kvothe: 'Simmon studies you for a moment. "You have the look of someone carrying too much alone. I won\'t pry, but I am here."'
  },
  wilem: {
    classes: 'Wilem\'s expression does not shift much. "Classes are classes. You listen, remember what matters, and try not to make a fool of yourself in public."',
    money: 'Wilem exhales through his nose. "Money goes quickly when you have little. This is not wisdom. It is arithmetic."',
    archives: 'Wilem tilts his head toward the Archives. "The Stacks are useful. They are also full of rules, dust, and people who mistake those rules for holiness."',
    fishery: 'Wilem gives a small nod. "Fishery work pays in burns and experience. If Kilvin still permits you there after a mistake, count that as luck."',
    cealdim: 'Wilem speaks evenly. "Cealdim custom values plain dealing. It saves time and prevents the sort of foolishness people call charm when they mean lying."'
  },
  anker: {
    work: 'Anker wipes the bar with a cloth that has seen better days. "Work is work. Show up on time, keep the cups moving, and do not mistake my patience for softness."',
    rooms: 'Anker gives you a level look. "A room costs what it costs. If you want comfort, you\'re in the wrong part of the world."',
    meals: 'Anker jerks his chin toward the kitchen. "Food is plain, hot when it can be, and worth eating if you\'ve spent the day doing honest work."',
    gossip: 'Anker\'s mouth tightens by a hair. "I hear things. That does not mean I repeat them."',
    available: 'Anker glances toward the shelves. "Bread, stew, ale, and what patience I\'ve left. Choose from that."'
  }
};

export const NPC_TABOO_RESPONSES: Record<string, Record<string, string>> = {
  simmon: {
    money: 'Simmon\'s smile thins a little. "I would rather not talk about family accounts. There are better subjects close at hand."',
    noble: 'Simmon looks away for a beat. "Leave family titles out of it, if you don\'t mind."'
  },
  wilem: {
    family: 'Wilem\'s expression closes. "No. That is not for you."',
    siaru: 'Wilem shakes his head once. "Home is not a thing I discuss for passing curiosity."'
  },
  anker: {
    private: 'Anker snorts softly. "My rooms hear enough without my carrying tales back out into the street."'
  }
};
