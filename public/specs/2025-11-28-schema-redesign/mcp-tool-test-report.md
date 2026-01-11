# MCP Tool Test Report - Detailed Output

**Generated:** 2025-11-29T07:39:00.967Z
**Database:** ./test_db

---

## 1. concept_search

Hybrid scoring for concept: 40% name, 30% vector, 20% BM25, 10% WordNet/synonyms

### Test 1.1: Art of War concept

**Input:**
```json
{
  "concept": "military strategy",
  "limit": 3
}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "concept": "military strategy",
  "concept_id": 455274635,
  "summary": "Systematic planning and conduct of armed conflict to achieve political objectives. In this document it encompasses deception, logistics, timing, terrain exploitation and unified command to secure victory while minimizing cost, emphasizing foresight, adaptability and the primacy of strategic ends over mere battlefield action.",
  "match_score": "0.953",
  "related_concepts": [],
  "synonyms": [
    ""
  ],
  "broader_terms": [
    ""
  ],
  "narrower_terms": [
    ""
  ],
  "sources": [
    {
      "title": "Sun Tzu - Art Of War",
      "pages": [],
      "match_type": "primary"
    }
  ],
  "chunks": [],
  "stats": {
    "total_documents": 1,
    "total_chunks": 100,
    "sources_returned": 1,
    "chunks_returned": 0
  }
}
```

### Test 1.2: Clean Architecture concept

**Input:**
```json
{
  "concept": "software architecture",
  "limit": 3
}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "concept": "software architecture",
  "concept_id": 3503213995,
  "summary": "High-level organization of system components and their relationships to satisfy quality attributes and extensibility. The text shows how patterns inform architectural choices, reduce coupling, and balance distribution of responsibilities across objects.",
  "match_score": "0.957",
  "related_concepts": [],
  "synonyms": [
    ""
  ],
  "broader_terms": [
    ""
  ],
  "narrower_terms": [
    ""
  ],
  "sources": [
    {
      "title": "Design Patterns Elements of Reusable Object-Oriented - Gamma, Erich;Helm, Richard;Johnson, Ralph E ;Vlissides, John - Uttar Pradesh, India, 2016 - 9780201633610 - 2121300da35565356b45a1b90df80e9d - Anna’s Archive",
      "pages": [],
      "match_type": "primary"
    }
  ],
  "chunks": [],
  "stats": {
    "total_documents": 1,
    "total_chunks": 100,
    "sources_returned": 1,
    "chunks_returned": 0
  }
}
```

### Test 1.3: Systems Thinking concept

**Input:**
```json
{
  "concept": "feedback loop",
  "limit": 3
}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "concept": "balancing feedback loop",
  "concept_id": 3112190783,
  "summary": "A stabilizing feedback structure that opposes change and drives a system toward some goal or equilibrium by adjusting flows in response to discrepancies. The document shows balancing loops in thermostats, regulation, and adaptive management and emphasizes how delays and broken information can compromise their effectiveness.",
  "match_score": "0.856",
  "related_concepts": [],
  "synonyms": [
    ""
  ],
  "broader_terms": [
    ""
  ],
  "narrower_terms": [
    ""
  ],
  "sources": [
    {
      "title": "Thinking in Systems - Meadows, Donella H - 2008 - Chelsea Green Publishing - 9781603580052 - 65f9216dde8878346246dd88ded41946 - Anna’s Archive",
      "pages": [],
      "match_type": "primary"
    }
  ],
  "chunks": [],
  "stats": {
    "total_documents": 1,
    "total_chunks": 100,
    "sources_returned": 1,
    "chunks_returned": 0
  }
}
```

### Test 1.4: Design Patterns concept

**Input:**
```json
{
  "concept": "decorator pattern",
  "limit": 3
}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "concept": "decorator pattern",
  "concept_id": 3086272672,
  "summary": "Attach additional responsibilities to objects dynamically by wrapping them in decorator objects that conform to the same interface and forward requests. The book uses decorator to add borders and scrolling to glyphs without subclass proliferation.",
  "match_score": "0.967",
  "related_concepts": [],
  "synonyms": [
    ""
  ],
  "broader_terms": [
    ""
  ],
  "narrower_terms": [
    ""
  ],
  "sources": [
    {
      "title": "Design Patterns Elements of Reusable Object-Oriented - Gamma, Erich;Helm, Richard;Johnson, Ralph E ;Vlissides, John - Uttar Pradesh, India, 2016 - 9780201633610 - 2121300da35565356b45a1b90df80e9d - Anna’s Archive",
      "pages": [
        3,
        10,
        16
      ],
      "match_type": "primary"
    }
  ],
  "chunks": [
    {
      "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n3 \n4 Structural Patterns..............................................155 \nAdapter...........................................................157 \nBridge............................................................171 \nComposite.........................................................183 \nDecorator.........................................................196 \nFaçade............................................................208",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 3,
      "concept_density": "6.250",
      "concepts": [
        "design pattern",
        "structural patterns",
        "object patterns",
        "composite pattern",
        "decorator pattern",
        "bridge pattern",
        "adapter pattern",
        "object adapter",
        "design patterns",
        "object-oriented design"
      ]
    },
    {
      "text": "problems. Somepeople read the catalog through first and then use aproblem-directed \napproach to apply the patterns to their projects. \nIf you aren't an experienced object-oriented designer, then start withthe simplest \nand most common patterns: \n• Abstract Factory (page 99) \n• Adapter (157) \n• Composite (183) \n• Decorator (196) \n• Factory Method (121) \n• Observer (326) \n• Strategy (349) \n• Template Method (360) \nIt's hard to find an object-oriented system that doesn't use at leasta couple",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 10,
      "concept_density": "2.133",
      "concepts": [
        "design pattern",
        "pattern problem",
        "class patterns",
        "object patterns",
        "observer pattern",
        "composite pattern",
        "strategy pattern",
        "decorator pattern",
        "abstract factory pattern",
        "factory method pattern"
      ]
    },
    {
      "text": "to replace the algorithm either statically or dynamically, when you have a lot \nof variants of the algorithm, or when the algorithm has complex data structures \nthat you want to encapsulate. \nMVC uses other design patterns, such as Factory Method (121) to specify the default \ncontroller class for a view and Decorator (196) to add scrolling to a view. But \nthe main relationships in MVC are given by the Observer, Composite, and Strategy \ndesign patterns. \nDescribing Design Patterns",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 16,
      "concept_density": "1.282",
      "concepts": [
        "design pattern",
        "pattern structure",
        "class patterns",
        "observer pattern",
        "composite pattern",
        "strategy pattern",
        "decorator pattern",
        "factory method pattern",
        "design patterns",
        "factory method"
      ]
    }
  ],
  "stats": {
    "total_documents": 1,
    "total_chunks": 100,
    "sources_returned": 1,
    "chunks_returned": 3
  }
}
```

---

## 2. catalog_search

Hybrid scoring for catalog: 30% vector, 25% BM25, 20% title, 15% concept, 10% WordNet

### Test 2.1: war

**Input:**
```json
{
  "text": "war"
}
```

**Status:** ✅ PASS

**Output:**
```json
[
  {
    "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
    "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a historical biography of the ancient Chinese military strategist Sun Tzu, including Ssu-ma Ch'ien's account of his demonstration of discipline by training the King of Wu's concubines, his military successes against rival states, references to his descendant Sun Pin, and the opening lines of the first chapter on \"Laying Plans,\" emphasizing war's vital importance to the state.\n\nKey Concepts: military strategy, deception tactics, moral law, heaven and weather analysis, earth and terrain analysis, commander virtues, method and discipline, logistics and supply management, rapidity and timing, strategic intelligence, spy operations, types of spies, converted spies, doomed spies, local spies, inward spies, surviving spies, planning and calculation, seven considerations assessment, assessment of strengths and weaknesses, direct and indirect maneuvering, cheng and chi maneuver theory, tactical dispositions, concentration and dispersal of forces, force multiplication and combined energy, feints and baits, ambush tactics, divide and conquer, siege warfare principles, attack by stratagem, attack by fire, environmental exploitation, use of signals and communication, gongs drums flags signaling, battlefield reconnaissance, scouting indicators, morale management, rewards and punishments system, discipline enforcement, command and control, unity of command, use of captured troops, foraging on the enemy, cost of war and economic impact, avoiding protracted warfare, measurement estimation calculation balancing, balancing of chances, tactical flexibility and variation, nine situations framework, six types of terrain classification, maneuvering artifice of deviation, positioning and high ground, river and water warfare, marching and encampment doctrine, night operations and timing, use of weather and seasons, use of local guides, intelligence from spies vs. divination, concealment and secrecy, simulated disorder, masking strength with weakness, psychological operations, provoking and irritating enemy, exploiting enemy temperament, supply line protection, alliance management and diplomacy, strategic patience and opportunism, killing commander strategy, unity of spirit in army, selection and employment of officers, punishment of leaders for failure, reading signs and omens, terrain-based tactics, forced marches and limits, husbanding strength and economy, encirclement and leaving an outlet, deception of own troops, controlling information and secrecy, reward distribution and plunder policy, leadership conduct and morale, mobilization and concentration, dispersive and facile ground tactics, cutting communications, timing of attacks by stars and days, fire attack seasonality, integration of civil and military spheres, calculation of probabilities, using natural elements as metaphors for tactics, strategic surprise, operational security and counterintelligence\nCategories: military strategy, intelligence studies, operations research, logistics and supply chain, organizational leadership, security studies",
    "scores": {
      "hybrid": "0.432",
      "vector": "0.000",
      "bm25": "0.439",
      "title": "1.000",
      "concept": "0.818",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "war",
      "cost",
      "and",
      "economic",
      "impact",
      "avoiding",
      "protracted",
      "warfare",
      "river",
      "water"
    ]
  },
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" introduces fundamental design patterns for object-oriented programming, featuring a catalog of creational, structural, and behavioral patterns, illustrated through a document editor case study, along with introductory concepts, discussions, and supporting resources like a glossary and CD preface.\n\nKey Concepts: design pattern, pattern intent, pattern problem, pattern solution, pattern consequences, pattern structure, pattern participants, pattern collaborations, pattern implementation, pattern sample code, catalog classification, creational patterns, structural patterns, behavioral patterns, class patterns, object patterns, program to an interface not an implementation, favor object composition over class inheritance, delegation, model view controller, observer pattern, composite pattern, strategy pattern, decorator pattern, transparent enclosure, mono glyph, compositor, composition, te x compositor, discretionary glyph, visitor pattern, accept operation, iterator pattern, create iterator, preorder iterator, null iterator, command pattern, command history, undo and redo mechanism, memento pattern, spell checking visitor, hyphenation visitor, glyph abstraction, glyph operations, document structure, recursive composition, transparent decoration, look and feel abstraction, abstract factory pattern, factory method pattern, builder pattern, prototype pattern, singleton pattern, maze example, factory as singleton, prototype manager, deep versus shallow copy, handle body idiom, window abstraction, window implementation, bridge pattern, window system factory, adapter pattern, class adapter, object adapter, pluggable adapter, two way adapter, facade pattern, subsystem public interface, flyweight pattern, intrinsic state, extrinsic state, flyweight factory, proxy pattern, proxy uses, bridge versus adapter, decorator versus strategy, inheritance versus composition, class versus interface inheritance, parameterized types and templates, run time versus compile time structure, aggregation versus acquaintance, design for change, framework, toolkit, application design concerns, mvc view nesting, controller encapsulation, spelling algorithm strategy, hyphenation algorithm, text layout, formatter cache, visitor trade offs, accessor operations, null object, registry, reference counting, layering, algorithm encapsulation, open closed principle, client configurability, sample code localization, design patterns, object-oriented design, software architecture, encapsulating variation, decoupling senders and receivers, refactoring lifecycle, pattern language, separation of concerns, code reuse, glyph context, btree font mapping, glyph factory, character glyph, virtual proxy, image proxy, remote proxy, protection proxy, smart reference, operator overloading for proxy, doesnotunderstand forwarding, undo and redo, macro command, simple command template, originator caretaker, incremental mementos, subject observer mapping, push pull notification, change manager, chain of responsibility pattern, help handler, request as object, mediator pattern, colleague, dialog director, external iterator, internal iterator, cursor iterator, robust iterator, iterator pointer proxy, double dispatch, interpreter pattern, abstract syntax tree, terminal nonterminal expressions, parsing strategies, double-dispatch alternatives, template method pattern, hook operations, strategy as template parameter, state pattern, state sharing, tcp connection state machine, proxy decorator comparison, adapter bridge comparison, factory method, layout objects as flyweights, copy on write, save load persistence, logging and recovery, transaction modeling, iterator state memento, collection iteration state, internal composition repair, compositor interface, tex compositor, simple compositor, array compositor, regular expressions interpreter, input state sets, boolean expression interpreter, replace operation, evaluate operation, context mapping, composite traversal variants, visitor traversal responsibility, accumulating visitor state, breaking encapsulation tradeoff, double dispatch table, command history list, unidraw interpretation chaining, robust traversal under modification, smalltalk internal iterator blocks, resource acquisition is initialization, friend based memento access, doesnotunderstand performance caveat, delegation alternative\nCategories: software engineering, object oriented design, software architecture, human computer interaction, programming languages, object-oriented programming, human-computer interaction",
    "scores": {
      "hybrid": "0.088",
      "vector": "0.000",
      "bm25": "0.187",
      "title": "0.000",
      "concept": "0.273",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "war",
      "cost",
      "and",
      "economic",
      "impact",
      "avoiding",
      "protracted",
      "warfare",
      "river",
      "water"
    ]
  },
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "summary": "Thinking in Systems is a primer by Donella H. Meadows that introduces foundational concepts of systems thinking, exploring system structures and behaviors, their surprising dynamics and traps, leverage points for intervention, and practical guidelines for navigating complex real-world systems, drawing from decades of modeling and interdisciplinary wisdom.\n\nKey Concepts: systems thinking, system dynamics, complexity science, sustainability science, resilience, self-organization, hierarchy, feedback loops, stocks and flows, balancing feedback loop, reinforcing feedback loop, delays, nonlinearity, limits to growth, carrying capacity, overshoot, archetypes, policy resistance, tragedy of the commons, shifting the burden, success to the successful, escalation, drift to low performance, rule beating, bounded rationality, stocks as system memory, buffers, information flows, decision delays, behavior over time graphs, boundary selection, modeling and simulation, scenario analysis, sensitivity analysis, model validation, behavior archetypes catalog, feedback policies, leverage analysis, stocks and flows structure redesign, goal alignment, intrinsic responsibility, meta-resilience, information transparency, model-based learning, adaptive management, participatory modeling, system mapping, time horizon expansion, systems literacy, mental model transparency, heuristic of behavior first, stock-and-flow modeling, causal loop diagramming, doubling time rule, exponential growth, renewable resource constraint, nonrenewable resource depletion, externalities, carrying capacity erosion, feedback signal placement, goal specification, paradigm change, transcending paradigms, fractal geometry, hierarchical decomposition, time discounting critique, leverage points list, model equation transparency, overshoot and oscillation mitigation, ecosystem services framing, civic feedback mechanisms, error embracing, long-term investment in adaptive capacity, systems education, ethics of systemic responsibility, sustainable living, global modeling, sustainable development, global commons stewardship, cultural change through publishing, citizen empowerment, environmental education, long-term foresight, interconnectedness of social and environmental systems, stewardship ethics, organizational learning, systems dynamics modeling, feedback loop analysis, scenario planning, integrated assessment, resilience assessment, transdisciplinary research, sustainability indicators, leverage points analysis, systems archetypes, ecological economics framework, policy analysis for sustainability, community-based stewardship models, slow money investment framework, toxicology communication, life-cycle assessment, regenerative agriculture practices, local food systems finance, earth system science, gaia hypothesis integration, science communication strategies, environmental journalism, public-facing scholarship, catalog distribution strategies, book foreword as credibility device, paperback publishing format, weekly opinion column, environmental studies curriculum, peer recognition mechanisms, nonprofit institute incubation, holocene perspective, future-history narratives, interdisciplinary dialogue formats, toxicity risk framing, supply chain sustainability, ecological footprint accounting, population-resource dynamics, carrying capacity concept, exponential growth dynamics, overshoot and collapse pattern, mitigation and adaptation strategies, environmental governance mechanisms, market-based environmental tools, nonmarket valuation methods, behavioral change communication, community resilience building, soil fertility management, place-based investment, food-system sustainability, scientific intuition integration, popular science dialogues, reflective environmental essays, publisher mission-driven curation, accessible pricing strategies, catalog outreach channels, book-based public engagement, educational forewords, catalog curation for interdisciplinary audiences, accessibility via paperback editions, communication of scientific authority, intergenerational equity, systems pedagogy, public mobilization through narrative, environmental ethics communication, scholar-to-public translation, mission-aligned marketing, strategic book selection\nCategories: systems thinking, system dynamics and modeling, sustainability science, organizational management and policy, complexity and resilience science, sustainability studies, systems science",
    "scores": {
      "hybrid": "0.068",
      "vector": "0.000",
      "bm25": "0.162",
      "title": "0.000",
      "concept": "0.182",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "war",
      "cost",
      "and",
      "economic",
      "impact",
      "avoiding",
      "protracted",
      "warfare",
      "river",
      "water"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through modular decomposition, deep abstractions, information hiding, and strategic practices, derived from the author's Stanford course on creating maintainable and effective code.\n\nKey Concepts: \nCategories: General",
    "scores": {
      "hybrid": "0.052",
      "vector": "0.000",
      "bm25": "0.210",
      "title": "0.000",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "war",
      "cost",
      "and",
      "economic",
      "impact",
      "avoiding",
      "protracted",
      "warfare",
      "river",
      "water"
    ]
  }
]
```

