const ELODIN_DATA = {
  summaries: [
    {
      title: "The Surface",
      text: "Elodin appears erratic, playful, half-feral, eccentric, and unserious. He slides in socks down marble hallways, removes his shoes without explanation, stares at ferns for 30 minutes, and speaks in riddles and apparent non-sequiturs.",
    },
    {
      title: "The Depth",
      text: "Beneath the eccentricity lies one of the most frighteningly capable minds at the University. He escaped from a copper-warded cell by speaking the Name of stone. He knows things he will not say. He watches Kvothe with an intensity that exceeds professional obligation.",
    },
    {
      title: "The Mystery",
      text: "We don't know what sent him to the Rookery, whether he attempted Shaping, what he knows about the Chandrian, or what he is protecting people from by withholding information. He is deliberately obscure.",
    },
  ],
  gaps: [
    {
      title: "What caused the Rookery confinement?",
      text: "Elodin was confined to Haven (the Rookery) after 'it happened'. The cause is never directly stated. Did he go too deep into Naming? Attempt Shaping? Encounter something? Or was it political?",
    },
    {
      title: "Why was he panicked about Fela changing her name?",
      text: "In WMF, Elodin's first reaction to learning someone changed their name is wild panic, thinking it might be Fela. Why would he be so afraid of Fela changing her name specifically?",
    },
    {
      title: "What happened at the four-plate door?",
      text: "Elodin says about the door behind the Archives: 'Merciful Tehlu, it almost killed me.' We don't know what this door is, what's behind it, or why it nearly killed him.",
    },
    {
      title: "What are 'the seven words that will make a person love you'?",
      text: "Elodin states these exist and is amused by Kvothe's confusion. Are they a Name? A form of Shaping? And does this connect to Denna somehow?",
    },
  ],
  entries: [
    {
      id: "physical-presence",
      title: "Elodin's physical presence is deliberately non-impressive until you meet his eyes",
      category: "Character",
      evidence: "Canon",
      confidence: "High",
      summary: "Elodin is younger than other Masters by a dozen years, clean-shaven, medium height and build. There is nothing physically striking about him except the quality of his attention. His voice has an unusual resonance that affects everyone in the room.",
      implications: "This is a core design truth: Elodin should not be defined by costume or spectacle. Presence and intensity are his weapons, not appearance.",
      sources: [
        {
          label: "NOTW Ch. 9 (Admissions)",
          note: "When Elodin speaks, everyone at the desk 'stirred slightly, then grew still, like leaves touched by the wind.'",
        },
      ],
    },
    {
      id: "master-namer",
      title: "He holds the Chair of Naming and is institutionally central to the University",
      category: "University Role",
      evidence: "Canon",
      confidence: "High",
      summary: "Elodin formally participates in Masters' meetings, votes on student discipline and admission, and is recognized as the authority on Naming. Yet he often doesn't attend, and when present, frequently sleeps or appears bored.",
      implications: "He is not a fringe eccentric. He has institutional power despite — or because of — his refusal to exercise it normally.",
      sources: [
        {
          label: "NOTW Ch. 9, 13, 51",
          note: "Multiple Masters' hearings where Elodin votes and influences outcomes.",
        },
      ],
    },
    {
      id: "former-chancellor",
      title: "He was Chancellor of the University, possibly at the youngest age ever",
      category: "Backstory",
      evidence: "Canon",
      confidence: "High",
      summary: "About five years before the novels begin, Elodin held the position of Chancellor — the highest administrative role. He was admitted at age ~14, made arcanist at ~18, and became Chancellor while still remarkably young.",
      implications: "His rise was extraordinary and complete. He had already achieved and lost the highest internal power before the current story begins.",
      sources: [
        {
          label: "NOTW Ch. 20",
          note: "Simmon and Wilem explain that Elodin used to be Chancellor.",
        },
      ],
    },
    {
      id: "rookery-confinement",
      title: "Elodin was confined to Haven (the Rookery) after something broke him — or appeared to",
      category: "Backstory",
      evidence: "Canon",
      confidence: "High",
      summary: "After 'it happened', Elodin was locked in Haven, the University's asylum. He spent approximately two years there in a copper-walled, copper-veined cell with no interior door handle and windows that could not be breached.",
      implications: "The Rookery visit proves his confinement was real. The copper-warding was deliberate. Someone knew to suppress specifically the Name of the wind.",
      sources: [
        {
          label: "NOTW Ch. 20",
          note: "Simmon and Wilem tell Kvothe about the Rookery.",
        },
        {
          label: "NOTW Ch. 46",
          note: "Elodin shows Kvothe his former cell.",
        },
      ],
    },
    {
      id: "cyaerbasalien",
      title: "Elodin knows the Name that breaks stone: CYAERBASALIEN",
      category: "Power",
      evidence: "Canon",
      confidence: "High",
      summary: "In the Rookery cell, Elodin speaks the Name CYAERBASALIEN and the copper-veined stone wall dissolves into fine grey sand. He notes the wardens have changed the stone's Name since his first escape, so this Name may not work again.",
      implications: "Stone is a confirmed, demonstrated capability. If he knows stone and wind, he likely commands multiple great Names. The fact that copper can suppress Names is crucial.",
      sources: [
        {
          label: "NOTW Ch. 46",
          note: "Full wall-breaking scene with Elodin's commentary.",
        },
      ],
    },
    {
      id: "aerlevsedi-wind",
      title: "He teaches Kvothe Aerlevsedi (the Name of the wind)",
      category: "Power",
      evidence: "Canon",
      confidence: "High",
      summary: "After Kvothe instinctively calls the wind and nearly destroys his courtyard, Elodin becomes his sponsor and teaches him the Name Aerlevsedi. Kvothe calls it three times during WMF, each time more deliberately.",
      implications: "Wind is a demonstrated, teachable Name. Elodin's choice to teach specifically this Name to Kvothe may not be arbitrary — wind passes through all cracks and gaps, which may be relevant to the Doors of Stone.",
      sources: [
        {
          label: "NOTW Ch. 46, 51",
          note: "Elodin teaches the Name; Kvothe uses it in the courtyard.",
        },
        {
          label: "WMF Ch. 72",
          note: "Kvothe calls the wind three times: on Stonebridge, in Tomes, and during the third time pays for all.",
        },
      ],
    },
    {
      id: "sleeping-mind",
      title: "His teaching philosophy centers on the sleeping mind vs. the waking mind",
      category: "Teaching",
      evidence: "Canon",
      confidence: "High",
      summary: "Elodin teaches that humans have two minds: a waking mind (analytical, deliberate) and a sleeping mind (intuitive, pre-rational). Naming requires the sleeping mind. The waking mind's analysis actually blocks Naming.",
      implications: "This explains his seemingly random teaching methods. Riddles, extremes, bewilderment, and eccentricity are designed to crack the student's reliance on analytical thinking.",
      sources: [
        {
          label: "NOTW Ch. 46",
          note: "Elodin's full explanation after elevating Kvothe to Re'lar.",
        },
      ],
    },
    {
      id: "teaching-methods",
      title: "His teaching methods are radical: chaos, contradiction, and destabilization",
      category: "Teaching",
      evidence: "Canon",
      confidence: "High",
      summary: "Elodin teaches through: arbitrary tasks (find pinecones), extended sensory deprivation (three-day blindfold), sleep deprivation, drugs (applejack before Teccam), naked storms on rooftops, and rooftop jumps. Every lesson appears nonsensical until later.",
      implications: "Any game version of Elodin must resist easy exposition and normal teaching mechanics. He teaches by cracking habits of mind.",
      sources: [
        {
          label: "NOTW Ch. 46, 51, 58",
          note: "Multiple teaching scenes.",
        },
        {
          label: "WMF Ch. 72",
          note: "Archive rooftop naked storm scene.",
        },
      ],
    },
    {
      id: "auri-connection",
      title: "Elodin knows Auri, protects her, and both were in the Rookery",
      category: "Relationships",
      evidence: "Canon",
      confidence: "High",
      summary: "Auri reports seeing Elodin on rooftops 'listening to the wind'. On a rooftop encounter with Kvothe and Auri, Elodin makes a formal bow to her. He knows she is living in the Underthing and does not report or remove her.",
      implications: "Both Elodin and Auri went too far into Naming/magic. He rebuilt into functional eccentricity; she rebuilt into fragile beauty. His protection of her is one of his most revealing acts.",
      sources: [
        {
          label: "NOTW Ch. 53",
          note: "Auri mentions seeing Elodin listening to the wind.",
        },
        {
          label: "WMF Ch. 66",
          note: "Rooftop encounter with Auri, Kvothe, and Elodin.",
        },
      ],
    },
    {
      id: "kvothe-first-meeting",
      title: "At Kvothe's first admissions interview, Elodin tests him with nonsensical questions",
      category: "Relationships",
      evidence: "Canon",
      confidence: "High",
      summary: "Elodin asks: How many fingers am I holding? (test: can you acknowledge uncertainty). Do you know the seven words that will make a woman love you? (test: honesty). His questions test quality of attention and presence, not knowledge.",
      implications: "Elodin recognizes potential in Kvothe immediately. His test identifies whether Kvothe has the right kind of mind for Naming.",
      sources: [
        {
          label: "NOTW Ch. 9",
          note: "Full admissions scene with Elodin's questions.",
        },
      ],
    },
    {
      id: "rooftop-jump",
      title: "Elodin tests Kvothe by asking him to jump off a roof — and refuses him as a student when he does",
      category: "Teaching",
      evidence: "Canon",
      confidence: "High",
      summary: "After the walk to Haven, Elodin asks Kvothe to jump from the Rookery roof. Kvothe jumps. He breaks ribs, dislocates his shoulder, nearly breaks his neck. Elodin's verdict: 'That was the stupidest thing I've ever seen. Ever.'",
      implications: "This reveals the difference between faith and recklessness. Kvothe failed the test by not understanding what Elodin was asking. Elodin refuses him—initially.",
      sources: [
        {
          label: "NOTW Ch. 46",
          note: "Full rooftop test and Elodin's reaction.",
        },
      ],
    },
    {
      id: "sponsorship",
      title: "Elodin sponsors Kvothe to Re'lar despite voting to expel him",
      category: "Relationships",
      evidence: "Canon",
      confidence: "High",
      summary: "During the Ambrose hearing, all nine Masters (including Elodin) vote guilty of malfeasance and expulsion. Then Elodin votes to suspend expulsion. Then he moves to raise Kvothe to Re'lar. His political intervention saves Kvothe's University career.",
      implications: "This is extraordinary. Elodin has now saved Kvothe twice. His investment is far beyond academic.",
      sources: [
        {
          label: "NOTW Ch. 51",
          note: "The Masters hearing and voting sequence.",
        },
      ],
    },
    {
      id: "re-lar-explanation",
      title: "Elodin explains that Re'lar means 'one who speaks' — specifically, one who speaks Names",
      category: "Teaching",
      evidence: "Canon",
      confidence: "High",
      summary: "When explaining the Arcanum history, Elodin teaches that E'lir means 'see-er' (those who see things for what they are) and Re'lar means 'speaker' (those who speak names—the true Names that have power).",
      implications: "Naming is not metaphorical. Names are the shape of the world. A Re'lar is someone who commands reality by speaking Names.",
      sources: [
        {
          label: "NOTW Ch. 46",
          note: "Elodin's explanation after raising Kvothe to Re'lar.",
        },
      ],
    },
    {
      id: "calm-the-storm",
      title: "After Kvothe calls the wind in rage at Ambrose, Elodin uses a Name to calm him",
      category: "Power",
      evidence: "Canon",
      confidence: "High",
      summary: "Kvothe is broken, dissociated after calling the wind and the courtyard erupts. Elodin approaches, says 'Kvothe' (his true name), and whispers a Name into his ear. 'And the storm stilled. I found a place to land.'",
      implications: "Elodin knows Kvothe's true Name and can wield it to bring him back from dissociation. This is one of the most intimate moments between them.",
      sources: [
        {
          label: "NOTW Ch. 51",
          note: "Full scene in Kilvin's office after the courtyard incident.",
        },
      ],
    },
    {
      id: "shaed-recognition",
      title: "Elodin immediately recognizes the shaed (faerie cloak) and knows about the Fae realm",
      category: "Power",
      evidence: "Canon",
      confidence: "High",
      summary: "When Kvothe wears the shaed from Felurian, Elodin exclaims: 'How did you come to be enshaedn? Your cloak, boy. Your turning cape. How in God's sweet grace did you tumble onto a shaed?' He speaks knowledgeably about old magic.",
      implications: "Elodin has either been to the Fae realm or studied it extensively. He discusses Kvothe's encounter with Felurian as something real and knowable, not myth.",
      sources: [
        {
          label: "WMF Ch. 71",
          note: "Elodin and Kvothe's conversation about the shaed in a small pub.",
        },
      ],
    },
    {
      id: "adem-hand-talk",
      title: "Elodin uses Adem hand-talk when expressing amazement at Kvothe's wind-calling",
      category: "Knowledge",
      evidence: "Canon",
      confidence: "High",
      summary: "When Kvothe tells Elodin he called the wind three times including once in Ademre, Elodin makes 'a broad motion with his splayed left hand' in Adem hand-talk for 'amazed respect'. Kvothe had to deduce what it meant.",
      implications: "Elodin knows Adem culture deeply enough to use their gestural language naturally. This suggests travel, study, or deep connection.",
      sources: [
        {
          label: "WMF Ch. 71",
          note: "Elodin's response to Kvothe calling the wind in Ademre.",
        },
      ],
    },
    {
      id: "denna-name-panic",
      title: "Elodin panics when learning someone has changed their name; is relieved it's Denna, not Fela",
      category: "Knowledge",
      evidence: "Canon",
      confidence: "High",
      summary: "Kvothe asks what Elodin thinks of someone who keeps changing their name. Elodin's immediate reaction: panic, wild eyes, asking what Kvothe has done. His relief when it's not Fela is palpable. His analysis of Denna's name-changing is careful and theoretical.",
      implications: "Why would Fela changing her name terrify him? And why is he so carefully analytical about Denna's pattern? He knows something about both of them.",
      sources: [
        {
          label: "WMF Ch. 91",
          note: "Elodin's reaction in the garden near the Mews.",
        },
      ],
    },
    {
      id: "archive-rooftop",
      title: "Elodin steals Lorren's key and forces Kvothe to experience a naked thunderstorm on the Archive roof",
      category: "Teaching",
      evidence: "Canon",
      confidence: "High",
      summary: "During WMF, Elodin decides Kvothe needs to experience a storm on the rooftop. He steals the key. When it rains, he insists they strip naked and wrap their clothes. The wind takes both clothes and key. They're found naked by Lorren and scrivs. Elodin laughs.",
      implications: "This is extreme pedagogy: designed to break Kvothe's relationship with comfort and control. Yet it works. Kvothe calls the wind three times that term.",
      sources: [
        {
          label: "WMF Ch. 72",
          note: "Full Archive rooftop scene and its consequences.",
        },
      ],
    },
    {
      id: "four-plate-door",
      title: "Elodin has been to the four-plate door in the Archives and says it almost killed him",
      category: "Backstory",
      evidence: "Canon",
      confidence: "High",
      summary: "When Kvothe asks about the door behind the four-plate lock, Elodin says: 'Valaritas. God. I can still remember what it was like, standing down there looking at the door, wondering.' Then: 'Merciful Tehlu, it almost killed me.'",
      implications: "The door is real. Elodin has encountered it. It is dangerous. We don't know what it is or what's behind it.",
      sources: [
        {
          label: "NOTW Ch. 46",
          note: "Elodin's cryptic response about the four-plate door.",
        },
      ],
    },
    {
      id: "seven-words",
      title: "Elodin claims there are seven words that will make a person love you",
      category: "Knowledge",
      evidence: "Canon",
      confidence: "High",
      summary: "At Kvothe's admissions interview, Elodin asks: 'Do you know the seven words that will make a woman love you?' When Kvothe says no: 'They exist. He reassured me, and sat back with a look of contentment.'",
      implications: "He knows this specifically. Are they a Name? A form of Shaping? Does this relate to Denna in some way?",
      sources: [
        {
          label: "NOTW Ch. 9",
          note: "Admissions scene with Elodin's question.",
        },
      ],
    },
    {
      id: "theory-cthaeh",
      title: "[THEORY] Elodin may have spoken with the Cthaeh",
      category: "Theory",
      evidence: "Theory",
      confidence: "Medium",
      summary: "His knowledge has the quality of someone who has been told things no one should know. Every person who speaks with the Cthaeh sets off catastrophic consequences. Elodin's caution about what he reveals may reflect awareness of this.",
      implications: "Would explain both his knowledge and his strategic withholding. Would also explain his wariness about direct instruction.",
      sources: [
        {
          label: "Community Theory",
          note: "Based on the pattern of his knowledge and his careful avoidance of direct revelation.",
        },
      ],
    },
    {
      id: "theory-shaping",
      title: "[THEORY] Elodin may have attempted or witnessed Shaping",
      category: "Theory",
      evidence: "Theory",
      confidence: "Medium",
      summary: "His knowledge of Shaping vs. Naming is personal, not academic. He treats Shaping with fear and reverence. He steers Kvothe away from it. He may have attempted it and broken, or seen it attempted.",
      implications: "Would explain the Rookery confinement and his current psychological state.",
      sources: [
        {
          label: "Community Theory",
          note: "Based on tone and intensity when discussing Shaping.",
        },
      ],
    },
    {
      id: "theory-amyr",
      title: "[THEORY] Elodin may be connected to the Amyr",
      category: "Theory",
      evidence: "Theory",
      confidence: "Low",
      summary: "As Chancellor, he had archive access. His concealment style matches Amyr principles. His protection of multiple people suggests a larger mission. His knowledge of major secrets is consistent with Amyr involvement.",
      implications: "Would explain his institutional position and his strategic withholding of information.",
      sources: [
        {
          label: "Community Theory",
          note: "Circumstantial but thematically coherent.",
        },
      ],
    },
  ],
};