### Test 2.2: architecture

**Input:**
```json
{
  "text": "architecture"
}
```

**Status:** ✅ PASS

**Output:**
```json
[
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" introduces fundamental design patterns for object-oriented programming, featuring a catalog of creational, structural, and behavioral patterns, illustrated through a document editor case study, along with introductory concepts, discussions, and supporting resources like a glossary and CD preface.\n\nKey Concepts: design pattern, pattern intent, pattern problem, pattern solution, pattern consequences, pattern structure, pattern participants, pattern collaborations, pattern implementation, pattern sample code, catalog classification, creational patterns, structural patterns, behavioral patterns, class patterns, object patterns, program to an interface not an implementation, favor object composition over class inheritance, delegation, model view controller, observer pattern, composite pattern, strategy pattern, decorator pattern, transparent enclosure, mono glyph, compositor, composition, te x compositor, discretionary glyph, visitor pattern, accept operation, iterator pattern, create iterator, preorder iterator, null iterator, command pattern, command history, undo and redo mechanism, memento pattern, spell checking visitor, hyphenation visitor, glyph abstraction, glyph operations, document structure, recursive composition, transparent decoration, look and feel abstraction, abstract factory pattern, factory method pattern, builder pattern, prototype pattern, singleton pattern, maze example, factory as singleton, prototype manager, deep versus shallow copy, handle body idiom, window abstraction, window implementation, bridge pattern, window system factory, adapter pattern, class adapter, object adapter, pluggable adapter, two way adapter, facade pattern, subsystem public interface, flyweight pattern, intrinsic state, extrinsic state, flyweight factory, proxy pattern, proxy uses, bridge versus adapter, decorator versus strategy, inheritance versus composition, class versus interface inheritance, parameterized types and templates, run time versus compile time structure, aggregation versus acquaintance, design for change, framework, toolkit, application design concerns, mvc view nesting, controller encapsulation, spelling algorithm strategy, hyphenation algorithm, text layout, formatter cache, visitor trade offs, accessor operations, null object, registry, reference counting, layering, algorithm encapsulation, open closed principle, client configurability, sample code localization, design patterns, object-oriented design, software architecture, encapsulating variation, decoupling senders and receivers, refactoring lifecycle, pattern language, separation of concerns, code reuse, glyph context, btree font mapping, glyph factory, character glyph, virtual proxy, image proxy, remote proxy, protection proxy, smart reference, operator overloading for proxy, doesnotunderstand forwarding, undo and redo, macro command, simple command template, originator caretaker, incremental mementos, subject observer mapping, push pull notification, change manager, chain of responsibility pattern, help handler, request as object, mediator pattern, colleague, dialog director, external iterator, internal iterator, cursor iterator, robust iterator, iterator pointer proxy, double dispatch, interpreter pattern, abstract syntax tree, terminal nonterminal expressions, parsing strategies, double-dispatch alternatives, template method pattern, hook operations, strategy as template parameter, state pattern, state sharing, tcp connection state machine, proxy decorator comparison, adapter bridge comparison, factory method, layout objects as flyweights, copy on write, save load persistence, logging and recovery, transaction modeling, iterator state memento, collection iteration state, internal composition repair, compositor interface, tex compositor, simple compositor, array compositor, regular expressions interpreter, input state sets, boolean expression interpreter, replace operation, evaluate operation, context mapping, composite traversal variants, visitor traversal responsibility, accumulating visitor state, breaking encapsulation tradeoff, double dispatch table, command history list, unidraw interpretation chaining, robust traversal under modification, smalltalk internal iterator blocks, resource acquisition is initialization, friend based memento access, doesnotunderstand performance caveat, delegation alternative\nCategories: software engineering, object oriented design, software architecture, human computer interaction, programming languages, object-oriented programming, human-computer interaction",
    "scores": {
      "hybrid": "0.315",
      "vector": "0.000",
      "bm25": "0.461",
      "title": "0.000",
      "concept": "1.000",
      "wordnet": "0.500"
    },
    "expanded_terms": [
      "architecture",
      "software",
      "computer architecture",
      "structure"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through modular decomposition, deep abstractions, information hiding, and strategic practices, derived from the author's Stanford course on creating maintainable and effective code.\n\nKey Concepts: \nCategories: General",
    "scores": {
      "hybrid": "0.303",
      "vector": "0.000",
      "bm25": "0.412",
      "title": "1.000",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "architecture",
      "software",
      "computer architecture",
      "structure"
    ]
  },
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "summary": "Thinking in Systems is a primer by Donella H. Meadows that introduces foundational concepts of systems thinking, exploring system structures and behaviors, their surprising dynamics and traps, leverage points for intervention, and practical guidelines for navigating complex real-world systems, drawing from decades of modeling and interdisciplinary wisdom.\n\nKey Concepts: systems thinking, system dynamics, complexity science, sustainability science, resilience, self-organization, hierarchy, feedback loops, stocks and flows, balancing feedback loop, reinforcing feedback loop, delays, nonlinearity, limits to growth, carrying capacity, overshoot, archetypes, policy resistance, tragedy of the commons, shifting the burden, success to the successful, escalation, drift to low performance, rule beating, bounded rationality, stocks as system memory, buffers, information flows, decision delays, behavior over time graphs, boundary selection, modeling and simulation, scenario analysis, sensitivity analysis, model validation, behavior archetypes catalog, feedback policies, leverage analysis, stocks and flows structure redesign, goal alignment, intrinsic responsibility, meta-resilience, information transparency, model-based learning, adaptive management, participatory modeling, system mapping, time horizon expansion, systems literacy, mental model transparency, heuristic of behavior first, stock-and-flow modeling, causal loop diagramming, doubling time rule, exponential growth, renewable resource constraint, nonrenewable resource depletion, externalities, carrying capacity erosion, feedback signal placement, goal specification, paradigm change, transcending paradigms, fractal geometry, hierarchical decomposition, time discounting critique, leverage points list, model equation transparency, overshoot and oscillation mitigation, ecosystem services framing, civic feedback mechanisms, error embracing, long-term investment in adaptive capacity, systems education, ethics of systemic responsibility, sustainable living, global modeling, sustainable development, global commons stewardship, cultural change through publishing, citizen empowerment, environmental education, long-term foresight, interconnectedness of social and environmental systems, stewardship ethics, organizational learning, systems dynamics modeling, feedback loop analysis, scenario planning, integrated assessment, resilience assessment, transdisciplinary research, sustainability indicators, leverage points analysis, systems archetypes, ecological economics framework, policy analysis for sustainability, community-based stewardship models, slow money investment framework, toxicology communication, life-cycle assessment, regenerative agriculture practices, local food systems finance, earth system science, gaia hypothesis integration, science communication strategies, environmental journalism, public-facing scholarship, catalog distribution strategies, book foreword as credibility device, paperback publishing format, weekly opinion column, environmental studies curriculum, peer recognition mechanisms, nonprofit institute incubation, holocene perspective, future-history narratives, interdisciplinary dialogue formats, toxicity risk framing, supply chain sustainability, ecological footprint accounting, population-resource dynamics, carrying capacity concept, exponential growth dynamics, overshoot and collapse pattern, mitigation and adaptation strategies, environmental governance mechanisms, market-based environmental tools, nonmarket valuation methods, behavioral change communication, community resilience building, soil fertility management, place-based investment, food-system sustainability, scientific intuition integration, popular science dialogues, reflective environmental essays, publisher mission-driven curation, accessible pricing strategies, catalog outreach channels, book-based public engagement, educational forewords, catalog curation for interdisciplinary audiences, accessibility via paperback editions, communication of scientific authority, intergenerational equity, systems pedagogy, public mobilization through narrative, environmental ethics communication, scholar-to-public translation, mission-aligned marketing, strategic book selection\nCategories: systems thinking, system dynamics and modeling, sustainability science, organizational management and policy, complexity and resilience science, sustainability studies, systems science",
    "scores": {
      "hybrid": "0.087",
      "vector": "0.000",
      "bm25": "0.149",
      "title": "0.000",
      "concept": "0.000",
      "wordnet": "0.500"
    },
    "expanded_terms": [
      "architecture",
      "software",
      "computer architecture",
      "structure"
    ]
  }
]
```

### Test 2.3: system

**Input:**
```json
{
  "text": "system"
}
```

**Status:** ✅ PASS

**Output:**
```json
[
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "summary": "Thinking in Systems is a primer by Donella H. Meadows that introduces foundational concepts of systems thinking, exploring system structures and behaviors, their surprising dynamics and traps, leverage points for intervention, and practical guidelines for navigating complex real-world systems, drawing from decades of modeling and interdisciplinary wisdom.\n\nKey Concepts: systems thinking, system dynamics, complexity science, sustainability science, resilience, self-organization, hierarchy, feedback loops, stocks and flows, balancing feedback loop, reinforcing feedback loop, delays, nonlinearity, limits to growth, carrying capacity, overshoot, archetypes, policy resistance, tragedy of the commons, shifting the burden, success to the successful, escalation, drift to low performance, rule beating, bounded rationality, stocks as system memory, buffers, information flows, decision delays, behavior over time graphs, boundary selection, modeling and simulation, scenario analysis, sensitivity analysis, model validation, behavior archetypes catalog, feedback policies, leverage analysis, stocks and flows structure redesign, goal alignment, intrinsic responsibility, meta-resilience, information transparency, model-based learning, adaptive management, participatory modeling, system mapping, time horizon expansion, systems literacy, mental model transparency, heuristic of behavior first, stock-and-flow modeling, causal loop diagramming, doubling time rule, exponential growth, renewable resource constraint, nonrenewable resource depletion, externalities, carrying capacity erosion, feedback signal placement, goal specification, paradigm change, transcending paradigms, fractal geometry, hierarchical decomposition, time discounting critique, leverage points list, model equation transparency, overshoot and oscillation mitigation, ecosystem services framing, civic feedback mechanisms, error embracing, long-term investment in adaptive capacity, systems education, ethics of systemic responsibility, sustainable living, global modeling, sustainable development, global commons stewardship, cultural change through publishing, citizen empowerment, environmental education, long-term foresight, interconnectedness of social and environmental systems, stewardship ethics, organizational learning, systems dynamics modeling, feedback loop analysis, scenario planning, integrated assessment, resilience assessment, transdisciplinary research, sustainability indicators, leverage points analysis, systems archetypes, ecological economics framework, policy analysis for sustainability, community-based stewardship models, slow money investment framework, toxicology communication, life-cycle assessment, regenerative agriculture practices, local food systems finance, earth system science, gaia hypothesis integration, science communication strategies, environmental journalism, public-facing scholarship, catalog distribution strategies, book foreword as credibility device, paperback publishing format, weekly opinion column, environmental studies curriculum, peer recognition mechanisms, nonprofit institute incubation, holocene perspective, future-history narratives, interdisciplinary dialogue formats, toxicity risk framing, supply chain sustainability, ecological footprint accounting, population-resource dynamics, carrying capacity concept, exponential growth dynamics, overshoot and collapse pattern, mitigation and adaptation strategies, environmental governance mechanisms, market-based environmental tools, nonmarket valuation methods, behavioral change communication, community resilience building, soil fertility management, place-based investment, food-system sustainability, scientific intuition integration, popular science dialogues, reflective environmental essays, publisher mission-driven curation, accessible pricing strategies, catalog outreach channels, book-based public engagement, educational forewords, catalog curation for interdisciplinary audiences, accessibility via paperback editions, communication of scientific authority, intergenerational equity, systems pedagogy, public mobilization through narrative, environmental ethics communication, scholar-to-public translation, mission-aligned marketing, strategic book selection\nCategories: systems thinking, system dynamics and modeling, sustainability science, organizational management and policy, complexity and resilience science, sustainability studies, systems science",
    "scores": {
      "hybrid": "0.324",
      "vector": "0.000",
      "bm25": "0.457",
      "title": "0.500",
      "concept": "0.731",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "system",
      "dynamics",
      "mapping",
      "earth",
      "science",
      "window",
      "factory",
      "stocks",
      "memory",
      "rewards"
    ]
  },
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" introduces fundamental design patterns for object-oriented programming, featuring a catalog of creational, structural, and behavioral patterns, illustrated through a document editor case study, along with introductory concepts, discussions, and supporting resources like a glossary and CD preface.\n\nKey Concepts: design pattern, pattern intent, pattern problem, pattern solution, pattern consequences, pattern structure, pattern participants, pattern collaborations, pattern implementation, pattern sample code, catalog classification, creational patterns, structural patterns, behavioral patterns, class patterns, object patterns, program to an interface not an implementation, favor object composition over class inheritance, delegation, model view controller, observer pattern, composite pattern, strategy pattern, decorator pattern, transparent enclosure, mono glyph, compositor, composition, te x compositor, discretionary glyph, visitor pattern, accept operation, iterator pattern, create iterator, preorder iterator, null iterator, command pattern, command history, undo and redo mechanism, memento pattern, spell checking visitor, hyphenation visitor, glyph abstraction, glyph operations, document structure, recursive composition, transparent decoration, look and feel abstraction, abstract factory pattern, factory method pattern, builder pattern, prototype pattern, singleton pattern, maze example, factory as singleton, prototype manager, deep versus shallow copy, handle body idiom, window abstraction, window implementation, bridge pattern, window system factory, adapter pattern, class adapter, object adapter, pluggable adapter, two way adapter, facade pattern, subsystem public interface, flyweight pattern, intrinsic state, extrinsic state, flyweight factory, proxy pattern, proxy uses, bridge versus adapter, decorator versus strategy, inheritance versus composition, class versus interface inheritance, parameterized types and templates, run time versus compile time structure, aggregation versus acquaintance, design for change, framework, toolkit, application design concerns, mvc view nesting, controller encapsulation, spelling algorithm strategy, hyphenation algorithm, text layout, formatter cache, visitor trade offs, accessor operations, null object, registry, reference counting, layering, algorithm encapsulation, open closed principle, client configurability, sample code localization, design patterns, object-oriented design, software architecture, encapsulating variation, decoupling senders and receivers, refactoring lifecycle, pattern language, separation of concerns, code reuse, glyph context, btree font mapping, glyph factory, character glyph, virtual proxy, image proxy, remote proxy, protection proxy, smart reference, operator overloading for proxy, doesnotunderstand forwarding, undo and redo, macro command, simple command template, originator caretaker, incremental mementos, subject observer mapping, push pull notification, change manager, chain of responsibility pattern, help handler, request as object, mediator pattern, colleague, dialog director, external iterator, internal iterator, cursor iterator, robust iterator, iterator pointer proxy, double dispatch, interpreter pattern, abstract syntax tree, terminal nonterminal expressions, parsing strategies, double-dispatch alternatives, template method pattern, hook operations, strategy as template parameter, state pattern, state sharing, tcp connection state machine, proxy decorator comparison, adapter bridge comparison, factory method, layout objects as flyweights, copy on write, save load persistence, logging and recovery, transaction modeling, iterator state memento, collection iteration state, internal composition repair, compositor interface, tex compositor, simple compositor, array compositor, regular expressions interpreter, input state sets, boolean expression interpreter, replace operation, evaluate operation, context mapping, composite traversal variants, visitor traversal responsibility, accumulating visitor state, breaking encapsulation tradeoff, double dispatch table, command history list, unidraw interpretation chaining, robust traversal under modification, smalltalk internal iterator blocks, resource acquisition is initialization, friend based memento access, doesnotunderstand performance caveat, delegation alternative\nCategories: software engineering, object oriented design, software architecture, human computer interaction, programming languages, object-oriented programming, human-computer interaction",
    "scores": {
      "hybrid": "0.113",
      "vector": "0.000",
      "bm25": "0.267",
      "title": "0.000",
      "concept": "0.308",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "system",
      "dynamics",
      "mapping",
      "earth",
      "science",
      "window",
      "factory",
      "stocks",
      "memory",
      "rewards"
    ]
  },
  {
    "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
    "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a historical biography of the ancient Chinese military strategist Sun Tzu, including Ssu-ma Ch'ien's account of his demonstration of discipline by training the King of Wu's concubines, his military successes against rival states, references to his descendant Sun Pin, and the opening lines of the first chapter on \"Laying Plans,\" emphasizing war's vital importance to the state.\n\nKey Concepts: military strategy, deception tactics, moral law, heaven and weather analysis, earth and terrain analysis, commander virtues, method and discipline, logistics and supply management, rapidity and timing, strategic intelligence, spy operations, types of spies, converted spies, doomed spies, local spies, inward spies, surviving spies, planning and calculation, seven considerations assessment, assessment of strengths and weaknesses, direct and indirect maneuvering, cheng and chi maneuver theory, tactical dispositions, concentration and dispersal of forces, force multiplication and combined energy, feints and baits, ambush tactics, divide and conquer, siege warfare principles, attack by stratagem, attack by fire, environmental exploitation, use of signals and communication, gongs drums flags signaling, battlefield reconnaissance, scouting indicators, morale management, rewards and punishments system, discipline enforcement, command and control, unity of command, use of captured troops, foraging on the enemy, cost of war and economic impact, avoiding protracted warfare, measurement estimation calculation balancing, balancing of chances, tactical flexibility and variation, nine situations framework, six types of terrain classification, maneuvering artifice of deviation, positioning and high ground, river and water warfare, marching and encampment doctrine, night operations and timing, use of weather and seasons, use of local guides, intelligence from spies vs. divination, concealment and secrecy, simulated disorder, masking strength with weakness, psychological operations, provoking and irritating enemy, exploiting enemy temperament, supply line protection, alliance management and diplomacy, strategic patience and opportunism, killing commander strategy, unity of spirit in army, selection and employment of officers, punishment of leaders for failure, reading signs and omens, terrain-based tactics, forced marches and limits, husbanding strength and economy, encirclement and leaving an outlet, deception of own troops, controlling information and secrecy, reward distribution and plunder policy, leadership conduct and morale, mobilization and concentration, dispersive and facile ground tactics, cutting communications, timing of attacks by stars and days, fire attack seasonality, integration of civil and military spheres, calculation of probabilities, using natural elements as metaphors for tactics, strategic surprise, operational security and counterintelligence\nCategories: military strategy, intelligence studies, operations research, logistics and supply chain, organizational leadership, security studies",
    "scores": {
      "hybrid": "0.108",
      "vector": "0.000",
      "bm25": "0.249",
      "title": "0.000",
      "concept": "0.308",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "system",
      "dynamics",
      "mapping",
      "earth",
      "science",
      "window",
      "factory",
      "stocks",
      "memory",
      "rewards"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through modular decomposition, deep abstractions, information hiding, and strategic practices, derived from the author's Stanford course on creating maintainable and effective code.\n\nKey Concepts: \nCategories: General",
    "scores": {
      "hybrid": "0.045",
      "vector": "0.000",
      "bm25": "0.180",
      "title": "0.000",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "system",
      "dynamics",
      "mapping",
      "earth",
      "science",
      "window",
      "factory",
      "stocks",
      "memory",
      "rewards"
    ]
  }
]
```

### Test 2.4: pattern

**Input:**
```json
{
  "text": "pattern"
}
```

**Status:** ✅ PASS

**Output:**
```json
[
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" introduces fundamental design patterns for object-oriented programming, featuring a catalog of creational, structural, and behavioral patterns, illustrated through a document editor case study, along with introductory concepts, discussions, and supporting resources like a glossary and CD preface.\n\nKey Concepts: design pattern, pattern intent, pattern problem, pattern solution, pattern consequences, pattern structure, pattern participants, pattern collaborations, pattern implementation, pattern sample code, catalog classification, creational patterns, structural patterns, behavioral patterns, class patterns, object patterns, program to an interface not an implementation, favor object composition over class inheritance, delegation, model view controller, observer pattern, composite pattern, strategy pattern, decorator pattern, transparent enclosure, mono glyph, compositor, composition, te x compositor, discretionary glyph, visitor pattern, accept operation, iterator pattern, create iterator, preorder iterator, null iterator, command pattern, command history, undo and redo mechanism, memento pattern, spell checking visitor, hyphenation visitor, glyph abstraction, glyph operations, document structure, recursive composition, transparent decoration, look and feel abstraction, abstract factory pattern, factory method pattern, builder pattern, prototype pattern, singleton pattern, maze example, factory as singleton, prototype manager, deep versus shallow copy, handle body idiom, window abstraction, window implementation, bridge pattern, window system factory, adapter pattern, class adapter, object adapter, pluggable adapter, two way adapter, facade pattern, subsystem public interface, flyweight pattern, intrinsic state, extrinsic state, flyweight factory, proxy pattern, proxy uses, bridge versus adapter, decorator versus strategy, inheritance versus composition, class versus interface inheritance, parameterized types and templates, run time versus compile time structure, aggregation versus acquaintance, design for change, framework, toolkit, application design concerns, mvc view nesting, controller encapsulation, spelling algorithm strategy, hyphenation algorithm, text layout, formatter cache, visitor trade offs, accessor operations, null object, registry, reference counting, layering, algorithm encapsulation, open closed principle, client configurability, sample code localization, design patterns, object-oriented design, software architecture, encapsulating variation, decoupling senders and receivers, refactoring lifecycle, pattern language, separation of concerns, code reuse, glyph context, btree font mapping, glyph factory, character glyph, virtual proxy, image proxy, remote proxy, protection proxy, smart reference, operator overloading for proxy, doesnotunderstand forwarding, undo and redo, macro command, simple command template, originator caretaker, incremental mementos, subject observer mapping, push pull notification, change manager, chain of responsibility pattern, help handler, request as object, mediator pattern, colleague, dialog director, external iterator, internal iterator, cursor iterator, robust iterator, iterator pointer proxy, double dispatch, interpreter pattern, abstract syntax tree, terminal nonterminal expressions, parsing strategies, double-dispatch alternatives, template method pattern, hook operations, strategy as template parameter, state pattern, state sharing, tcp connection state machine, proxy decorator comparison, adapter bridge comparison, factory method, layout objects as flyweights, copy on write, save load persistence, logging and recovery, transaction modeling, iterator state memento, collection iteration state, internal composition repair, compositor interface, tex compositor, simple compositor, array compositor, regular expressions interpreter, input state sets, boolean expression interpreter, replace operation, evaluate operation, context mapping, composite traversal variants, visitor traversal responsibility, accumulating visitor state, breaking encapsulation tradeoff, double dispatch table, command history list, unidraw interpretation chaining, robust traversal under modification, smalltalk internal iterator blocks, resource acquisition is initialization, friend based memento access, doesnotunderstand performance caveat, delegation alternative\nCategories: software engineering, object oriented design, software architecture, human computer interaction, programming languages, object-oriented programming, human-computer interaction",
    "scores": {
      "hybrid": "0.393",
      "vector": "0.000",
      "bm25": "0.570",
      "title": "0.500",
      "concept": "1.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "pattern",
      "intent",
      "participants",
      "problem",
      "proxy",
      "language",
      "implementation",
      "collaborations",
      "consequences",
      "design"
    ]
  },
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "summary": "Thinking in Systems is a primer by Donella H. Meadows that introduces foundational concepts of systems thinking, exploring system structures and behaviors, their surprising dynamics and traps, leverage points for intervention, and practical guidelines for navigating complex real-world systems, drawing from decades of modeling and interdisciplinary wisdom.\n\nKey Concepts: systems thinking, system dynamics, complexity science, sustainability science, resilience, self-organization, hierarchy, feedback loops, stocks and flows, balancing feedback loop, reinforcing feedback loop, delays, nonlinearity, limits to growth, carrying capacity, overshoot, archetypes, policy resistance, tragedy of the commons, shifting the burden, success to the successful, escalation, drift to low performance, rule beating, bounded rationality, stocks as system memory, buffers, information flows, decision delays, behavior over time graphs, boundary selection, modeling and simulation, scenario analysis, sensitivity analysis, model validation, behavior archetypes catalog, feedback policies, leverage analysis, stocks and flows structure redesign, goal alignment, intrinsic responsibility, meta-resilience, information transparency, model-based learning, adaptive management, participatory modeling, system mapping, time horizon expansion, systems literacy, mental model transparency, heuristic of behavior first, stock-and-flow modeling, causal loop diagramming, doubling time rule, exponential growth, renewable resource constraint, nonrenewable resource depletion, externalities, carrying capacity erosion, feedback signal placement, goal specification, paradigm change, transcending paradigms, fractal geometry, hierarchical decomposition, time discounting critique, leverage points list, model equation transparency, overshoot and oscillation mitigation, ecosystem services framing, civic feedback mechanisms, error embracing, long-term investment in adaptive capacity, systems education, ethics of systemic responsibility, sustainable living, global modeling, sustainable development, global commons stewardship, cultural change through publishing, citizen empowerment, environmental education, long-term foresight, interconnectedness of social and environmental systems, stewardship ethics, organizational learning, systems dynamics modeling, feedback loop analysis, scenario planning, integrated assessment, resilience assessment, transdisciplinary research, sustainability indicators, leverage points analysis, systems archetypes, ecological economics framework, policy analysis for sustainability, community-based stewardship models, slow money investment framework, toxicology communication, life-cycle assessment, regenerative agriculture practices, local food systems finance, earth system science, gaia hypothesis integration, science communication strategies, environmental journalism, public-facing scholarship, catalog distribution strategies, book foreword as credibility device, paperback publishing format, weekly opinion column, environmental studies curriculum, peer recognition mechanisms, nonprofit institute incubation, holocene perspective, future-history narratives, interdisciplinary dialogue formats, toxicity risk framing, supply chain sustainability, ecological footprint accounting, population-resource dynamics, carrying capacity concept, exponential growth dynamics, overshoot and collapse pattern, mitigation and adaptation strategies, environmental governance mechanisms, market-based environmental tools, nonmarket valuation methods, behavioral change communication, community resilience building, soil fertility management, place-based investment, food-system sustainability, scientific intuition integration, popular science dialogues, reflective environmental essays, publisher mission-driven curation, accessible pricing strategies, catalog outreach channels, book-based public engagement, educational forewords, catalog curation for interdisciplinary audiences, accessibility via paperback editions, communication of scientific authority, intergenerational equity, systems pedagogy, public mobilization through narrative, environmental ethics communication, scholar-to-public translation, mission-aligned marketing, strategic book selection\nCategories: systems thinking, system dynamics and modeling, sustainability science, organizational management and policy, complexity and resilience science, sustainability studies, systems science",
    "scores": {
      "hybrid": "0.046",
      "vector": "0.000",
      "bm25": "0.125",
      "title": "0.000",
      "concept": "0.100",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "pattern",
      "intent",
      "participants",
      "problem",
      "proxy",
      "language",
      "implementation",
      "collaborations",
      "consequences",
      "design"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through modular decomposition, deep abstractions, information hiding, and strategic practices, derived from the author's Stanford course on creating maintainable and effective code.\n\nKey Concepts: \nCategories: General",
    "scores": {
      "hybrid": "0.042",
      "vector": "0.000",
      "bm25": "0.169",
      "title": "0.000",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "pattern",
      "intent",
      "participants",
      "problem",
      "proxy",
      "language",
      "implementation",
      "collaborations",
      "consequences",
      "design"
    ]
  },
  {
    "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
    "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a historical biography of the ancient Chinese military strategist Sun Tzu, including Ssu-ma Ch'ien's account of his demonstration of discipline by training the King of Wu's concubines, his military successes against rival states, references to his descendant Sun Pin, and the opening lines of the first chapter on \"Laying Plans,\" emphasizing war's vital importance to the state.\n\nKey Concepts: military strategy, deception tactics, moral law, heaven and weather analysis, earth and terrain analysis, commander virtues, method and discipline, logistics and supply management, rapidity and timing, strategic intelligence, spy operations, types of spies, converted spies, doomed spies, local spies, inward spies, surviving spies, planning and calculation, seven considerations assessment, assessment of strengths and weaknesses, direct and indirect maneuvering, cheng and chi maneuver theory, tactical dispositions, concentration and dispersal of forces, force multiplication and combined energy, feints and baits, ambush tactics, divide and conquer, siege warfare principles, attack by stratagem, attack by fire, environmental exploitation, use of signals and communication, gongs drums flags signaling, battlefield reconnaissance, scouting indicators, morale management, rewards and punishments system, discipline enforcement, command and control, unity of command, use of captured troops, foraging on the enemy, cost of war and economic impact, avoiding protracted warfare, measurement estimation calculation balancing, balancing of chances, tactical flexibility and variation, nine situations framework, six types of terrain classification, maneuvering artifice of deviation, positioning and high ground, river and water warfare, marching and encampment doctrine, night operations and timing, use of weather and seasons, use of local guides, intelligence from spies vs. divination, concealment and secrecy, simulated disorder, masking strength with weakness, psychological operations, provoking and irritating enemy, exploiting enemy temperament, supply line protection, alliance management and diplomacy, strategic patience and opportunism, killing commander strategy, unity of spirit in army, selection and employment of officers, punishment of leaders for failure, reading signs and omens, terrain-based tactics, forced marches and limits, husbanding strength and economy, encirclement and leaving an outlet, deception of own troops, controlling information and secrecy, reward distribution and plunder policy, leadership conduct and morale, mobilization and concentration, dispersive and facile ground tactics, cutting communications, timing of attacks by stars and days, fire attack seasonality, integration of civil and military spheres, calculation of probabilities, using natural elements as metaphors for tactics, strategic surprise, operational security and counterintelligence\nCategories: military strategy, intelligence studies, operations research, logistics and supply chain, organizational leadership, security studies",
    "scores": {
      "hybrid": "0.026",
      "vector": "0.000",
      "bm25": "0.105",
      "title": "0.000",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "pattern",
      "intent",
      "participants",
      "problem",
      "proxy",
      "language",
      "implementation",
      "collaborations",
      "consequences",
      "design"
    ]
  }
]
```

---

## 3. broad_chunks_search

Hybrid scoring for chunks: 35% vector, 35% BM25, 15% concept, 15% WordNet (no title)

### Test 3.1: Military (Art of War)

**Input:**
```json
{
  "text": "military strategy victory",
  "limit": 5
}
```

**Status:** ✅ PASS

**Output:**
```json
[
  {
    "text": "[Ho Shih thus expounds the paradox:  \"In warfare, first lay plans which\nwill ensure victory, and then lead your army to battle;  if you will not begin\nwith stratagem but rely on brute strength alone, victory will no longer be\nassured.\"]\n     16.  The consummate leader cultivates the moral law,  and strictly adheres\nto method and discipline; thus it is in his power to control success.\n     17.  In respect of military method,  we have,  firstly, Measurement;",
    "source": "",
    "scores": {
      "hybrid": "0.115",
      "vector": "0.000",
      "bm25": "0.248",
      "concept": "0.077",
      "wordnet": "0.111"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "a decorator as a skin over an object that changes its behavior. An \nalternative is to change the object's guts. The Strategy (349) pattern is \na good example of a pattern for changing the guts.  \nStrategies are a better choice in situations where the Component class is \nintrinsically heavyweight, thereby making the Decorator pattern too costly \nto apply. In the Strategy pattern, the component forwards some of its \nbehavior to a separate strategy object. The Strategy pattern lets us alter",
    "source": "",
    "scores": {
      "hybrid": "0.111",
      "vector": "0.000",
      "bm25": "0.251",
      "concept": "0.154",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "void Composition::Repair () { \n switch (_breakingStrategy) { \n case SimpleStrategy: \n  ComposeWithSimpleCompositor(); \n  break; \n case TeXStrategy: \n  ComposeWithTeXCompositor(); \n  break; \n  // ... \n } \n // merge results with existing composition, if necessary     \n} \nThe Strategy pattern eliminates this case statement by delegating \nthelinebreaking task to a Strategy object: \nvoid Composition::Repair () { \n  _compositor->Compose(); \n  // merge results with existing composition, if necessary",
    "source": "",
    "scores": {
      "hybrid": "0.104",
      "vector": "0.000",
      "bm25": "0.264",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "By the way, Layout objects are essentially strategies (see Strategy (349)). They \nare an example of a strategy object implemented as a flyweight. \nRelated Patterns \nThe Flyweight pattern is often combined with the Composite (183) pattern to \nimplement a logically hierarchical structure in terms of a directed-acyclic graph \nwith shared leaf nodes.",
    "source": "",
    "scores": {
      "hybrid": "0.103",
      "vector": "0.000",
      "bm25": "0.261",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "object and delegating requests to it. The Strategy (349) pattern encapsulates \nan algorithm in anobject. Strategy makes it easy to specify and change the algorithm \nanobject uses. The Command (263) pattern encapsulates arequest in an object so \nthat it can be passed as a parameter, storedon a history list, or manipulated \nin other ways. The State (338) pattern encapsulates the states of an objectso \nthat the object can change its behavior when its state object changes. Visitor",
    "source": "",
    "scores": {
      "hybrid": "0.101",
      "vector": "0.000",
      "bm25": "0.223",
      "concept": "0.154",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n207 \nComposite (183): A decorator can be viewed as a degenerate composite with only \none component. However, a decorator adds additional responsibilities—it isn't \nintended for object aggregation. \nStrategy (349): A decorator lets you change the skin of an object; a strategy \nlets you change the guts. These are two alternative ways of changing an object.",
    "source": "",
    "scores": {
      "hybrid": "0.098",
      "vector": "0.000",
      "bm25": "0.215",
      "concept": "0.154",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "o maintains a reference to a Strategy object. \no may define an interface that lets Strategy access its data. \nCollaborations \n• Strategy and Context interact to implement the chosen algorithm. Acontext \nmay pass all data required by the algorithm to the strategywhen the algorithm \nis called. Alternatively, the context can passitself as an argument to \nStrategy operations. That lets the strategycall back on the context as \nrequired.",
    "source": "",
    "scores": {
      "hybrid": "0.098",
      "vector": "0.000",
      "bm25": "0.246",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "or extend the component's functionality by replacing the strategy object. \nFor example, we can support different border styles by having the component \ndefer border-drawing to a separate Border object. The Border object is a \nStrategy object that encapsulates a border-drawing strategy. By extending \nthe number of strategies from just one to an open-ended list, we achieve \nthe same effect as nesting decorators recursively. \nIn MacApp 3.0 [App89] and Bedrock [Sym93a], for example, graphical",
    "source": "",
    "scores": {
      "hybrid": "0.097",
      "vector": "0.000",
      "bm25": "0.197",
      "concept": "0.077",
      "wordnet": "0.111"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "extend. \n3. Strategies eliminate conditional statements.The Strategy pattern offers \nan alternative to conditional statements forselecting desired behavior. \nWhen different behaviors are lumped into oneclass, it's hard to avoid using \nconditional statements to select theright behavior. Encapsulating the \nbehavior in separate Strategy classeseliminates these conditional \nstatements. \nFor example, without strategies, the code for breakingtext into lines could \nlook like",
    "source": "",
    "scores": {
      "hybrid": "0.095",
      "vector": "0.000",
      "bm25": "0.239",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "victory will not stand in doubt;  if you know Heaven and know Earth, you\nmay make your victory complete.\n     [Li Ch`uan sums up as follows:  \"Given a knowledge of three things--the\naffairs of men, the seasons of heaven and the natural advantages of earth--,\nvictory will invariably crown   your battles.\"]",
    "source": "",
    "scores": {
      "hybrid": "0.095",
      "vector": "0.000",
      "bm25": "0.270",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "at run-time by adding asingle SetCompositor operation to Composition's basic \nglyphinterface. \nStrategy Pattern \nEncapsulating an algorithm in an object is the intent of the Strategy (349) pattern. \nThe key participants in thepattern are Strategy objects (which encapsulate \ndifferent algorithms)and the context in which they operate. Compositors are",
    "source": "",
    "scores": {
      "hybrid": "0.094",
      "vector": "0.000",
      "bm25": "0.236",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "strategies as statelessobjects that contexts can share. Any residual state \nis maintained by thecontext, which passes it in each request to the Strategy \nobject. Sharedstrategies should not maintain state across invocations. The \nFlyweight (218) pattern describes this approach in moredetail. \nImplementation \nConsider the following implementation issues: \n1. Defining the Strategy and Context interfaces.The Strategy and Context",
    "source": "",
    "scores": {
      "hybrid": "0.094",
      "vector": "0.000",
      "bm25": "0.234",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "}; \n \nContext<MyStrategy> aContext; \nWith templates, there's no need to define an abstract class that defines \nthe interface to the Strategy. Using Strategy as atemplate parameter also \nlets you bind a Strategy to itsContext statically, which can increase \nefficiency. \n3. Making Strategy objects optional.The Context class may be simplified if \nit's meaningful not tohave a Strategy object. Context checks to see if it \nhas a Strategyobject before accessing it. If there is one, then Context",
    "source": "",
    "scores": {
      "hybrid": "0.092",
      "vector": "0.000",
      "bm25": "0.231",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n56 \nstrategies;they encapsulate different formatting algorithms. A composition is \nthecontext for a compositor strategy. \nThe key to applying the Strategy pattern is designing interfaces forthe strategy \nand its context that are general enough to support arange of algorithms. You \nshouldn't have to change the strategy orcontext interface to support a new",
    "source": "",
    "scores": {
      "hybrid": "0.092",
      "vector": "0.000",
      "bm25": "0.230",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "(183), Decorator (196), Observer (326), Strategy (349). \n8. Inability to alter classes conveniently. Sometimes you have to modify a \nclass that can't be modified conveniently. Perhaps you need the source code \nand don't have it (as may be the case with a commercial class library).",
    "source": "",
    "scores": {
      "hybrid": "0.090",
      "vector": "0.000",
      "bm25": "0.191",
      "concept": "0.154",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "drawback in that a client must understandhow Strategies differ before it \ncan select the appropriate one.Clients might be exposed to implementation \nissues. Therefore youshould use the Strategy pattern only when the variation \nin behavior isrelevant to clients. \n6. Communication overhead between Strategy and Context.The Strategy interface \nis shared by all ConcreteStrategy classeswhether the algorithms they \nimplement are trivial or complex. Henceit's likely that some",
    "source": "",
    "scores": {
      "hybrid": "0.086",
      "vector": "0.000",
      "bm25": "0.213",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "Factory Methods (121) are often called by template methods. In the Motivation \nexample,the factory method DoCreateDocument is called by the template \nmethodOpenDocument. \nStrategy (349): Template methods use inheritance to vary part of an \nalgorithm.Strategies use delegation to vary the entire algorithm.",
    "source": "",
    "scores": {
      "hybrid": "0.086",
      "vector": "0.000",
      "bm25": "0.211",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n349 \nStrategy \nIntent \nDefine a family of algorithms, encapsulate each one, and make theminterchangeable. \nStrategy lets the algorithm vary independently fromclients that use it. \nAlso Known As \nPolicy \nMotivation \nMany algorithms exist for breaking a stream of text into lines.Hard-wiring all \nsuch algorithms into the classes that require themisn't desirable for several \nreasons:",
    "source": "",
    "scores": {
      "hybrid": "0.085",
      "vector": "0.000",
      "bm25": "0.210",
      "concept": "0.077",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "who relies solely on warlike measures shall be exterminated; he who relies\nsolely on peaceful measures shall perish. Instances of this are Fu Ch`ai on\nthe one hand and Yen Wang on the other. In military matters, the Sage's rule\nis normally to keep the peace, and to move his forces only when occasion\nrequires.  He will not use armed force unless driven to it by necessity.",
    "source": "",
    "scores": {
      "hybrid": "0.082",
      "vector": "0.000",
      "bm25": "0.186",
      "concept": "0.000",
      "wordnet": "0.111"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  },
  {
    "text": "is the negation of civil order!\"  The unpalatable fact remains, however, that\neven Imperial wishes must be subordinated to military necessity.]",
    "source": "",
    "scores": {
      "hybrid": "0.081",
      "vector": "0.000",
      "bm25": "0.232",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "pattern",
      "decorator",
      "versus",
      "spelling",
      "algorithm",
      "killing",
      "commander"
    ]
  }
]
```

### Test 3.2: Architecture (Clean Architecture)

**Input:**
```json
{
  "text": "software architecture layers",
  "limit": 5
}
```

**Status:** ✅ PASS

**Output:**
```json
[
  {
    "text": "independent of each other, so that a programmer can work on one module\nwithout having to understand the details of other modules.\nBecause software is  so malleable, software design is  a  continuous\nprocess that spans the entire lifecycle of  a  software system; this makes\nsoftware design different from the design of physical systems such as\nbuildings, ships, or bridges. However, software design has not always been\nviewed this way.  For much of  the history of  programming, design was",
    "source": "",
    "scores": {
      "hybrid": "0.168",
      "vector": "0.000",
      "bm25": "0.438",
      "concept": "0.000",
      "wordnet": "0.100"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "actually used. \nWith this book, the Gang of Four have made a seminalcontribution to software \nengineering. There is much to learnedfrom them, and much to be actively applied. \nGrady Booch \nChief Scientist, Rational Software Corporation",
    "source": "",
    "scores": {
      "hybrid": "0.140",
      "vector": "0.000",
      "bm25": "0.400",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "With this background, let’s  discuss in more detail what causes\ncomplexity, and how to make software systems simpler.",
    "source": "",
    "scores": {
      "hybrid": "0.139",
      "vector": "0.000",
      "bm25": "0.355",
      "concept": "0.000",
      "wordnet": "0.100"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n421 \nInstitut für Informatik, 1991. \n \n \n[Gam92] \nErich Gamma. Object-Oriented SoftwareDevelopment based on ET++: Design \nPatterns, Class Library, Tools (in German). Springer-Verlag,Berlin, 1992.\n \n \n[Gla90] \nAndrew Glassner. Graphics Gems.Academic Press, Boston, MA, 1990. \n \n \n[GM92] \nM. Graham and E. Mettala. TheDomain-\nSpecific Software Architecture \nProgram. In Proceedingsof DARPA Software Technology Conference, 1992, pages",
    "source": "",
    "scores": {
      "hybrid": "0.137",
      "vector": "0.000",
      "bm25": "0.392",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n395 \nSoftware Architecture programsponsored by the U.S. Department of Defense [GM92] \nconcentrates on gathering architectural information. Theknowledge-based software \nengineering community tries to representsoftware-related knowledge in general. \nThere are many other groupswith goals at least a little like ours. \nJames Coplien's Advanced C++: Programming Styles andIdioms [Cop92] has influenced",
    "source": "",
    "scores": {
      "hybrid": "0.137",
      "vector": "0.000",
      "bm25": "0.391",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "13. Comments should describe things that are not obvious from the\ncode (see p. 101 ).\n14. Software should be designed for ease of reading, not ease of\nwriting (see p. 149 ).",
    "source": "",
    "scores": {
      "hybrid": "0.135",
      "vector": "0.087",
      "bm25": "0.257",
      "concept": "0.000",
      "wordnet": "0.100"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n417 \nB. Adelson and E. Soloway. The role ofdomain experience in software design. \nIEEE Transactions onSoftware Engineering, 11(11):1351–1360, 1985. \n  \n[BE93] \nAndreas Birrer and Thomas Eggenschwiler. Frameworksin the financial \nengineering domain: An experience report. InEuropean Conference on \nObject-Oriented Programming,pages 21–35, Kaiserslautern, Germany, July \n1993.Springer-Verlag. \n \n \n[BJ94]",
    "source": "",
    "scores": {
      "hybrid": "0.135",
      "vector": "0.000",
      "bm25": "0.385",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n59 \n \n \nFigure 2.8:  Embellished object structure \nNote that we can reverse the order of composition, putting thebordered composition \ninto the Scroller instance. In that case theborder would be scrolled along with \nthe text, which may or may not bedesirable. The point is, transparent enclosure \nmakes it easy toexperiment with different alternatives, and it keeps clients free \nofembellishment code.",
    "source": "",
    "scores": {
      "hybrid": "0.134",
      "vector": "0.000",
      "bm25": "0.255",
      "concept": "0.000",
      "wordnet": "0.300"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n422 \n \n \n[ION94] \nIONA Technologies, Ltd., Dublin, Ireland.\nProgrammer's Guide for Orbix, \nVersion 1.2, 1994. \n \n \n[JCJO92] \nIvar Jacobson, Magnus Christerson, Patrik Jonsson,and Gunnar Overgaard. \nObject-Oriented Software Engineering—AUse Case Driven Approach. \nAddison-Wesley, Wokingham, England, 1992. \n \n \n[JF88] \nRalph E. Johnson and Brian Foote. Designingreusable classes. \nJournal of",
    "source": "",
    "scores": {
      "hybrid": "0.131",
      "vector": "0.000",
      "bm25": "0.374",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "15. The increments of software development should be abstractions,\nnot features (see p. 154 ).",
    "source": "",
    "scores": {
      "hybrid": "0.128",
      "vector": "0.000",
      "bm25": "0.365",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n415 \n    Rect(Point(0, 0), Point(0, 0));",
    "source": "",
    "scores": {
      "hybrid": "0.127",
      "vector": "0.000",
      "bm25": "0.362",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n40 \nThat makes it all the more important to avoid assumptions and dependencies that \ncan limit the toolkit's flexibility and consequently its applicability and \neffectiveness. \nFrameworks \nA framework is a set of cooperating classes that make up a reusable design for \na specific class of software [Deu89, JF88]. For example, a framework can be geared \ntoward building graphical editors for different domains like artistic drawing,",
    "source": "",
    "scores": {
      "hybrid": "0.123",
      "vector": "0.000",
      "bm25": "0.351",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n330 \nlayering), or it must be forced to live in one layer orthe other (which \nmight compromise the layering abstraction). \n2. Support for broadcast communication.Unlike an ordinary request, the \nnotification that a subject sendsneedn't specify its receiver. The \nnotification is broadcastautomatically to all interested objects that \nsubscribed to it. Thesubject doesn't care how many interested objects exist;",
    "source": "",
    "scores": {
      "hybrid": "0.118",
      "vector": "0.000",
      "bm25": "0.252",
      "concept": "0.000",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "feature, it  seems logical to  choose the  new  feature. However,  software\nprojects are almost always under time pressure, and there will always be\nthings that seem higher priority than writing comments. Thus, if you allow\ndocumentation to be de-prioritized, you’ll end up with no documentation.\nThe  counter-argument to  this  excuse is  the  investment mindset\ndiscussed on page 15 . If you want a clean software structure, which will",
    "source": "",
    "scores": {
      "hybrid": "0.108",
      "vector": "0.000",
      "bm25": "0.265",
      "concept": "0.000",
      "wordnet": "0.100"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "From Alexander's point of view, the patterns in this book do not forma pattern \nlanguage. Given the variety of software systems that peoplebuild, it's hard to \nsee how we could provide a \"complete\" set ofpatterns, one that offers step-by-step \ninstructions for designing anapplication. We can do that for certain classes of \napplications, suchas report-writing or making a forms-entry system. But our \ncatalog isjust a collection of related patterns; we can't pretend it's a \npatternlanguage.",
    "source": "",
    "scores": {
      "hybrid": "0.106",
      "vector": "0.000",
      "bm25": "0.260",
      "concept": "0.000",
      "wordnet": "0.100"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "saving time.  The  general-purpose approach seems consistent with  the\ninvestment mindset discussed in Chapter 3 , where you spend a bit more\ntime up front to save time later on.\nOn the other hand, we know that it’s hard to predict the future needs of\na software system, so a general-purpose solution might include facilities\nthat are never actually needed. Furthermore, if you implement something\nthat  is  too  general-purpose, it  might  not  do  a  good  job  of  solving the",
    "source": "",
    "scores": {
      "hybrid": "0.106",
      "vector": "0.000",
      "bm25": "0.260",
      "concept": "0.000",
      "wordnet": "0.100"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n26 \nthat fulfill these requests. The run-time association of a request to an object \nand one of its operations is known as dynamic binding. \nDynamic binding means that issuing a request doesn't commit you to a particular \nimplementation until run-time. Consequently, you can write programs that expect \nan object with a particular interface, knowing that any object that has the correct",
    "source": "",
    "scores": {
      "hybrid": "0.100",
      "vector": "0.015",
      "bm25": "0.271",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n350 \nimplemented by the class Composition.Instead, they are implemented separately \nby subclasses of the abstractCompositor class. Compositor subclasses implement \ndifferent strategies: \n• SimpleCompositorimplements a simple strategy that determines linebreaks \none at atime. \n• TeXCompositorimplements the TeX algorithm for finding linebreaks. This \nstrategytries to optimize linebreaks globally, that is, one paragraph at \natime.",
    "source": "",
    "scores": {
      "hybrid": "0.099",
      "vector": "0.000",
      "bm25": "0.282",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n382 \nDiscussion of Behavioral Patterns \nEncapsulating Variation \nEncapsulating variation is a theme of many behavioral patterns. Whenan aspect \nof a program changes frequently, these patterns define anobject that encapsulates \nthat aspect. Then other parts of the programcan collaborate with the object \nwhenever they depend on that aspect.The patterns usually define an abstract class",
    "source": "",
    "scores": {
      "hybrid": "0.098",
      "vector": "0.000",
      "bm25": "0.281",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n73 \nEncapsulating a Request \nFrom our perspective as designers, a pull-down menu is just anotherkind of glyph \nthat contains other glyphs. What distinguishespull-down menus from other glyphs \nthat have children is that mostglyphs in menus do some work in response to an \nup-click. \nLet's assume that these work-performing glyphs are instances of aGlyph subclass",
    "source": "",
    "scores": {
      "hybrid": "0.098",
      "vector": "0.000",
      "bm25": "0.280",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "software program",
      "computer software",
      "software system",
      "software package",
      "code",
      "computer architecture",
      "structure"
    ]
  }
]
```

### Test 3.3: Systems (Thinking in Systems)

**Input:**
```json
{
  "text": "feedback loops systems",
  "limit": 5
}
```

**Status:** ✅ PASS

**Output:**
```json
[
  {
    "text": "a set of decisions or rules or physical laws or actions that are dependent on the level of the stock, and back again through a flow to change the stock. • Balancing feedback loops are equilibrating or goal-seeking structures in systems and are both sources of stability and sources of resistance to change. • Reinforcing feedback loops are self-enhancing, leading to exponential growth or to runaway collapses over time. • The information delivered by a feedback loop—even nonphysical feedback—can",
    "source": "",
    "scores": {
      "hybrid": "0.208",
      "vector": "0.000",
      "bm25": "0.337",
      "concept": "0.200",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "machines and factories. The more you make, the more capacity you have to make even more. This reinforcing feedback loop is the central engine of growth in an economy. Figure 14. Reinvestment in capital. By now you may be seeing how basic balancing and reinforcing feedback loops are to systems. Sometimes I challenge my students to try to think of any human decision that occurs without a feedback loop—that is, a decision that is made without regard to any information about the level of the stock",
    "source": "",
    "scores": {
      "hybrid": "0.203",
      "vector": "0.000",
      "bm25": "0.323",
      "concept": "0.200",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "It forces nations into reinforcing loops “racing to the bottom,” competing with each other to weaken environmental and social safeguards in order to attract corporate investment. It’s a recipe for unleashing “success to the successful” loops, until they generate enormous accumulations of power and huge centralized planning systems that will destroy themselves. 4. Self- Organization— The power to add, change, or evolve system structure The most stunning thing living systems and some social",
    "source": "",
    "scores": {
      "hybrid": "0.197",
      "vector": "0.017",
      "bm25": "0.318",
      "concept": "0.133",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "of many more examples. The world is full of goal-seeking feedback loops. Balancing feedback loops are equilibrating or goal-seeking structures in systems and are both sources of stability and sources of resistance to change. The presence of a feedback mechanism doesn’t necessarily mean that the mechanism works well . The feedback mechanism may not be strong enough to bring the stock to the desired level. Feedbacks—the interconnections, the information part of the system—can fail for many",
    "source": "",
    "scores": {
      "hybrid": "0.197",
      "vector": "0.000",
      "bm25": "0.334",
      "concept": "0.133",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "I don’t have to pay attention to it” ploy. No one can define or measure justice, democracy, security, freedom, truth, or love. No one can define or measure any value. But if no one speaks up for them, if systems aren’t designed to produce them, if we don’t speak about them and point toward their presence or absence, they will cease to exist. Make Feedback Policies for Feedback Systems President Jimmy Carter had an unusual ability to think in feedback terms and to make feedback policies.",
    "source": "",
    "scores": {
      "hybrid": "0.179",
      "vector": "0.129",
      "bm25": "0.297",
      "concept": "0.000",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "You’ll be thinking not in terms of a static world, but a dynamic one. You’ll stop looking for who’s to blame; instead you’ll start asking, “What’s the system?” The concept of feedback opens up the idea that a system can cause its own behavior. So far, I have limited this discussion to one kind of feedback loop at a time. Of course, in real systems feedback loops rarely come singly. They are linked together, often in fantastically complex patterns. A single stock is likely to have several",
    "source": "",
    "scores": {
      "hybrid": "0.178",
      "vector": "0.000",
      "bm25": "0.309",
      "concept": "0.067",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "affect only future behavior; it can’t deliver a signal fast enough to correct behavior that drove the current feedback. • A stock-maintaining balancing feedback loop must have its goal set appropriately to compensate for draining or inflowing processes that affect that stock. Otherwise, the feedback process will fall short of or exceed the target for the stock. • Systems with similar feedback structures produce similar dynamic behaviors. Shifting Dominance, Delays, and Oscillations • Complex",
    "source": "",
    "scores": {
      "hybrid": "0.178",
      "vector": "0.000",
      "bm25": "0.279",
      "concept": "0.133",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "Thinking in Systems",
    "source": "",
    "scores": {
      "hybrid": "0.176",
      "vector": "0.145",
      "bm25": "0.272",
      "concept": "0.000",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "life. Honor, Respect, and Distribute Information You’ve seen how information holds systems together and how delayed, biased, scattered, or missing information can make feedback loops malfunction. Decision makers can’t respond to information they don’t have, can’t respond accurately to information that is inaccurate, and can’t respond in a timely way to information that is late. I would guess that most of what goes wrong in systems goes wrong because of biased, late, or missing information. If I",
    "source": "",
    "scores": {
      "hybrid": "0.174",
      "vector": "0.000",
      "bm25": "0.299",
      "concept": "0.067",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "expensive diagnostic machines can lead to out-of-sight health care costs. Escalation in morality can lead to holier-than-thou sanctimoniousness. Escalation in art can lead from baroque to rococo to kitsch. Escalation in environmentally responsible lifestyles can lead to rigid and unnecessary puritanism. Escalation, being a reinforcing feedback loop, builds exponentially. Therefore, it can carry a competition to extremes faster than anyone would believe possible. If nothing is done to break the",
    "source": "",
    "scores": {
      "hybrid": "0.158",
      "vector": "0.102",
      "bm25": "0.207",
      "concept": "0.133",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "programs are weak balancing loops that try to counter these strong reinforcing ones. It would be much more effective to weaken the reinforcing loops. That’s what progressive income tax, inheritance tax, and universal high-quality public education programs are meant to do. If the wealthy can influence government to weaken, rather than strengthen, those measures, then the government itself shifts from a balancing structure to one that reinforces success to the successful! Look for leverage points",
    "source": "",
    "scores": {
      "hybrid": "0.151",
      "vector": "0.000",
      "bm25": "0.261",
      "concept": "0.000",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "rate high enough to cover the charges you incur while you’re paying (including interest). If you’re gearing up your work force to a higher level, you have to hire fast enough to correct for those who quit while you are hiring. In other words, your mental model of the system needs to include all the important flows, or you will be surprised by the system’s behavior. A stock-maintaining balancing feedback loop must have its goal set appropriately to compensate for draining or inflowing processes",
    "source": "",
    "scores": {
      "hybrid": "0.151",
      "vector": "0.000",
      "bm25": "0.202",
      "concept": "0.133",
      "wordnet": "0.400"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "Contents A Note from the Author A Note from the Editor Introduction: The Systems Lens Part One: System Structure and Behavior ONE. The Basics TWO. A Brief Visit to the Systems Zoo Part Two: Systems and Us THREE. Why Systems Work So Well FOUR. Why Systems Surprise Us FIVE. System Traps . . . and Opportunities Part Three: Creating Change— in Systems and in Our Philosophy SIX. Leverage Points—Places to Intervene in a System SEVEN. Living in a World of Systems Appendix System Definitions: A",
    "source": "",
    "scores": {
      "hybrid": "0.149",
      "vector": "0.050",
      "bm25": "0.291",
      "concept": "0.000",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "Bibliography of Systems Resources _____________ In addition to the works cited in the Notes, the items listed here are jumping off points—places to start your search for more ways to see and learn about systems. The fields of systems thinking and system dynamics are now extensive, reaching into many disciplines. For more resources, see also www.ThinkingInSystems.org Systems Thinking and Modeling Books Bossel, Hartmut. Systems and Models: Complexity, Dynamics, Evolution, Sustainability .",
    "source": "",
    "scores": {
      "hybrid": "0.144",
      "vector": "0.000",
      "bm25": "0.269",
      "concept": "0.133",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "Systems Theory . (Philadelphia: University of Pennsylvania Press, 1991). The long, varied, and fascinating history of feedback concepts in social theory. Sweeney, Linda B. and Dennis Meadows. The Systems Thinking Playbook. (2001). A collection of 30 short gaming exercises that illustrate lessons about systems thinking and mental models. Organizations, Websites, Periodicals, and Software Creative Learning Exchange—an organization devoted to developing “systems citizens” in K–12 education.",
    "source": "",
    "scores": {
      "hybrid": "0.142",
      "vector": "0.000",
      "bm25": "0.293",
      "concept": "0.067",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "broader philosophical tools that arise from and complement systems thinking, such as mental-model flexibility and visioning. Sherwood, Dennis. Seeing the Forest for the Trees: A Manager’s Guide to Applying Systems Thinking. (London: Nicholas Brealey Publishing, 2002). Sterman, John D. Business Dynamics: Systems Thinking and Modeling for a Complex World. (Boston: Irwin McGraw Hill, 2000). Systems Thinking and Environment Ford, Andrew. Modeling the Environment. (Washington, DC: Island Press,",
    "source": "",
    "scores": {
      "hybrid": "0.142",
      "vector": "0.000",
      "bm25": "0.262",
      "concept": "0.133",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "as a function of your combined and fluctuating deposits, link a thousand of those banks into a federal reserve system—and you begin to see how simple stocks and flows, plumbed together, create systems way too complicated and dynamically complex to figure out easily. That’s why leverage points are often not intuitive. And that’s enough systems theory to proceed to the list. 12. Numbers— Constants and parameters such as subsidies, taxes, standards Think about the basic stock-and-flow bathtub from",
    "source": "",
    "scores": {
      "hybrid": "0.133",
      "vector": "0.000",
      "bm25": "0.236",
      "concept": "0.133",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "practical understanding of how these systems work, and how to work with them. Modern systems theory, bound up with computers and equations, hides the fact that it traffics in truths known at some level by everyone. It is often possible, therefore, to make a direct translation from systems jargon to traditional wisdom. Because of feedback delays within complex systems, by the time a problem becomes apparent it may be unnecessarily difficult to solve. — A stitch in time saves nine. According to",
    "source": "",
    "scores": {
      "hybrid": "0.130",
      "vector": "0.000",
      "bm25": "0.286",
      "concept": "0.000",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "a complex property of systems that it could never be understood. Computers were used to model mechanistic, “deterministic” systems, not evolutionary ones, because it was suspected, without much thought, that evolutionary systems were simply not understandable. New discoveries, however, suggest that just a few simple organizing principles can lead to wildly diverse self-organizing structures. Imagine a triangle with three equal sides. Add to the middle of each side another equilateral triangle,",
    "source": "",
    "scores": {
      "hybrid": "0.126",
      "vector": "0.000",
      "bm25": "0.276",
      "concept": "0.000",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  },
  {
    "text": "PART TWO Systems and Us",
    "source": "",
    "scores": {
      "hybrid": "0.116",
      "vector": "0.000",
      "bm25": "0.245",
      "concept": "0.000",
      "wordnet": "0.200"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "archetypes",
      "literacy",
      "pedagogy",
      "education",
      "civic",
      "mechanisms",
      "reinforcing"
    ]
  }
]
```

### Test 3.4: Patterns (Design Patterns)

**Input:**
```json
{
  "text": "design pattern factory",
  "limit": 5
}
```

**Status:** ✅ PASS

**Output:**
```json
[
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n132 \nRelated Patterns \nAbstract Factory (99) is often implemented with factory methods. The Motivation \nexample in the Abstract Factory pattern illustrates Factory Method as well. \nFactory methods are usually called within Template Methods (360). In the document \nexample above, NewDocument is a template method. \nPrototypes (133) don't require subclassing Creator. However, they often require",
    "source": "",
    "scores": {
      "hybrid": "0.256",
      "vector": "0.000",
      "bm25": "0.397",
      "concept": "0.778",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n31 \nYou have to instantiate concrete classes (that is, specify a particular \nimplementation) somewhere in your system, of course, and the creational patterns \n(Abstract Factory (99), Builder (110), Factory Method (121), Prototype (133), \nand Singleton (144) let you do just that. By abstracting the process of object \ncreation, these patterns give you different ways to associate an interface with",
    "source": "",
    "scores": {
      "hybrid": "0.236",
      "vector": "0.000",
      "bm25": "0.389",
      "concept": "0.667",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n122 \n \nApplication subclasses redefine an abstract CreateDocument operation on \nApplication to return the appropriate Document subclass. Once an Application \nsubclass is instantiated, it can then instantiate application-specific Documents \nwithout knowing their class. We call CreateDocument a factory method because it's \nresponsible for \"manufacturing\" an object. \nApplicability \nUse the Factory Method pattern when",
    "source": "",
    "scores": {
      "hybrid": "0.227",
      "vector": "0.000",
      "bm25": "0.363",
      "concept": "0.667",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n44 \nTable 1.2:  Design aspects that design patterns let you vary \nHow to Use a Design Pattern \nOnce you've picked a design pattern, how do you use it? Here's a step-by-step \napproach to applying a design pattern effectively: \n1. Read the pattern once through for an overview. Pay particular attention \nto the Applicability and Consequences sections to ensure the pattern is \nright for your problem.",
    "source": "",
    "scores": {
      "hybrid": "0.223",
      "vector": "0.141",
      "bm25": "0.353",
      "concept": "0.333",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n431 \n \nDesign pattern relationships",
    "source": "",
    "scores": {
      "hybrid": "0.219",
      "vector": "0.136",
      "bm25": "0.348",
      "concept": "0.333",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "change. \nHere are some common causes of redesign along with the design pattern(s) that \naddress them:  \n1. Creating an object by specifying a class explicitly. Specifying a class \nname when you create an object commits you to a particular implementation \ninstead of a particular interface. This commitment can complicate future \nchanges. To avoid it, create objects indirectly.  \nDesign patterns: Abstract Factory (99), Factory Method (121), Prototype \n(133).",
    "source": "",
    "scores": {
      "hybrid": "0.215",
      "vector": "0.000",
      "bm25": "0.377",
      "concept": "0.556",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n102 \nConsequences \nThe Abstract Factory pattern has the following benefits and liabilities: \n1. It isolates concrete classes. The Abstract Factory pattern helps you control \nthe classes of objects that an application creates. Because a factory \nencapsulates the responsibility and the process of creating product objects, \nit isolates clients from implementation classes. Clients manipulate",
    "source": "",
    "scores": {
      "hybrid": "0.213",
      "vector": "0.000",
      "bm25": "0.372",
      "concept": "0.556",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n121 \nFactory Method \nIntent \nDefine an interface for creating an object, but let subclasses decide which class \nto instantiate. Factory Method lets a class defer instantiation to subclasses. \nAlso Known As \nVirtual Constructor \nMotivation \nFrameworks use abstract classes to define and maintain relationships between \nobjects. A framework is often responsible for creating these objects as well.",
    "source": "",
    "scores": {
      "hybrid": "0.208",
      "vector": "0.000",
      "bm25": "0.357",
      "concept": "0.556",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n22 \nClass Factory Method (121) Adapter (157) Interpreter (274) \nTemplate Method (360) \nScope \nObject Abstract Factory (99) \nBuilder (110) \nPrototype (133) \nSingleton (144) \nAdapter (157) \nBridge (171) \nComposite (183) \nDecorator (196) \nFacade (208) \nFlyweight (218)  \nProxy (233) \nChain of Responsibility \n(251) \nCommand (263) \nIterator (289) \nMediator (305) \nMemento (316) \nObserver (326) \nState (338) \nStrategy (349) \nVisitor (366)",
    "source": "",
    "scores": {
      "hybrid": "0.208",
      "vector": "0.000",
      "bm25": "0.355",
      "concept": "0.556",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n93 \nDesign Pattern Catalog",
    "source": "",
    "scores": {
      "hybrid": "0.206",
      "vector": "0.098",
      "bm25": "0.348",
      "concept": "0.333",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "easilyoverride, such as an initialization operation. \nDesigns that use Abstract Factory, Prototype, or Builder are even moreflexible \nthan those that use Factory Method, but they're also morecomplex. Often, designs \nstart out using Factory Method and evolvetoward the other creational patterns \nas the designer discovers wheremore flexibility is needed. Knowing many design \npatterns gives youmore choices when trading off one design criterion against \nanother.",
    "source": "",
    "scores": {
      "hybrid": "0.201",
      "vector": "0.000",
      "bm25": "0.384",
      "concept": "0.444",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n399 \na request to another object. The delegate carries out the request on behalf \nof the original object. \n   \ndesign pattern \n \nA design pattern systematically names, motivates, and explains a general \ndesign that addresses a recurring design problem in object-oriented \nsystems. It describes the problem, the solution, when to apply the solution, \nand its consequences. It also gives implementation hints and examples. The",
    "source": "",
    "scores": {
      "hybrid": "0.180",
      "vector": "0.000",
      "bm25": "0.325",
      "concept": "0.444",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n23 \nClearly there are many ways to organize design patterns. Having multiple ways \nof thinking about patterns will deepen your insight into what they do, how they \ncompare, and when to apply them. \n \n \nFigure 1.1:  Design pattern relationships \nHow Design Patterns Solve Design Problems \nDesign patterns solve many of the day-to-day problems object-oriented designers",
    "source": "",
    "scores": {
      "hybrid": "0.179",
      "vector": "0.005",
      "bm25": "0.363",
      "concept": "0.333",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n14 \nfocuses on a particular object-oriented design problem or issue. It describes \nwhen it applies, whether it can be applied in view of other design constraints, \nand the consequences and trade-offs of its use. Since we must eventually implement \nour designs, a design pattern also provides sample C++ and (sometimes) Smalltalk \ncode to illustrate an implementation.",
    "source": "",
    "scores": {
      "hybrid": "0.177",
      "vector": "0.000",
      "bm25": "0.315",
      "concept": "0.444",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n170 \n1\nCreateManipulator is an example of a Factory Method (121).",
    "source": "",
    "scores": {
      "hybrid": "0.175",
      "vector": "0.000",
      "bm25": "0.356",
      "concept": "0.333",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "A design pattern names, abstracts, and identifies the key aspects of a common \ndesign structure that make it useful for creating a reusable object-oriented design. \nThe design pattern identifies the participating classes and instances, their roles \nand collaborations, and the distribution of responsibilities. Each design pattern",
    "source": "",
    "scores": {
      "hybrid": "0.174",
      "vector": "0.020",
      "bm25": "0.335",
      "concept": "0.333",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "What to Expect from Design Patterns \nHere are several ways in which the design patterns in this book canaffect the \nway you design object-oriented software, based on ourday-to-day experience with \nthem. \nA Common Design Vocabulary \nStudies of expert programmers for conventional languages haveshown that knowledge \nand experience isn't organized simply aroundsyntax but in larger conceptual \nstructures such as algorithms, datastructures and idioms [AS85, Cop92, Cur89,",
    "source": "",
    "scores": {
      "hybrid": "0.173",
      "vector": "0.000",
      "bm25": "0.305",
      "concept": "0.444",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "window system resources (MakeWindow, MakeFont, MakeColor, for example). Concrete \nsubclasses implement the interfaces for a specific window system. At run-time, \nET++ creates an instance of a concrete WindowSystem subclass that creates concrete \nsystem resource objects. \nRelated Patterns \nAbstractFactory classes are often implemented with factory methods (Factory Method \n(121)), but they can also be implemented using Prototype (133). \nA concrete factory is often a singleton (Singleton (144)).",
    "source": "",
    "scores": {
      "hybrid": "0.172",
      "vector": "0.000",
      "bm25": "0.301",
      "concept": "0.444",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n12 \nThe purpose of this book is to record experience in designing object-oriented \nsoftware as design patterns. Each design pattern systematically names, explains, \nand evaluates an important and recurring design in object-oriented systems. Our \ngoal is to capture design experience in a form that people can use effectively. \nTo this end we have documented some of the most important design patterns and \npresent them as a catalog.",
    "source": "",
    "scores": {
      "hybrid": "0.172",
      "vector": "0.000",
      "bm25": "0.347",
      "concept": "0.333",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n91 \n5. Bridge (171) to allow multiplewindowing platforms, \n6. Command (263) for undoable useroperations, \n7. Iterator (289) for accessing andtraversing object structures, and \n8. Visitor (366) for allowing anopen-ended number of analytical capabilities \nwithout complicatingthe document structure's implementation. \nNone of these design issues is limited to document editingapplications like Lexi.",
    "source": "",
    "scores": {
      "hybrid": "0.167",
      "vector": "0.000",
      "bm25": "0.287",
      "concept": "0.444",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "abstract",
      "method",
      "patterns",
      "intent",
      "implementation",
      "language",
      "structure"
    ]
  }
]
```

---

## 4. extract_concepts

### Test 4.1: Sun Tzu

**Input:**
```json
{
  "document_query": "Sun Tzu"
}
```

**Status:** ✅ PASS

**Output (truncated to first 10 concepts):**
```json
{
  "document": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
  "document_hash": "4715d580120ee2b584ade03b0e6bb8cd66d0163e26d35779c586b44a7fe0ad8d",
  "total_concepts": 90,
  "primary_concepts": [
    "military strategy",
    "deception tactics",
    "moral law",
    "heaven and weather analysis",
    "earth and terrain analysis",
    "commander virtues",
    "method and discipline",
    "logistics and supply management",
    "rapidity and timing",
    "strategic intelligence"
  ],
  "related_concepts": [],
  "categories": [
    "military strategy",
    "intelligence studies",
    "operations research",
    "logistics and supply chain",
    "organizational leadership",
    "security studies"
  ],
  "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a historical biography of the ancient Chinese military strategist Sun Tzu, including Ssu-ma Ch'ien's account of his demonstration of discipline by training the King of Wu's concubines, his military successes against rival states, references to his descendant Sun Pin, and the opening lines of the first chapter on \"Laying Plans,\" emphasizing war's vital importance to the state.\n\nKey Concepts: military strategy, deception tactics, moral law, heaven and weather analysis, earth and terrain analysis, commander virtues, method and discipline, logistics and supply management, rapidity and timing, strategic intelligence, spy operations, types of spies, converted spies, doomed spies, local spies, inward spies, surviving spies, planning and calculation, seven considerations assessment, assessment of strengths and weaknesses, direct and indirect maneuvering, cheng and chi maneuver theory, tactical dispositions, concentration and dispersal of forces, force multiplication and combined energy, feints and baits, ambush tactics, divide and conquer, siege warfare principles, attack by stratagem, attack by fire, environmental exploitation, use of signals and communication, gongs drums flags signaling, battlefield reconnaissance, scouting indicators, morale management, rewards and punishments system, discipline enforcement, command and control, unity of command, use of captured troops, foraging on the enemy, cost of war and economic impact, avoiding protracted warfare, measurement estimation calculation balancing, balancing of chances, tactical flexibility and variation, nine situations framework, six types of terrain classification, maneuvering artifice of deviation, positioning and high ground, river and water warfare, marching and encampment doctrine, night operations and timing, use of weather and seasons, use of local guides, intelligence from spies vs. divination, concealment and secrecy, simulated disorder, masking strength with weakness, psychological operations, provoking and irritating enemy, exploiting enemy temperament, supply line protection, alliance management and diplomacy, strategic patience and opportunism, killing commander strategy, unity of spirit in army, selection and employment of officers, punishment of leaders for failure, reading signs and omens, terrain-based tactics, forced marches and limits, husbanding strength and economy, encirclement and leaving an outlet, deception of own troops, controlling information and secrecy, reward distribution and plunder policy, leadership conduct and morale, mobilization and concentration, dispersive and facile ground tactics, cutting communications, timing of attacks by stars and days, fire attack seasonality, integration of civil and military spheres, calculation of probabilities, using natural elements as metaphors for tactics, strategic surprise, operational security and counterintelligence\nCategories: military strategy, intelligence studies, operations research, logistics and supply chain, organizational leadership, security studies",
  "_note": "Showing 10 of 90 concepts"
}
```

### Test 4.2: Clean Architecture

**Input:**
```json
{
  "document_query": "Clean Architecture"
}
```

**Status:** ✅ PASS

**Output (truncated to first 10 concepts):**
```json
{
  "document": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
  "document_hash": "ff90855c3cb784cd65dbd1583bad9ef4ea52607021baf3ce6a5196cb40d7de99",
  "total_concepts": 187,
  "primary_concepts": [
    "design pattern",
    "pattern intent",
    "pattern problem",
    "pattern solution",
    "pattern consequences",
    "pattern structure",
    "pattern participants",
    "pattern collaborations",
    "pattern implementation",
    "pattern sample code"
  ],
  "related_concepts": [],
  "categories": [
    "software engineering",
    "object oriented design",
    "software architecture",
    "human computer interaction",
    "programming languages",
    "object-oriented programming",
    "human-computer interaction"
  ],
  "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" introduces fundamental design patterns for object-oriented programming, featuring a catalog of creational, structural, and behavioral patterns, illustrated through a document editor case study, along with introductory concepts, discussions, and supporting resources like a glossary and CD preface.\n\nKey Concepts: design pattern, pattern intent, pattern problem, pattern solution, pattern consequences, pattern structure, pattern participants, pattern collaborations, pattern implementation, pattern sample code, catalog classification, creational patterns, structural patterns, behavioral patterns, class patterns, object patterns, program to an interface not an implementation, favor object composition over class inheritance, delegation, model view controller, observer pattern, composite pattern, strategy pattern, decorator pattern, transparent enclosure, mono glyph, compositor, composition, te x compositor, discretionary glyph, visitor pattern, accept operation, iterator pattern, create iterator, preorder iterator, null iterator, command pattern, command history, undo and redo mechanism, memento pattern, spell checking visitor, hyphenation visitor, glyph abstraction, glyph operations, document structure, recursive composition, transparent decoration, look and feel abstraction, abstract factory pattern, factory method pattern, builder pattern, prototype pattern, singleton pattern, maze example, factory as singleton, prototype manager, deep versus shallow copy, handle body idiom, window abstraction, window implementation, bridge pattern, window system factory, adapter pattern, class adapter, object adapter, pluggable adapter, two way adapter, facade pattern, subsystem public interface, flyweight pattern, intrinsic state, extrinsic state, flyweight factory, proxy pattern, proxy uses, bridge versus adapter, decorator versus strategy, inheritance versus composition, class versus interface inheritance, parameterized types and templates, run time versus compile time structure, aggregation versus acquaintance, design for change, framework, toolkit, application design concerns, mvc view nesting, controller encapsulation, spelling algorithm strategy, hyphenation algorithm, text layout, formatter cache, visitor trade offs, accessor operations, null object, registry, reference counting, layering, algorithm encapsulation, open closed principle, client configurability, sample code localization, design patterns, object-oriented design, software architecture, encapsulating variation, decoupling senders and receivers, refactoring lifecycle, pattern language, separation of concerns, code reuse, glyph context, btree font mapping, glyph factory, character glyph, virtual proxy, image proxy, remote proxy, protection proxy, smart reference, operator overloading for proxy, doesnotunderstand forwarding, undo and redo, macro command, simple command template, originator caretaker, incremental mementos, subject observer mapping, push pull notification, change manager, chain of responsibility pattern, help handler, request as object, mediator pattern, colleague, dialog director, external iterator, internal iterator, cursor iterator, robust iterator, iterator pointer proxy, double dispatch, interpreter pattern, abstract syntax tree, terminal nonterminal expressions, parsing strategies, double-dispatch alternatives, template method pattern, hook operations, strategy as template parameter, state pattern, state sharing, tcp connection state machine, proxy decorator comparison, adapter bridge comparison, factory method, layout objects as flyweights, copy on write, save load persistence, logging and recovery, transaction modeling, iterator state memento, collection iteration state, internal composition repair, compositor interface, tex compositor, simple compositor, array compositor, regular expressions interpreter, input state sets, boolean expression interpreter, replace operation, evaluate operation, context mapping, composite traversal variants, visitor traversal responsibility, accumulating visitor state, breaking encapsulation tradeoff, double dispatch table, command history list, unidraw interpretation chaining, robust traversal under modification, smalltalk internal iterator blocks, resource acquisition is initialization, friend based memento access, doesnotunderstand performance caveat, delegation alternative\nCategories: software engineering, object oriented design, software architecture, human computer interaction, programming languages, object-oriented programming, human-computer interaction",
  "_note": "Showing 10 of 187 concepts"
}
```

### Test 4.3: Thinking in Systems

**Input:**
```json
{
  "document_query": "Thinking in Systems"
}
```

**Status:** ✅ PASS

**Output (truncated to first 10 concepts):**
```json
{
  "document": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
  "document_hash": "bd8cbb7fb5d30c314ad3d323b8ef79113954f6122a798117c8aad32f382c330c",
  "total_concepts": 152,
  "primary_concepts": [
    "systems thinking",
    "system dynamics",
    "complexity science",
    "sustainability science",
    "resilience",
    "self-organization",
    "hierarchy",
    "feedback loops",
    "stocks and flows",
    "balancing feedback loop"
  ],
  "related_concepts": [],
  "categories": [
    "systems thinking",
    "system dynamics and modeling",
    "sustainability science",
    "organizational management and policy",
    "complexity and resilience science",
    "sustainability studies",
    "systems science"
  ],
  "summary": "Thinking in Systems is a primer by Donella H. Meadows that introduces foundational concepts of systems thinking, exploring system structures and behaviors, their surprising dynamics and traps, leverage points for intervention, and practical guidelines for navigating complex real-world systems, drawing from decades of modeling and interdisciplinary wisdom.\n\nKey Concepts: systems thinking, system dynamics, complexity science, sustainability science, resilience, self-organization, hierarchy, feedback loops, stocks and flows, balancing feedback loop, reinforcing feedback loop, delays, nonlinearity, limits to growth, carrying capacity, overshoot, archetypes, policy resistance, tragedy of the commons, shifting the burden, success to the successful, escalation, drift to low performance, rule beating, bounded rationality, stocks as system memory, buffers, information flows, decision delays, behavior over time graphs, boundary selection, modeling and simulation, scenario analysis, sensitivity analysis, model validation, behavior archetypes catalog, feedback policies, leverage analysis, stocks and flows structure redesign, goal alignment, intrinsic responsibility, meta-resilience, information transparency, model-based learning, adaptive management, participatory modeling, system mapping, time horizon expansion, systems literacy, mental model transparency, heuristic of behavior first, stock-and-flow modeling, causal loop diagramming, doubling time rule, exponential growth, renewable resource constraint, nonrenewable resource depletion, externalities, carrying capacity erosion, feedback signal placement, goal specification, paradigm change, transcending paradigms, fractal geometry, hierarchical decomposition, time discounting critique, leverage points list, model equation transparency, overshoot and oscillation mitigation, ecosystem services framing, civic feedback mechanisms, error embracing, long-term investment in adaptive capacity, systems education, ethics of systemic responsibility, sustainable living, global modeling, sustainable development, global commons stewardship, cultural change through publishing, citizen empowerment, environmental education, long-term foresight, interconnectedness of social and environmental systems, stewardship ethics, organizational learning, systems dynamics modeling, feedback loop analysis, scenario planning, integrated assessment, resilience assessment, transdisciplinary research, sustainability indicators, leverage points analysis, systems archetypes, ecological economics framework, policy analysis for sustainability, community-based stewardship models, slow money investment framework, toxicology communication, life-cycle assessment, regenerative agriculture practices, local food systems finance, earth system science, gaia hypothesis integration, science communication strategies, environmental journalism, public-facing scholarship, catalog distribution strategies, book foreword as credibility device, paperback publishing format, weekly opinion column, environmental studies curriculum, peer recognition mechanisms, nonprofit institute incubation, holocene perspective, future-history narratives, interdisciplinary dialogue formats, toxicity risk framing, supply chain sustainability, ecological footprint accounting, population-resource dynamics, carrying capacity concept, exponential growth dynamics, overshoot and collapse pattern, mitigation and adaptation strategies, environmental governance mechanisms, market-based environmental tools, nonmarket valuation methods, behavioral change communication, community resilience building, soil fertility management, place-based investment, food-system sustainability, scientific intuition integration, popular science dialogues, reflective environmental essays, publisher mission-driven curation, accessible pricing strategies, catalog outreach channels, book-based public engagement, educational forewords, catalog curation for interdisciplinary audiences, accessibility via paperback editions, communication of scientific authority, intergenerational equity, systems pedagogy, public mobilization through narrative, environmental ethics communication, scholar-to-public translation, mission-aligned marketing, strategic book selection\nCategories: systems thinking, system dynamics and modeling, sustainability science, organizational management and policy, complexity and resilience science, sustainability studies, systems science",
  "_note": "Showing 10 of 152 concepts"
}
```

### Test 4.4: Design Patterns

**Input:**
```json
{
  "document_query": "Design Patterns"
}
```

**Status:** ✅ PASS

**Output (truncated to first 10 concepts):**
```json
{
  "document": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
  "document_hash": "ff90855c3cb784cd65dbd1583bad9ef4ea52607021baf3ce6a5196cb40d7de99",
  "total_concepts": 187,
  "primary_concepts": [
    "design pattern",
    "pattern intent",
    "pattern problem",
    "pattern solution",
    "pattern consequences",
    "pattern structure",
    "pattern participants",
    "pattern collaborations",
    "pattern implementation",
    "pattern sample code"
  ],
  "related_concepts": [],
  "categories": [
    "software engineering",
    "object oriented design",
    "software architecture",
    "human computer interaction",
    "programming languages",
    "object-oriented programming",
    "human-computer interaction"
  ],
  "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" introduces fundamental design patterns for object-oriented programming, featuring a catalog of creational, structural, and behavioral patterns, illustrated through a document editor case study, along with introductory concepts, discussions, and supporting resources like a glossary and CD preface.\n\nKey Concepts: design pattern, pattern intent, pattern problem, pattern solution, pattern consequences, pattern structure, pattern participants, pattern collaborations, pattern implementation, pattern sample code, catalog classification, creational patterns, structural patterns, behavioral patterns, class patterns, object patterns, program to an interface not an implementation, favor object composition over class inheritance, delegation, model view controller, observer pattern, composite pattern, strategy pattern, decorator pattern, transparent enclosure, mono glyph, compositor, composition, te x compositor, discretionary glyph, visitor pattern, accept operation, iterator pattern, create iterator, preorder iterator, null iterator, command pattern, command history, undo and redo mechanism, memento pattern, spell checking visitor, hyphenation visitor, glyph abstraction, glyph operations, document structure, recursive composition, transparent decoration, look and feel abstraction, abstract factory pattern, factory method pattern, builder pattern, prototype pattern, singleton pattern, maze example, factory as singleton, prototype manager, deep versus shallow copy, handle body idiom, window abstraction, window implementation, bridge pattern, window system factory, adapter pattern, class adapter, object adapter, pluggable adapter, two way adapter, facade pattern, subsystem public interface, flyweight pattern, intrinsic state, extrinsic state, flyweight factory, proxy pattern, proxy uses, bridge versus adapter, decorator versus strategy, inheritance versus composition, class versus interface inheritance, parameterized types and templates, run time versus compile time structure, aggregation versus acquaintance, design for change, framework, toolkit, application design concerns, mvc view nesting, controller encapsulation, spelling algorithm strategy, hyphenation algorithm, text layout, formatter cache, visitor trade offs, accessor operations, null object, registry, reference counting, layering, algorithm encapsulation, open closed principle, client configurability, sample code localization, design patterns, object-oriented design, software architecture, encapsulating variation, decoupling senders and receivers, refactoring lifecycle, pattern language, separation of concerns, code reuse, glyph context, btree font mapping, glyph factory, character glyph, virtual proxy, image proxy, remote proxy, protection proxy, smart reference, operator overloading for proxy, doesnotunderstand forwarding, undo and redo, macro command, simple command template, originator caretaker, incremental mementos, subject observer mapping, push pull notification, change manager, chain of responsibility pattern, help handler, request as object, mediator pattern, colleague, dialog director, external iterator, internal iterator, cursor iterator, robust iterator, iterator pointer proxy, double dispatch, interpreter pattern, abstract syntax tree, terminal nonterminal expressions, parsing strategies, double-dispatch alternatives, template method pattern, hook operations, strategy as template parameter, state pattern, state sharing, tcp connection state machine, proxy decorator comparison, adapter bridge comparison, factory method, layout objects as flyweights, copy on write, save load persistence, logging and recovery, transaction modeling, iterator state memento, collection iteration state, internal composition repair, compositor interface, tex compositor, simple compositor, array compositor, regular expressions interpreter, input state sets, boolean expression interpreter, replace operation, evaluate operation, context mapping, composite traversal variants, visitor traversal responsibility, accumulating visitor state, breaking encapsulation tradeoff, double dispatch table, command history list, unidraw interpretation chaining, robust traversal under modification, smalltalk internal iterator blocks, resource acquisition is initialization, friend based memento access, doesnotunderstand performance caveat, delegation alternative\nCategories: software engineering, object oriented design, software architecture, human computer interaction, programming languages, object-oriented programming, human-computer interaction",
  "_note": "Showing 10 of 187 concepts"
}
```

---

## 5. list_categories

### Test 5.1: List all categories

**Input:**
```json
{}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "summary": {
    "totalCategories": 21,
    "categoriesReturned": 21,
    "rootCategories": 0,
    "totalDocuments": 21,
    "sortedBy": "popularity",
    "searchQuery": null
  },
  "categories": [
    {
      "id": 1432485131,
      "name": "General",
      "description": "Concepts and practices related to General",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "General"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 1089030239,
      "name": "complexity and resilience science",
      "description": "Concepts and practices related to complexity and resilience science",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "complexity and resilience science"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3569476375,
      "name": "human computer interaction",
      "description": "Concepts and practices related to human computer interaction",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "human computer interaction"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 476050496,
      "name": "human-computer interaction",
      "description": "Concepts and practices related to human-computer interaction",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "human-computer interaction"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 1421786147,
      "name": "intelligence studies",
      "description": "Concepts and practices related to intelligence studies",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "intelligence studies"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3636437145,
      "name": "logistics and supply chain",
      "description": "Concepts and practices related to logistics and supply chain",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "logistics and supply chain"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 455274635,
      "name": "military strategy",
      "description": "Concepts and practices related to military strategy",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "military strategy"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 26849456,
      "name": "object oriented design",
      "description": "Concepts and practices related to object oriented design",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "object oriented design"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 224633332,
      "name": "object-oriented programming",
      "description": "Concepts and practices related to object-oriented programming",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "object-oriented programming"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 4125838900,
      "name": "operations research",
      "description": "Concepts and practices related to operations research",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "operations research"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 1167893166,
      "name": "organizational leadership",
      "description": "Concepts and practices related to organizational leadership",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "organizational leadership"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3431216467,
      "name": "organizational management and policy",
      "description": "Concepts and practices related to organizational management and policy",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "organizational management and policy"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 2464887633,
      "name": "programming languages",
      "description": "Concepts and practices related to programming languages",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "programming languages"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3085918490,
      "name": "security studies",
      "description": "Concepts and practices related to security studies",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "security studies"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3503213995,
      "name": "software architecture",
      "description": "Concepts and practices related to software architecture",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "software architecture"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3612017291,
      "name": "software engineering",
      "description": "Concepts and practices related to software engineering",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "software engineering"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3533156218,
      "name": "sustainability science",
      "description": "Concepts and practices related to sustainability science",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "sustainability science"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3029445169,
      "name": "sustainability studies",
      "description": "Concepts and practices related to sustainability studies",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "sustainability studies"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 259520094,
      "name": "system dynamics and modeling",
      "description": "Concepts and practices related to system dynamics and modeling",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "system dynamics and modeling"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 697816835,
      "name": "systems science",
      "description": "Concepts and practices related to systems science",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "systems science"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 2726112975,
      "name": "systems thinking",
      "description": "Concepts and practices related to systems thinking",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "systems thinking"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    }
  ]
}
```

---

## 6. category_search

### Test 6.1: military strategy

**Input:**
```json
{
  "category": "military strategy"
}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "category": {
    "id": 455274635,
    "name": "military strategy",
    "description": "Concepts and practices related to military strategy",
    "hierarchy": [
      "military strategy"
    ],
    "aliases": [],
    "relatedCategories": []
  },
  "statistics": {
    "totalDocuments": 1,
    "totalChunks": 0,
    "totalConcepts": 0,
    "documentsReturned": 1
  },
  "documents": [
    {
      "title": "",
      "preview": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a historical biography of the ancient Chinese military strategist Sun Tzu, including Ssu-ma Ch'ien's account of his demonstrat...",
      "primaryConcepts": []
    }
  ],
  "includeChildren": false,
  "categoriesSearched": []
}
```

### Test 6.2: software architecture

**Input:**
```json
{
  "category": "software architecture"
}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "category": {
    "id": 3503213995,
    "name": "software architecture",
    "description": "Concepts and practices related to software architecture",
    "hierarchy": [
      "software architecture"
    ],
    "aliases": [],
    "relatedCategories": []
  },
  "statistics": {
    "totalDocuments": 1,
    "totalChunks": 0,
    "totalConcepts": 0,
    "documentsReturned": 1
  },
  "documents": [
    {
      "title": "",
      "preview": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" introduces fundamental design patterns for object-oriented programming, featuring a catalog of creational, structural, and ...",
      "primaryConcepts": []
    }
  ],
  "includeChildren": false,
  "categoriesSearched": []
}
```

### Test 6.3: systems thinking

**Input:**
```json
{
  "category": "systems thinking"
}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "category": {
    "id": 2726112975,
    "name": "systems thinking",
    "description": "Concepts and practices related to systems thinking",
    "hierarchy": [
      "systems thinking"
    ],
    "aliases": [],
    "relatedCategories": []
  },
  "statistics": {
    "totalDocuments": 1,
    "totalChunks": 0,
    "totalConcepts": 0,
    "documentsReturned": 1
  },
  "documents": [
    {
      "title": "",
      "preview": "Thinking in Systems is a primer by Donella H. Meadows that introduces foundational concepts of systems thinking, exploring system structures and behaviors, their surprising dynamics and traps, leverag...",
      "primaryConcepts": []
    }
  ],
  "includeChildren": false,
  "categoriesSearched": []
}
```

### Test 6.4: design patterns

**Input:**
```json
{
  "category": "design patterns"
}
```

**Status:** ❌ FAIL

**Output:**
```json
{
  "error": {
    "code": "DATABASE_QUERY_FAILED",
    "message": "Category with identifier 'design patterns' not found",
    "context": {
      "operation": "query",
      "entity": "Category",
      "identifier": "design patterns"
    },
    "timestamp": "2025-11-29T07:39:49.185Z"
  }
}
```

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 21 |
| Passed | 20 |
| Failed | 1 |
| Success Rate | 95.2% |

### Failed Tests

- **category_search** - Category: design patterns: Unknown error