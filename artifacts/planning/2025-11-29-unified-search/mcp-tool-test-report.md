# MCP Tool Test Report - Detailed Output

**Generated:** 2025-12-03T16:33:45.987Z
**Database:** db/test

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
  "summary": "Systematic planning and conduct of armed conflict to achieve political objectives. In this document it emphasizes deception, timing, logistics, terrain exploitation, unified command, and economy of force to secure victory while minimizing time, cost, and casualties.",
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
  },
  "scores": {
    "hybrid": "0.955",
    "name": "1.000",
    "vector": "1.000",
    "bm25": "0.777",
    "wordnet": "1.000"
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
  "concept": "framework architecture",
  "concept_id": 1730610886,
  "summary": "A reusable set of cooperating classes that defines an application's architecture and inversion of control between framework and application code. Patterns help frameworks remain flexible and extensible while providing strong architectural guidance and reuse.",
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
  },
  "scores": {
    "hybrid": "0.470",
    "name": "0.500",
    "vector": "0.162",
    "bm25": "0.608",
    "wordnet": "1.000"
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
  "concept": "feedback loop",
  "concept_id": 2255290044,
  "summary": "A causal chain in which a change in a stock influences flows that return to affect that same stock, closing the loop. The text distinguishes feedback as the fundamental mechanism generating system behavior and uses loops to explain stability, growth, oscillation, and resistance.",
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
      "pages": [
        1
      ],
      "match_type": "primary"
    }
  ],
  "chunks": [
    {
      "text": "to the competitive exclusion principle, if a reinforcing feedback loop rewards the winner of a competition with the means to win further competitions, the result will be the elimination of all but a few competitors. — For he that hath, to him shall be given; and he that hath not, from him shall be taken even that which he hath (Mark 4:25) or — The rich get richer and the poor get poorer. A diverse system with multiple pathways and redundancies is more stable and less vulnerable to external",
      "title": "Thinking in Systems",
      "page": 1,
      "concept_density": "0.337",
      "concepts": [
        "feedback loop",
        "reinforcing feedback loop",
        "reinforcing feedback"
      ]
    },
    {
      "text": "you’ll find that you can understand this graphical language easily. I start with the basics: the definition of a system and a dissection of its parts (in a reductionist, unholistic way). Then I put the parts back together to show how they interconnect to make the basic operating unit of a system: the feedback loop. Next I will introduce you to a systems zoo—a collection of some common and interesting types of systems. You’ll see how a few of these creatures behave and why and where they can be",
      "title": "Thinking in Systems",
      "page": 1,
      "concept_density": "0.225",
      "concepts": [
        "feedback loop",
        "interconnection"
      ]
    }
  ],
  "stats": {
    "total_documents": 1,
    "total_chunks": 100,
    "sources_returned": 1,
    "chunks_returned": 2
  },
  "scores": {
    "hybrid": "0.972",
    "name": "1.000",
    "vector": "1.000",
    "bm25": "0.858",
    "wordnet": "1.000"
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
  "summary": "A wrapper-based design that augments an object's behavior by providing the same interface and delegating to the wrapped object, often adding boilerplate pass-through methods. The book cautions against excessive decorators because they create shallow layers and recommends alternatives for common features.",
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
      "title": "Clean Architecture A Craftsman's Guide to Software - Robert C Martin - Robert C Martin Series, 1st Edition, September 10, 2017 - Pearson - 9780134494166 - 29f880be2248b1d30f3d956a037bb366 - Anna’s Archive",
      "pages": [],
      "match_type": "primary"
    },
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
      "concept_density": "4.375",
      "concepts": [
        "object-oriented design",
        "reusable software design",
        "structural patterns",
        "composite pattern",
        "decorator pattern",
        "bridge pattern",
        "adapter pattern"
      ]
    },
    {
      "text": "problems. Somepeople read the catalog through first and then use aproblem-directed \napproach to apply the patterns to their projects. \nIf you aren't an experienced object-oriented designer, then start withthe simplest \nand most common patterns: \n• Abstract Factory (page 99) \n• Adapter (157) \n• Composite (183) \n• Decorator (196) \n• Factory Method (121) \n• Observer (326) \n• Strategy (349) \n• Template Method (360) \nIt's hard to find an object-oriented system that doesn't use at leasta couple",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 10,
      "concept_density": "1.867",
      "concepts": [
        "object-oriented design",
        "design patterns catalog",
        "pattern template",
        "related patterns",
        "composite pattern",
        "strategy pattern",
        "decorator pattern",
        "abstract factory pattern",
        "factory method pattern",
        "adapter pattern"
      ]
    },
    {
      "text": "to replace the algorithm either statically or dynamically, when you have a lot \nof variants of the algorithm, or when the algorithm has complex data structures \nthat you want to encapsulate. \nMVC uses other design patterns, such as Factory Method (121) to specify the default \ncontroller class for a view and Decorator (196) to add scrolling to a view. But \nthe main relationships in MVC are given by the Observer, Composite, and Strategy \ndesign patterns. \nDescribing Design Patterns",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 16,
      "concept_density": "1.154",
      "concepts": [
        "related patterns",
        "composite pattern",
        "strategy pattern",
        "decorator pattern",
        "factory method pattern",
        "observer pattern",
        "pattern relationships graph",
        "observer",
        "factory method"
      ]
    }
  ],
  "stats": {
    "total_documents": 2,
    "total_chunks": 200,
    "sources_returned": 2,
    "chunks_returned": 3
  },
  "scores": {
    "hybrid": "0.958",
    "name": "1.000",
    "vector": "1.000",
    "bm25": "0.792",
    "wordnet": "1.000"
  }
}
```

---

## 2. catalog_search

Hybrid scoring for catalog: 25% vector, 25% BM25, 20% title, 20% concept, 10% WordNet

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
    "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a biographical account by Ssu-ma Ch'ien of the ancient Chinese military strategist Sun Tzu, including his legendary demonstration of discipline by training the King of Wu's concubines, his successful campaigns against rival states, references to his descendant Sun Pin, and the opening lines of the first chapter on the vital importance of warfare to the state.\n\nKey Concepts: military strategy, principle of deception, logistics and supply, command and control, terrain analysis, timing and rapidity, moral law and morale, unity of purpose, economics of war, intelligence and espionage, risk management in warfare, adaptation and flexibility, assessment framework five constant factors, seven considerations assessment, nine situations framework, tactical dispositions, energy and momentum management, direct and indirect tactics, feint and baiting tactics, ambush operations, encirclement and concentration, division and concentration of forces, foraging and enemy sustenance strategy, siege avoidance principle, attack by stratagem, defensive posture doctrine, terrain classification six kinds, variation in tactics, maneuvering principles, signal and communication systems, secrecy and misinformation, captured resources integration, reward and punishment system, training and drill protocol, scouting and reconnaissance, river crossing tactics, night-fighting techniques, reading enemy signs, camouflage and concealment, holding high ground, cutting communications and lines of supply, coercive diplomacy and alliance management, command autonomy principle, measurement estimation calculation balancing process, battle readiness calculations, concentrate on weak points, avoidance of protracted warfare, seasonal and environmental planning, fire attack doctrine, water interdiction doctrine, spy classification system, converted spy exploitation, local spy operations, inward spy operations, doomed spy tactics, surviving spy operations, signal-fire coordination, gongs drums and banners, mantlets movable shelters, ramparts and mound engineering, baggage-train vulnerability, forbidden-camp signaling, simulated disorder and strength masking, combined-energy coordination, quality-of-decision timing, cheng direct tactics, chi indirect tactics, unit subdivision and signaling, rewards-from-spoils policy, integration of captured personnel, discipline enforcement mechanisms, leadership accountability, selection and employment of officers, training-to-task readiness, camp placement and health, salt-marsh operations, narrow pass employment, hemmed-in and desperate ground doctrine, psychological operations and mood study, camp security and internal order, prohibition of omen practices, use of local guides, forced march doctrine, synchronization and junction operations, interrogation of spies and counterintelligence, use of baits and enticements, economy-of-force principle, combined-arms momentum, chariot-centric force composition, unit-of-measure logistics pi cul, signals security and compartmentalization, camp sanitation and health maintenance\nCategories: military strategy, intelligence studies, logistics and supply chain, operations research, military history",
    "scores": {
      "hybrid": "0.407",
      "vector": "0.000",
      "bm25": "0.364",
      "title": "1.000",
      "concept": "1.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "war",
      "economics of war",
      "state of war",
      "hostility"
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
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through effective problem decomposition, modular abstractions, information hiding, and strategic practices, derived from the author's Stanford course on creating high-quality, maintainable code.\n\nKey Concepts: software complexity, incremental complexity, dependencies, obscurity, change amplification, cognitive load, unknown unknowns, obviousness in code, modular design, interface versus implementation, abstraction, deep module, shallow module, information hiding, information leakage, temporal decomposition, general-purpose module, special-purpose module, different layer different abstraction, pass-through method, decorator pattern, pass-through variable, context object pattern, pull complexity downwards, overexposure, defaults in interfaces, classitis, shallow method, repetition, separation of general-purpose and special-purpose code, undo history pattern, fence grouping, splitting and joining methods, conjoined methods, design it twice, strategic programming, tactical programming, tactical tornado, investment mindset, define errors out of existence, exception masking, exception aggregation, crash on fatal conditions, mask versus propagate trade-off, design special cases away, comments-first design, interface comments, implementation comments, comment conventions, comment repeats code, implementation documentation contaminates interface, cross-module design documentation, designNotes approach, choosing names, name precision, name consistency, short-name trade-offs, comments as design tool, procrastination of documentation, maintaining comments near code, avoiding duplicate documentation, pre-commit diff checks, consistency in design, enforceable style guidelines, when in rome principle, obvious code practices, white space and formatting, event-driven complexity, generic container anti-pattern, unit testing, system and integration testing, test-driven development critique, microbenchmarking, measure before modifying, critical path optimization, design around the critical path, buffer data structure optimization, ramcloud buffer redesign, design patterns evaluation, getters and setters critique, object-oriented inheritance trade-offs, consistency enforcement mechanisms, refactoring during maintenance, comments maintenance practices, cross-module invariants, red flags catalog, summary of design principles, design review practice, example-driven pedagogy\nCategories: software architecture, software engineering, systems design, programming languages, software maintenance",
    "scores": {
      "hybrid": "0.306",
      "vector": "0.000",
      "bm25": "0.248",
      "title": "1.000",
      "concept": "0.000",
      "wordnet": "0.500"
    },
    "expanded_terms": [
      "architecture",
      "framework architecture",
      "toolkit architecture",
      "stock and flow architecture",
      "computer architecture",
      "structure"
    ]
  },
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides a comprehensive catalog and guide to reusable design patterns in object-oriented programming, organized into creational, structural, and behavioral categories, illustrated through a document editor case study, and supplemented by prefaces, glossaries, notation guides, and a CD-ROM edition for enhanced accessibility.\n\nKey Concepts: object-oriented design, reusable software design, design patterns catalog, pattern template, creational patterns, structural patterns, behavioral patterns, intent section, motivation section, applicability section, structure diagramming, participants, consequences analysis, implementation guidance, known uses, related patterns, pattern classification by purpose, pattern classification by scope, mvc triad, program to an interface principle, favor composition over inheritance principle, delegation technique, class versus interface inheritance, compile-time versus run-time structure, aggregation versus acquaintance, encapsulation, polymorphism, inheritance reuse, object composition reuse, parameterized types and templates, design for change, causes of redesign, framework architecture, toolkit architecture, application design concerns, selection process for patterns, how to use a pattern, mvc as pattern composition, glyph composite model, glyph interface, composite pattern, compositor class, composition class, strategy pattern, transparent enclosure concept, monoglyph concept, decorator pattern, embellishment management, widget abstraction, abstract factory pattern, product family concept, factory as singleton, window abstraction, windowimp implementor, bridge pattern, window system factory, command pattern, menu item command relationship, undo command history, reversible operation flag, iterator pattern, createiterator operation, null iterator, list iterator, preorder iterator, traversal versus traversal action separation, visitor pattern, accept method, spelling checking visitor, hyphenation visitor, discretionary glyph, iterator visitor collaboration, flyweight pattern, intrinsic versus extrinsic state, flyweight factory, sharing and identity caveat, prototype pattern, clone semantics, prototype manager, initialize clones operation, builder pattern, director role, product internal representation, standard maze builder, counting maze builder, factory method pattern, parameterized factory method, templates versus factory methods, singleton pattern, singleton registry, shallow versus deep copy, class object as factory, adapter pattern, class adapter variant, object adapter variant, pluggable adapters, two-way adapter, facade pattern, subsystem public versus private interface, mediator pattern, proxy pattern, memento pattern, observer pattern, state pattern, template method pattern, chain of responsibility pattern, interpreter pattern, mediator as loose coupling, decorator usage caveats, caching invalidation responsibility, parent reference invariant, who deletes components policy, child-management interface design, traversal caching trade-offs, object sharing implications, layering with facades, pattern relationships graph, sample code pedagogy, notation and diagrams guide, foundation classes, case study methodology, lexi document editor, lexi formatting pipeline, spell-check and hyphenation analysis, glyph, character glyph, glyph context, extrinsic state, intrinsic state, btree font mapping, glyph factory, create character operation, virtual proxy, protection proxy, remote proxy, smart reference, image proxy, get extent operation, draw operation, handle mouse operation, operator arrow overloading, does not understand mechanism, copy on write, reference counting, concrete command, macro command, undo and redo, simple command template, receiver, invoker, command history, originator, caretaker, narrow and wide memento interfaces, incremental mementos, abstract syntax tree, terminal expression, nonterminal expression, parsing versus interpretation, double dispatch, element accept operation, equipment visitor, external iterator, internal iterator, cursor, iterator pointer proxy, robust iterator, composite traversal, successor link, request as object, help handler, colleague, dialog director, change manager, subject, observer, push versus pull model, subject-observer mapping, dangling reference avoidance, state object sharing, change state operation, table-driven state machine, compositor strategy, strategy as template, strategy optionality, hook operation, factory method, inverted control, adapter versus bridge, decorator versus proxy, prototype defer copying, separation of concerns, loose coupling, encapsulation boundaries, language feature exploitation, c++ template techniques, operator overloading idiom, doesnotunderstand forwarding, friend declaration, resource acquisition is initialization, robustness to modification, design refactoring, pattern vocabulary, pattern composition, implementation trade offs, sample code idioms, policy objects, separated interfaces, language portability, object traversal, encapsulating behavior, design patterns cataloging, trade off analysis, pattern applicability, sample domains, documentation as teaching\nCategories: software architecture, object-oriented design, software engineering, user interface design, object-oriented programming, programming languages",
    "scores": {
      "hybrid": "0.281",
      "vector": "0.000",
      "bm25": "0.250",
      "title": "0.000",
      "concept": "1.000",
      "wordnet": "0.500"
    },
    "expanded_terms": [
      "architecture",
      "framework architecture",
      "toolkit architecture",
      "stock and flow architecture",
      "computer architecture",
      "structure"
    ]
  },
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "summary": "Thinking in Systems is a primer on systems thinking by Donella H. Meadows, offering foundational insights into system structures, behaviors, surprises, traps, leverage points for intervention, and practical applications for understanding and addressing complex real-world challenges like sustainability and global limits.\n\nKey Concepts: systems thinking, system dynamics, feedback loop, balancing feedback loop, reinforcing feedback loop, stocks and flows, stock, flow, delay, buffer, dynamic equilibrium, resilience, self-organization, hierarchy, system boundaries, information flows, mental models, archetypes, policy resistance, tragedy of the commons, shifting the burden, drift to low performance, escalation, success to the successful, rule beating, seeking the wrong goal, leverage points, parameters and constants, stock and flow architecture, dominance shifting, nonlinear relationships, exponential growth, overshoot, collapsing back side of a peak, renewable resource constraint, nonrenewable resource constraint, carrying capacity, behavior over time graphs, stock-and-flow diagrams, clouds as sources and sinks, model simplification, scenario analysis, validation through behavior patterns, bounded rationality, satisficing, intrinsic responsibility, information transparency, feedback policies, meta-feedback and learning loops, paradigm, transcending paradigms, mental-model disclosure, measurement design, internalizing externalities, privatization versus regulation, mutual coercion mutually agreed upon, oscillation damping, overshoot and collapse management, time horizon expansion, boundary revision, scenario stress testing, nested systems, suboptimization, creative self-organization rules, diversity and redundancy, information accountability, learning organizations, error-embracing, language shaping perception, ethical boundary of caring, dance metaphor for system governance, systems literacy education, quantitative and qualitative integration, model transparency, feedback-based taxation, intrinsic versus extrinsic incentives, systemic ethics, sustainability, sustainable development, sustainable living practice, global modeling, complexity science, interconnection, cultural change through publishing, global commons stewardship, citizen empowerment, organizational learning, environmental studies education, conservation and environment policy, limits to growth modeling, resilience thinking, adaptive management, long-term forecasting, interdisciplinary research, transdisciplinary collaboration, stakeholder engagement, participatory action research, sustainability assessment, triple bottom line analysis, environmental communication, science communication via publishing, ecoethical stewardship, public policy advocacy, environmental pedagogy, community-based stewardship, behavioral change strategies, public engagement campaigns, environmental monitoring, systems mapping, leverage points identification, model validation and sensitivity, causal loop diagramming, stock and flow analysis, system archetypes, feedback loop dynamics, reinforcing feedback, balancing feedback, resource depletion dynamics, pollution accumulation dynamics, tipping points, exponential growth dynamics, planetary boundaries framework, ecological footprint accounting, socioecological systems analysis, ecological economics, regenerative agriculture, slow money investing, sustainable finance, conservation finance, food systems thinking, soil fertility management, consumer product toxicology, chemical exposure pathways, hazardous substances regulation, green chemistry principles, energy transition pathways, carbon emission mitigation strategies, climate solutions frameworks, scenario narratives, model parameter calibration, sensitivity analysis, trophic and nutrient cycles, public-facing environmental journalism, science-informed policy guidance, holistic assessment metrics, systems literacy, transformation pathways, boundary critique methods, integrative modeling, institutional change strategies, comparative analysis, case study method, grassroots mobilization, education for sustainable development, publicly accessible scientific literature, risk communication, environmental health science, holocene historical framing, gaia hypothesis discourse, science and society dialogue, environmental ethics, stewardship planning\nCategories: systems thinking, system dynamics, environmental science, public policy, organizational management, complexity science, systems science",
    "scores": {
      "hybrid": "0.172",
      "vector": "0.000",
      "bm25": "0.207",
      "title": "0.000",
      "concept": "0.333",
      "wordnet": "0.500"
    },
    "expanded_terms": [
      "architecture",
      "framework architecture",
      "toolkit architecture",
      "stock and flow architecture",
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
    "summary": "Thinking in Systems is a primer on systems thinking by Donella H. Meadows, offering foundational insights into system structures, behaviors, surprises, traps, leverage points for intervention, and practical applications for understanding and addressing complex real-world challenges like sustainability and global limits.\n\nKey Concepts: systems thinking, system dynamics, feedback loop, balancing feedback loop, reinforcing feedback loop, stocks and flows, stock, flow, delay, buffer, dynamic equilibrium, resilience, self-organization, hierarchy, system boundaries, information flows, mental models, archetypes, policy resistance, tragedy of the commons, shifting the burden, drift to low performance, escalation, success to the successful, rule beating, seeking the wrong goal, leverage points, parameters and constants, stock and flow architecture, dominance shifting, nonlinear relationships, exponential growth, overshoot, collapsing back side of a peak, renewable resource constraint, nonrenewable resource constraint, carrying capacity, behavior over time graphs, stock-and-flow diagrams, clouds as sources and sinks, model simplification, scenario analysis, validation through behavior patterns, bounded rationality, satisficing, intrinsic responsibility, information transparency, feedback policies, meta-feedback and learning loops, paradigm, transcending paradigms, mental-model disclosure, measurement design, internalizing externalities, privatization versus regulation, mutual coercion mutually agreed upon, oscillation damping, overshoot and collapse management, time horizon expansion, boundary revision, scenario stress testing, nested systems, suboptimization, creative self-organization rules, diversity and redundancy, information accountability, learning organizations, error-embracing, language shaping perception, ethical boundary of caring, dance metaphor for system governance, systems literacy education, quantitative and qualitative integration, model transparency, feedback-based taxation, intrinsic versus extrinsic incentives, systemic ethics, sustainability, sustainable development, sustainable living practice, global modeling, complexity science, interconnection, cultural change through publishing, global commons stewardship, citizen empowerment, organizational learning, environmental studies education, conservation and environment policy, limits to growth modeling, resilience thinking, adaptive management, long-term forecasting, interdisciplinary research, transdisciplinary collaboration, stakeholder engagement, participatory action research, sustainability assessment, triple bottom line analysis, environmental communication, science communication via publishing, ecoethical stewardship, public policy advocacy, environmental pedagogy, community-based stewardship, behavioral change strategies, public engagement campaigns, environmental monitoring, systems mapping, leverage points identification, model validation and sensitivity, causal loop diagramming, stock and flow analysis, system archetypes, feedback loop dynamics, reinforcing feedback, balancing feedback, resource depletion dynamics, pollution accumulation dynamics, tipping points, exponential growth dynamics, planetary boundaries framework, ecological footprint accounting, socioecological systems analysis, ecological economics, regenerative agriculture, slow money investing, sustainable finance, conservation finance, food systems thinking, soil fertility management, consumer product toxicology, chemical exposure pathways, hazardous substances regulation, green chemistry principles, energy transition pathways, carbon emission mitigation strategies, climate solutions frameworks, scenario narratives, model parameter calibration, sensitivity analysis, trophic and nutrient cycles, public-facing environmental journalism, science-informed policy guidance, holistic assessment metrics, systems literacy, transformation pathways, boundary critique methods, integrative modeling, institutional change strategies, comparative analysis, case study method, grassroots mobilization, education for sustainable development, publicly accessible scientific literature, risk communication, environmental health science, holocene historical framing, gaia hypothesis discourse, science and society dialogue, environmental ethics, stewardship planning\nCategories: systems thinking, system dynamics, environmental science, public policy, organizational management, complexity science, systems science",
    "scores": {
      "hybrid": "0.321",
      "vector": "0.000",
      "bm25": "0.246",
      "title": "0.500",
      "concept": "0.688",
      "wordnet": "0.500"
    },
    "expanded_terms": [
      "system",
      "system dynamics",
      "system archetypes",
      "system boundaries",
      "window system factory",
      "spy classification system",
      "dance metaphor for system governance",
      "system and integration testing",
      "reward and punishment system",
      "arrangement"
    ]
  },
  {
    "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
    "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a biographical account by Ssu-ma Ch'ien of the ancient Chinese military strategist Sun Tzu, including his legendary demonstration of discipline by training the King of Wu's concubines, his successful campaigns against rival states, references to his descendant Sun Pin, and the opening lines of the first chapter on the vital importance of warfare to the state.\n\nKey Concepts: military strategy, principle of deception, logistics and supply, command and control, terrain analysis, timing and rapidity, moral law and morale, unity of purpose, economics of war, intelligence and espionage, risk management in warfare, adaptation and flexibility, assessment framework five constant factors, seven considerations assessment, nine situations framework, tactical dispositions, energy and momentum management, direct and indirect tactics, feint and baiting tactics, ambush operations, encirclement and concentration, division and concentration of forces, foraging and enemy sustenance strategy, siege avoidance principle, attack by stratagem, defensive posture doctrine, terrain classification six kinds, variation in tactics, maneuvering principles, signal and communication systems, secrecy and misinformation, captured resources integration, reward and punishment system, training and drill protocol, scouting and reconnaissance, river crossing tactics, night-fighting techniques, reading enemy signs, camouflage and concealment, holding high ground, cutting communications and lines of supply, coercive diplomacy and alliance management, command autonomy principle, measurement estimation calculation balancing process, battle readiness calculations, concentrate on weak points, avoidance of protracted warfare, seasonal and environmental planning, fire attack doctrine, water interdiction doctrine, spy classification system, converted spy exploitation, local spy operations, inward spy operations, doomed spy tactics, surviving spy operations, signal-fire coordination, gongs drums and banners, mantlets movable shelters, ramparts and mound engineering, baggage-train vulnerability, forbidden-camp signaling, simulated disorder and strength masking, combined-energy coordination, quality-of-decision timing, cheng direct tactics, chi indirect tactics, unit subdivision and signaling, rewards-from-spoils policy, integration of captured personnel, discipline enforcement mechanisms, leadership accountability, selection and employment of officers, training-to-task readiness, camp placement and health, salt-marsh operations, narrow pass employment, hemmed-in and desperate ground doctrine, psychological operations and mood study, camp security and internal order, prohibition of omen practices, use of local guides, forced march doctrine, synchronization and junction operations, interrogation of spies and counterintelligence, use of baits and enticements, economy-of-force principle, combined-arms momentum, chariot-centric force composition, unit-of-measure logistics pi cul, signals security and compartmentalization, camp sanitation and health maintenance\nCategories: military strategy, intelligence studies, logistics and supply chain, operations research, military history",
    "scores": {
      "hybrid": "0.103",
      "vector": "0.000",
      "bm25": "0.207",
      "title": "0.000",
      "concept": "0.375",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "system",
      "system dynamics",
      "system archetypes",
      "system boundaries",
      "window system factory",
      "spy classification system",
      "dance metaphor for system governance",
      "system and integration testing",
      "reward and punishment system",
      "arrangement"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through effective problem decomposition, modular abstractions, information hiding, and strategic practices, derived from the author's Stanford course on creating high-quality, maintainable code.\n\nKey Concepts: software complexity, incremental complexity, dependencies, obscurity, change amplification, cognitive load, unknown unknowns, obviousness in code, modular design, interface versus implementation, abstraction, deep module, shallow module, information hiding, information leakage, temporal decomposition, general-purpose module, special-purpose module, different layer different abstraction, pass-through method, decorator pattern, pass-through variable, context object pattern, pull complexity downwards, overexposure, defaults in interfaces, classitis, shallow method, repetition, separation of general-purpose and special-purpose code, undo history pattern, fence grouping, splitting and joining methods, conjoined methods, design it twice, strategic programming, tactical programming, tactical tornado, investment mindset, define errors out of existence, exception masking, exception aggregation, crash on fatal conditions, mask versus propagate trade-off, design special cases away, comments-first design, interface comments, implementation comments, comment conventions, comment repeats code, implementation documentation contaminates interface, cross-module design documentation, designNotes approach, choosing names, name precision, name consistency, short-name trade-offs, comments as design tool, procrastination of documentation, maintaining comments near code, avoiding duplicate documentation, pre-commit diff checks, consistency in design, enforceable style guidelines, when in rome principle, obvious code practices, white space and formatting, event-driven complexity, generic container anti-pattern, unit testing, system and integration testing, test-driven development critique, microbenchmarking, measure before modifying, critical path optimization, design around the critical path, buffer data structure optimization, ramcloud buffer redesign, design patterns evaluation, getters and setters critique, object-oriented inheritance trade-offs, consistency enforcement mechanisms, refactoring during maintenance, comments maintenance practices, cross-module invariants, red flags catalog, summary of design principles, design review practice, example-driven pedagogy\nCategories: software architecture, software engineering, systems design, programming languages, software maintenance",
    "scores": {
      "hybrid": "0.101",
      "vector": "0.000",
      "bm25": "0.158",
      "title": "0.000",
      "concept": "0.188",
      "wordnet": "0.250"
    },
    "expanded_terms": [
      "system",
      "system dynamics",
      "system archetypes",
      "system boundaries",
      "window system factory",
      "spy classification system",
      "dance metaphor for system governance",
      "system and integration testing",
      "reward and punishment system",
      "arrangement"
    ]
  },
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides a comprehensive catalog and guide to reusable design patterns in object-oriented programming, organized into creational, structural, and behavioral categories, illustrated through a document editor case study, and supplemented by prefaces, glossaries, notation guides, and a CD-ROM edition for enhanced accessibility.\n\nKey Concepts: object-oriented design, reusable software design, design patterns catalog, pattern template, creational patterns, structural patterns, behavioral patterns, intent section, motivation section, applicability section, structure diagramming, participants, consequences analysis, implementation guidance, known uses, related patterns, pattern classification by purpose, pattern classification by scope, mvc triad, program to an interface principle, favor composition over inheritance principle, delegation technique, class versus interface inheritance, compile-time versus run-time structure, aggregation versus acquaintance, encapsulation, polymorphism, inheritance reuse, object composition reuse, parameterized types and templates, design for change, causes of redesign, framework architecture, toolkit architecture, application design concerns, selection process for patterns, how to use a pattern, mvc as pattern composition, glyph composite model, glyph interface, composite pattern, compositor class, composition class, strategy pattern, transparent enclosure concept, monoglyph concept, decorator pattern, embellishment management, widget abstraction, abstract factory pattern, product family concept, factory as singleton, window abstraction, windowimp implementor, bridge pattern, window system factory, command pattern, menu item command relationship, undo command history, reversible operation flag, iterator pattern, createiterator operation, null iterator, list iterator, preorder iterator, traversal versus traversal action separation, visitor pattern, accept method, spelling checking visitor, hyphenation visitor, discretionary glyph, iterator visitor collaboration, flyweight pattern, intrinsic versus extrinsic state, flyweight factory, sharing and identity caveat, prototype pattern, clone semantics, prototype manager, initialize clones operation, builder pattern, director role, product internal representation, standard maze builder, counting maze builder, factory method pattern, parameterized factory method, templates versus factory methods, singleton pattern, singleton registry, shallow versus deep copy, class object as factory, adapter pattern, class adapter variant, object adapter variant, pluggable adapters, two-way adapter, facade pattern, subsystem public versus private interface, mediator pattern, proxy pattern, memento pattern, observer pattern, state pattern, template method pattern, chain of responsibility pattern, interpreter pattern, mediator as loose coupling, decorator usage caveats, caching invalidation responsibility, parent reference invariant, who deletes components policy, child-management interface design, traversal caching trade-offs, object sharing implications, layering with facades, pattern relationships graph, sample code pedagogy, notation and diagrams guide, foundation classes, case study methodology, lexi document editor, lexi formatting pipeline, spell-check and hyphenation analysis, glyph, character glyph, glyph context, extrinsic state, intrinsic state, btree font mapping, glyph factory, create character operation, virtual proxy, protection proxy, remote proxy, smart reference, image proxy, get extent operation, draw operation, handle mouse operation, operator arrow overloading, does not understand mechanism, copy on write, reference counting, concrete command, macro command, undo and redo, simple command template, receiver, invoker, command history, originator, caretaker, narrow and wide memento interfaces, incremental mementos, abstract syntax tree, terminal expression, nonterminal expression, parsing versus interpretation, double dispatch, element accept operation, equipment visitor, external iterator, internal iterator, cursor, iterator pointer proxy, robust iterator, composite traversal, successor link, request as object, help handler, colleague, dialog director, change manager, subject, observer, push versus pull model, subject-observer mapping, dangling reference avoidance, state object sharing, change state operation, table-driven state machine, compositor strategy, strategy as template, strategy optionality, hook operation, factory method, inverted control, adapter versus bridge, decorator versus proxy, prototype defer copying, separation of concerns, loose coupling, encapsulation boundaries, language feature exploitation, c++ template techniques, operator overloading idiom, doesnotunderstand forwarding, friend declaration, resource acquisition is initialization, robustness to modification, design refactoring, pattern vocabulary, pattern composition, implementation trade offs, sample code idioms, policy objects, separated interfaces, language portability, object traversal, encapsulating behavior, design patterns cataloging, trade off analysis, pattern applicability, sample domains, documentation as teaching\nCategories: software architecture, object-oriented design, software engineering, user interface design, object-oriented programming, programming languages",
    "scores": {
      "hybrid": "0.094",
      "vector": "0.000",
      "bm25": "0.125",
      "title": "0.000",
      "concept": "0.188",
      "wordnet": "0.250"
    },
    "expanded_terms": [
      "system",
      "system dynamics",
      "system archetypes",
      "system boundaries",
      "window system factory",
      "spy classification system",
      "dance metaphor for system governance",
      "system and integration testing",
      "reward and punishment system",
      "arrangement"
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
    "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides a comprehensive catalog and guide to reusable design patterns in object-oriented programming, organized into creational, structural, and behavioral categories, illustrated through a document editor case study, and supplemented by prefaces, glossaries, notation guides, and a CD-ROM edition for enhanced accessibility.\n\nKey Concepts: object-oriented design, reusable software design, design patterns catalog, pattern template, creational patterns, structural patterns, behavioral patterns, intent section, motivation section, applicability section, structure diagramming, participants, consequences analysis, implementation guidance, known uses, related patterns, pattern classification by purpose, pattern classification by scope, mvc triad, program to an interface principle, favor composition over inheritance principle, delegation technique, class versus interface inheritance, compile-time versus run-time structure, aggregation versus acquaintance, encapsulation, polymorphism, inheritance reuse, object composition reuse, parameterized types and templates, design for change, causes of redesign, framework architecture, toolkit architecture, application design concerns, selection process for patterns, how to use a pattern, mvc as pattern composition, glyph composite model, glyph interface, composite pattern, compositor class, composition class, strategy pattern, transparent enclosure concept, monoglyph concept, decorator pattern, embellishment management, widget abstraction, abstract factory pattern, product family concept, factory as singleton, window abstraction, windowimp implementor, bridge pattern, window system factory, command pattern, menu item command relationship, undo command history, reversible operation flag, iterator pattern, createiterator operation, null iterator, list iterator, preorder iterator, traversal versus traversal action separation, visitor pattern, accept method, spelling checking visitor, hyphenation visitor, discretionary glyph, iterator visitor collaboration, flyweight pattern, intrinsic versus extrinsic state, flyweight factory, sharing and identity caveat, prototype pattern, clone semantics, prototype manager, initialize clones operation, builder pattern, director role, product internal representation, standard maze builder, counting maze builder, factory method pattern, parameterized factory method, templates versus factory methods, singleton pattern, singleton registry, shallow versus deep copy, class object as factory, adapter pattern, class adapter variant, object adapter variant, pluggable adapters, two-way adapter, facade pattern, subsystem public versus private interface, mediator pattern, proxy pattern, memento pattern, observer pattern, state pattern, template method pattern, chain of responsibility pattern, interpreter pattern, mediator as loose coupling, decorator usage caveats, caching invalidation responsibility, parent reference invariant, who deletes components policy, child-management interface design, traversal caching trade-offs, object sharing implications, layering with facades, pattern relationships graph, sample code pedagogy, notation and diagrams guide, foundation classes, case study methodology, lexi document editor, lexi formatting pipeline, spell-check and hyphenation analysis, glyph, character glyph, glyph context, extrinsic state, intrinsic state, btree font mapping, glyph factory, create character operation, virtual proxy, protection proxy, remote proxy, smart reference, image proxy, get extent operation, draw operation, handle mouse operation, operator arrow overloading, does not understand mechanism, copy on write, reference counting, concrete command, macro command, undo and redo, simple command template, receiver, invoker, command history, originator, caretaker, narrow and wide memento interfaces, incremental mementos, abstract syntax tree, terminal expression, nonterminal expression, parsing versus interpretation, double dispatch, element accept operation, equipment visitor, external iterator, internal iterator, cursor, iterator pointer proxy, robust iterator, composite traversal, successor link, request as object, help handler, colleague, dialog director, change manager, subject, observer, push versus pull model, subject-observer mapping, dangling reference avoidance, state object sharing, change state operation, table-driven state machine, compositor strategy, strategy as template, strategy optionality, hook operation, factory method, inverted control, adapter versus bridge, decorator versus proxy, prototype defer copying, separation of concerns, loose coupling, encapsulation boundaries, language feature exploitation, c++ template techniques, operator overloading idiom, doesnotunderstand forwarding, friend declaration, resource acquisition is initialization, robustness to modification, design refactoring, pattern vocabulary, pattern composition, implementation trade offs, sample code idioms, policy objects, separated interfaces, language portability, object traversal, encapsulating behavior, design patterns cataloging, trade off analysis, pattern applicability, sample domains, documentation as teaching\nCategories: software architecture, object-oriented design, software engineering, user interface design, object-oriented programming, programming languages",
    "scores": {
      "hybrid": "0.340",
      "vector": "0.000",
      "bm25": "0.456",
      "title": "0.500",
      "concept": "1.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "pattern",
      "proxy pattern",
      "pattern template",
      "interpreter pattern",
      "memento pattern",
      "state pattern",
      "adapter pattern",
      "iterator pattern",
      "strategy pattern",
      "mediator pattern"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through effective problem decomposition, modular abstractions, information hiding, and strategic practices, derived from the author's Stanford course on creating high-quality, maintainable code.\n\nKey Concepts: software complexity, incremental complexity, dependencies, obscurity, change amplification, cognitive load, unknown unknowns, obviousness in code, modular design, interface versus implementation, abstraction, deep module, shallow module, information hiding, information leakage, temporal decomposition, general-purpose module, special-purpose module, different layer different abstraction, pass-through method, decorator pattern, pass-through variable, context object pattern, pull complexity downwards, overexposure, defaults in interfaces, classitis, shallow method, repetition, separation of general-purpose and special-purpose code, undo history pattern, fence grouping, splitting and joining methods, conjoined methods, design it twice, strategic programming, tactical programming, tactical tornado, investment mindset, define errors out of existence, exception masking, exception aggregation, crash on fatal conditions, mask versus propagate trade-off, design special cases away, comments-first design, interface comments, implementation comments, comment conventions, comment repeats code, implementation documentation contaminates interface, cross-module design documentation, designNotes approach, choosing names, name precision, name consistency, short-name trade-offs, comments as design tool, procrastination of documentation, maintaining comments near code, avoiding duplicate documentation, pre-commit diff checks, consistency in design, enforceable style guidelines, when in rome principle, obvious code practices, white space and formatting, event-driven complexity, generic container anti-pattern, unit testing, system and integration testing, test-driven development critique, microbenchmarking, measure before modifying, critical path optimization, design around the critical path, buffer data structure optimization, ramcloud buffer redesign, design patterns evaluation, getters and setters critique, object-oriented inheritance trade-offs, consistency enforcement mechanisms, refactoring during maintenance, comments maintenance practices, cross-module invariants, red flags catalog, summary of design principles, design review practice, example-driven pedagogy\nCategories: software architecture, software engineering, systems design, programming languages, software maintenance",
    "scores": {
      "hybrid": "0.064",
      "vector": "0.000",
      "bm25": "0.285",
      "title": "0.000",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "pattern",
      "proxy pattern",
      "pattern template",
      "interpreter pattern",
      "memento pattern",
      "state pattern",
      "adapter pattern",
      "iterator pattern",
      "strategy pattern",
      "mediator pattern"
    ]
  },
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "summary": "Thinking in Systems is a primer on systems thinking by Donella H. Meadows, offering foundational insights into system structures, behaviors, surprises, traps, leverage points for intervention, and practical applications for understanding and addressing complex real-world challenges like sustainability and global limits.\n\nKey Concepts: systems thinking, system dynamics, feedback loop, balancing feedback loop, reinforcing feedback loop, stocks and flows, stock, flow, delay, buffer, dynamic equilibrium, resilience, self-organization, hierarchy, system boundaries, information flows, mental models, archetypes, policy resistance, tragedy of the commons, shifting the burden, drift to low performance, escalation, success to the successful, rule beating, seeking the wrong goal, leverage points, parameters and constants, stock and flow architecture, dominance shifting, nonlinear relationships, exponential growth, overshoot, collapsing back side of a peak, renewable resource constraint, nonrenewable resource constraint, carrying capacity, behavior over time graphs, stock-and-flow diagrams, clouds as sources and sinks, model simplification, scenario analysis, validation through behavior patterns, bounded rationality, satisficing, intrinsic responsibility, information transparency, feedback policies, meta-feedback and learning loops, paradigm, transcending paradigms, mental-model disclosure, measurement design, internalizing externalities, privatization versus regulation, mutual coercion mutually agreed upon, oscillation damping, overshoot and collapse management, time horizon expansion, boundary revision, scenario stress testing, nested systems, suboptimization, creative self-organization rules, diversity and redundancy, information accountability, learning organizations, error-embracing, language shaping perception, ethical boundary of caring, dance metaphor for system governance, systems literacy education, quantitative and qualitative integration, model transparency, feedback-based taxation, intrinsic versus extrinsic incentives, systemic ethics, sustainability, sustainable development, sustainable living practice, global modeling, complexity science, interconnection, cultural change through publishing, global commons stewardship, citizen empowerment, organizational learning, environmental studies education, conservation and environment policy, limits to growth modeling, resilience thinking, adaptive management, long-term forecasting, interdisciplinary research, transdisciplinary collaboration, stakeholder engagement, participatory action research, sustainability assessment, triple bottom line analysis, environmental communication, science communication via publishing, ecoethical stewardship, public policy advocacy, environmental pedagogy, community-based stewardship, behavioral change strategies, public engagement campaigns, environmental monitoring, systems mapping, leverage points identification, model validation and sensitivity, causal loop diagramming, stock and flow analysis, system archetypes, feedback loop dynamics, reinforcing feedback, balancing feedback, resource depletion dynamics, pollution accumulation dynamics, tipping points, exponential growth dynamics, planetary boundaries framework, ecological footprint accounting, socioecological systems analysis, ecological economics, regenerative agriculture, slow money investing, sustainable finance, conservation finance, food systems thinking, soil fertility management, consumer product toxicology, chemical exposure pathways, hazardous substances regulation, green chemistry principles, energy transition pathways, carbon emission mitigation strategies, climate solutions frameworks, scenario narratives, model parameter calibration, sensitivity analysis, trophic and nutrient cycles, public-facing environmental journalism, science-informed policy guidance, holistic assessment metrics, systems literacy, transformation pathways, boundary critique methods, integrative modeling, institutional change strategies, comparative analysis, case study method, grassroots mobilization, education for sustainable development, publicly accessible scientific literature, risk communication, environmental health science, holocene historical framing, gaia hypothesis discourse, science and society dialogue, environmental ethics, stewardship planning\nCategories: systems thinking, system dynamics, environmental science, public policy, organizational management, complexity science, systems science",
    "scores": {
      "hybrid": "0.018",
      "vector": "0.000",
      "bm25": "0.080",
      "title": "0.000",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "pattern",
      "proxy pattern",
      "pattern template",
      "interpreter pattern",
      "memento pattern",
      "state pattern",
      "adapter pattern",
      "iterator pattern",
      "strategy pattern",
      "mediator pattern"
    ]
  }
]
```

---

## 3. broad_chunks_search

Hybrid scoring for chunks: 35% vector, 30% BM25, 20% concept, 15% WordNet (no title)

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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n56 \nstrategies;they encapsulate different formatting algorithms. A composition is \nthecontext for a compositor strategy. \nThe key to applying the Strategy pattern is designing interfaces forthe strategy \nand its context that are general enough to support arange of algorithms. You \nshouldn't have to change the strategy orcontext interface to support a new",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.226",
      "vector": "0.000",
      "bm25": "0.419",
      "concept": "0.500",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "military strategy",
      "strategy optionality",
      "compositor strategy",
      "strategy pattern",
      "strategy as template",
      "foraging and enemy sustenance strategy",
      "armed forces"
    ]
  },
  {
    "text": "at run-time by adding asingle SetCompositor operation to Composition's basic \nglyphinterface. \nStrategy Pattern \nEncapsulating an algorithm in an object is the intent of the Strategy (349) pattern. \nThe key participants in thepattern are Strategy objects (which encapsulate \ndifferent algorithms)and the context in which they operate. Compositors are",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.221",
      "vector": "0.000",
      "bm25": "0.403",
      "concept": "0.500",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "military strategy",
      "strategy optionality",
      "compositor strategy",
      "strategy pattern",
      "strategy as template",
      "foraging and enemy sustenance strategy",
      "armed forces"
    ]
  },
  {
    "text": "Compositor's interface is carefully designed to support alllayout algorithms that \nsubclasses might implement. You don't want tohave to change this interface with \nevery new subclass, because that willrequire changing existing subclasses. In \ngeneral, the Strategy andContext interfaces determine how well the pattern \nachieves its intent.",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.184",
      "vector": "0.000",
      "bm25": "0.281",
      "concept": "0.500",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "military strategy",
      "strategy optionality",
      "compositor strategy",
      "strategy pattern",
      "strategy as template",
      "foraging and enemy sustenance strategy",
      "armed forces"
    ]
  },
  {
    "text": "}; \n \nContext<MyStrategy> aContext; \nWith templates, there's no need to define an abstract class that defines \nthe interface to the Strategy. Using Strategy as atemplate parameter also \nlets you bind a Strategy to itsContext statically, which can increase \nefficiency. \n3. Making Strategy objects optional.The Context class may be simplified if \nit's meaningful not tohave a Strategy object. Context checks to see if it \nhas a Strategyobject before accessing it. If there is one, then Context",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.181",
      "vector": "0.000",
      "bm25": "0.436",
      "concept": "0.250",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "military strategy",
      "strategy optionality",
      "compositor strategy",
      "strategy pattern",
      "strategy as template",
      "foraging and enemy sustenance strategy",
      "armed forces"
    ]
  },
  {
    "text": "a decorator as a skin over an object that changes its behavior. An \nalternative is to change the object's guts. The Strategy (349) pattern is \na good example of a pattern for changing the guts.  \nStrategies are a better choice in situations where the Component class is \nintrinsically heavyweight, thereby making the Decorator pattern too costly \nto apply. In the Strategy pattern, the component forwards some of its \nbehavior to a separate strategy object. The Strategy pattern lets us alter",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.170",
      "vector": "0.000",
      "bm25": "0.401",
      "concept": "0.250",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "military strategy",
      "strategy optionality",
      "compositor strategy",
      "strategy pattern",
      "strategy as template",
      "foraging and enemy sustenance strategy",
      "armed forces"
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
    "text": "Chapter 19\nSoftware Trends\nAs a way of illustrating the principles discussed in this book, this chapter\nconsiders several trends and patterns that have become popular in software\ndevelopment over the last few decades. For each trend, I will describe how\nthat trend relates to the principles in this book and use the principles to\nevaluate whether that trend provides leverage against software complexity.\n19.1  Object-oriented programming and inheritance",
    "source": "Clean Architecture A Craftsman's Guide to Software",
    "scores": {
      "hybrid": "0.168",
      "vector": "0.043",
      "bm25": "0.354",
      "concept": "0.300",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "reusable software design",
      "framework architecture",
      "stock and flow architecture",
      "software complexity",
      "toolkit architecture",
      "software program",
      "computer software"
    ]
  },
  {
    "text": "13. Comments should describe things that are not obvious from the\ncode (see p. 101 ).\n14. Software should be designed for ease of reading, not ease of\nwriting (see p. 149 ).",
    "source": "Clean Architecture A Craftsman's Guide to Software",
    "scores": {
      "hybrid": "0.156",
      "vector": "0.163",
      "bm25": "0.311",
      "concept": "0.000",
      "wordnet": "0.091"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "reusable software design",
      "framework architecture",
      "stock and flow architecture",
      "software complexity",
      "toolkit architecture",
      "software program",
      "computer software"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n395 \nSoftware Architecture programsponsored by the U.S. Department of Defense [GM92] \nconcentrates on gathering architectural information. Theknowledge-based software \nengineering community tries to representsoftware-related knowledge in general. \nThere are many other groupswith goals at least a little like ours. \nJames Coplien's Advanced C++: Programming Styles andIdioms [Cop92] has influenced",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.155",
      "vector": "0.000",
      "bm25": "0.360",
      "concept": "0.300",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "reusable software design",
      "framework architecture",
      "stock and flow architecture",
      "software complexity",
      "toolkit architecture",
      "software program",
      "computer software"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n415 \n    Rect(Point(0, 0), Point(0, 0));",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.148",
      "vector": "0.000",
      "bm25": "0.337",
      "concept": "0.300",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "reusable software design",
      "framework architecture",
      "stock and flow architecture",
      "software complexity",
      "toolkit architecture",
      "software program",
      "computer software"
    ]
  },
  {
    "text": "15. The increments of software development should be abstractions,\nnot features (see p. 154 ).",
    "source": "Clean Architecture A Craftsman's Guide to Software",
    "scores": {
      "hybrid": "0.128",
      "vector": "0.067",
      "bm25": "0.397",
      "concept": "0.000",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "software",
      "architecture",
      "layers",
      "reusable software design",
      "framework architecture",
      "stock and flow architecture",
      "software complexity",
      "toolkit architecture",
      "software program",
      "computer software"
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
    "text": "goal (the thermostat), and a response mechanism (the furnace and/or air conditioner, fans, pumps, pipes, fuel, etc.). A complex system usually has numerous balancing feedback loops it can bring into play, so it can self-correct under different conditions and impacts. Some of those loops may be inactive much of the time—like the emergency cooling system in a nuclear power plant, or your ability to sweat or shiver to maintain your body temperature—but their presence is critical to the long term",
    "source": "Thinking in Systems",
    "scores": {
      "hybrid": "0.223",
      "vector": "0.012",
      "bm25": "0.305",
      "concept": "0.450",
      "wordnet": "0.250"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "meta-feedback and learning loops",
      "balancing feedback",
      "feedback loop dynamics",
      "reinforcing feedback loop",
      "feedback loop",
      "systems mapping",
      "systems literacy"
    ]
  },
  {
    "text": "expensive diagnostic machines can lead to out-of-sight health care costs. Escalation in morality can lead to holier-than-thou sanctimoniousness. Escalation in art can lead from baroque to rococo to kitsch. Escalation in environmentally responsible lifestyles can lead to rigid and unnecessary puritanism. Escalation, being a reinforcing feedback loop, builds exponentially. Therefore, it can carry a competition to extremes faster than anyone would believe possible. If nothing is done to break the",
    "source": "Thinking in Systems",
    "scores": {
      "hybrid": "0.209",
      "vector": "0.136",
      "bm25": "0.243",
      "concept": "0.350",
      "wordnet": "0.125"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "meta-feedback and learning loops",
      "balancing feedback",
      "feedback loop dynamics",
      "reinforcing feedback loop",
      "feedback loop",
      "systems mapping",
      "systems literacy"
    ]
  },
  {
    "text": "I don’t have to pay attention to it” ploy. No one can define or measure justice, democracy, security, freedom, truth, or love. No one can define or measure any value. But if no one speaks up for them, if systems aren’t designed to produce them, if we don’t speak about them and point toward their presence or absence, they will cease to exist. Make Feedback Policies for Feedback Systems President Jimmy Carter had an unusual ability to think in feedback terms and to make feedback policies.",
    "source": "Thinking in Systems",
    "scores": {
      "hybrid": "0.147",
      "vector": "0.073",
      "bm25": "0.341",
      "concept": "0.000",
      "wordnet": "0.125"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "meta-feedback and learning loops",
      "balancing feedback",
      "feedback loop dynamics",
      "reinforcing feedback loop",
      "feedback loop",
      "systems mapping",
      "systems literacy"
    ]
  },
  {
    "text": "practical understanding of how these systems work, and how to work with them. Modern systems theory, bound up with computers and equations, hides the fact that it traffics in truths known at some level by everyone. It is often possible, therefore, to make a direct translation from systems jargon to traditional wisdom. Because of feedback delays within complex systems, by the time a problem becomes apparent it may be unnecessarily difficult to solve. — A stitch in time saves nine. According to",
    "source": "Thinking in Systems",
    "scores": {
      "hybrid": "0.123",
      "vector": "0.029",
      "bm25": "0.314",
      "concept": "0.000",
      "wordnet": "0.125"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "meta-feedback and learning loops",
      "balancing feedback",
      "feedback loop dynamics",
      "reinforcing feedback loop",
      "feedback loop",
      "systems mapping",
      "systems literacy"
    ]
  },
  {
    "text": "programs are weak balancing loops that try to counter these strong reinforcing ones. It would be much more effective to weaken the reinforcing loops. That’s what progressive income tax, inheritance tax, and universal high-quality public education programs are meant to do. If the wealthy can influence government to weaken, rather than strengthen, those measures, then the government itself shifts from a balancing structure to one that reinforces success to the successful! Look for leverage points",
    "source": "Thinking in Systems",
    "scores": {
      "hybrid": "0.116",
      "vector": "0.000",
      "bm25": "0.262",
      "concept": "0.000",
      "wordnet": "0.250"
    },
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "meta-feedback and learning loops",
      "balancing feedback",
      "feedback loop dynamics",
      "reinforcing feedback loop",
      "feedback loop",
      "systems mapping",
      "systems literacy"
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n44 \nTable 1.2:  Design aspects that design patterns let you vary \nHow to Use a Design Pattern \nOnce you've picked a design pattern, how do you use it? Here's a step-by-step \napproach to applying a design pattern effectively: \n1. Read the pattern once through for an overview. Pay particular attention \nto the Applicability and Consequences sections to ensure the pattern is \nright for your problem.",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.221",
      "vector": "0.144",
      "bm25": "0.470",
      "concept": "0.150",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "factory method pattern",
      "abstract factory pattern",
      "pattern composition",
      "pattern template",
      "prototype pattern",
      "pattern vocabulary",
      "decorator pattern"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n122 \n \nApplication subclasses redefine an abstract CreateDocument operation on \nApplication to return the appropriate Document subclass. Once an Application \nsubclass is instantiated, it can then instantiate application-specific Documents \nwithout knowing their class. We call CreateDocument a factory method because it's \nresponsible for \"manufacturing\" an object. \nApplicability \nUse the Factory Method pattern when",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.209",
      "vector": "0.000",
      "bm25": "0.396",
      "concept": "0.450",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "factory method pattern",
      "abstract factory pattern",
      "pattern composition",
      "pattern template",
      "prototype pattern",
      "pattern vocabulary",
      "decorator pattern"
    ]
  },
  {
    "text": "A design pattern names, abstracts, and identifies the key aspects of a common \ndesign structure that make it useful for creating a reusable object-oriented design. \nThe design pattern identifies the participating classes and instances, their roles \nand collaborations, and the distribution of responsibilities. Each design pattern",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.201",
      "vector": "0.093",
      "bm25": "0.462",
      "concept": "0.150",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "factory method pattern",
      "abstract factory pattern",
      "pattern composition",
      "pattern template",
      "prototype pattern",
      "pattern vocabulary",
      "decorator pattern"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n431 \n \nDesign pattern relationships",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.199",
      "vector": "0.094",
      "bm25": "0.455",
      "concept": "0.150",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "factory method pattern",
      "abstract factory pattern",
      "pattern composition",
      "pattern template",
      "prototype pattern",
      "pattern vocabulary",
      "decorator pattern"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n102 \nConsequences \nThe Abstract Factory pattern has the following benefits and liabilities: \n1. It isolates concrete classes. The Abstract Factory pattern helps you control \nthe classes of objects that an application creates. Because a factory \nencapsulates the responsibility and the process of creating product objects, \nit isolates clients from implementation classes. Clients manipulate",
    "source": "Design Patterns Elements of Reusable Object-Oriented",
    "scores": {
      "hybrid": "0.187",
      "vector": "0.000",
      "bm25": "0.425",
      "concept": "0.300",
      "wordnet": "0.000"
    },
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "factory method pattern",
      "abstract factory pattern",
      "pattern composition",
      "pattern template",
      "prototype pattern",
      "pattern vocabulary",
      "decorator pattern"
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
  "total_concepts": 92,
  "primary_concepts": [
    "military strategy",
    "principle of deception",
    "logistics and supply",
    "command and control",
    "terrain analysis",
    "timing and rapidity",
    "moral law and morale",
    "unity of purpose",
    "economics of war",
    "intelligence and espionage"
  ],
  "related_concepts": [],
  "categories": [
    "military strategy",
    "intelligence studies",
    "logistics and supply chain",
    "operations research",
    "military history"
  ],
  "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a biographical account by Ssu-ma Ch'ien of the ancient Chinese military strategist Sun Tzu, including his legendary demonstration of discipline by training the King of Wu's concubines, his successful campaigns against rival states, references to his descendant Sun Pin, and the opening lines of the first chapter on the vital importance of warfare to the state.\n\nKey Concepts: military strategy, principle of deception, logistics and supply, command and control, terrain analysis, timing and rapidity, moral law and morale, unity of purpose, economics of war, intelligence and espionage, risk management in warfare, adaptation and flexibility, assessment framework five constant factors, seven considerations assessment, nine situations framework, tactical dispositions, energy and momentum management, direct and indirect tactics, feint and baiting tactics, ambush operations, encirclement and concentration, division and concentration of forces, foraging and enemy sustenance strategy, siege avoidance principle, attack by stratagem, defensive posture doctrine, terrain classification six kinds, variation in tactics, maneuvering principles, signal and communication systems, secrecy and misinformation, captured resources integration, reward and punishment system, training and drill protocol, scouting and reconnaissance, river crossing tactics, night-fighting techniques, reading enemy signs, camouflage and concealment, holding high ground, cutting communications and lines of supply, coercive diplomacy and alliance management, command autonomy principle, measurement estimation calculation balancing process, battle readiness calculations, concentrate on weak points, avoidance of protracted warfare, seasonal and environmental planning, fire attack doctrine, water interdiction doctrine, spy classification system, converted spy exploitation, local spy operations, inward spy operations, doomed spy tactics, surviving spy operations, signal-fire coordination, gongs drums and banners, mantlets movable shelters, ramparts and mound engineering, baggage-train vulnerability, forbidden-camp signaling, simulated disorder and strength masking, combined-energy coordination, quality-of-decision timing, cheng direct tactics, chi indirect tactics, unit subdivision and signaling, rewards-from-spoils policy, integration of captured personnel, discipline enforcement mechanisms, leadership accountability, selection and employment of officers, training-to-task readiness, camp placement and health, salt-marsh operations, narrow pass employment, hemmed-in and desperate ground doctrine, psychological operations and mood study, camp security and internal order, prohibition of omen practices, use of local guides, forced march doctrine, synchronization and junction operations, interrogation of spies and counterintelligence, use of baits and enticements, economy-of-force principle, combined-arms momentum, chariot-centric force composition, unit-of-measure logistics pi cul, signals security and compartmentalization, camp sanitation and health maintenance\nCategories: military strategy, intelligence studies, logistics and supply chain, operations research, military history",
  "_note": "Showing 10 of 92 concepts"
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
  "document": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
  "document_hash": "dbb4b1747f756048f6b6d2f08035084c88a6e96f1485af0978d9840444deaf6d",
  "total_concepts": 89,
  "primary_concepts": [
    "software complexity",
    "incremental complexity",
    "dependencies",
    "obscurity",
    "change amplification",
    "cognitive load",
    "unknown unknowns",
    "obviousness in code",
    "modular design",
    "interface versus implementation"
  ],
  "related_concepts": [],
  "categories": [
    "software architecture",
    "software engineering",
    "systems design",
    "programming languages",
    "software maintenance"
  ],
  "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through effective problem decomposition, modular abstractions, information hiding, and strategic practices, derived from the author's Stanford course on creating high-quality, maintainable code.\n\nKey Concepts: software complexity, incremental complexity, dependencies, obscurity, change amplification, cognitive load, unknown unknowns, obviousness in code, modular design, interface versus implementation, abstraction, deep module, shallow module, information hiding, information leakage, temporal decomposition, general-purpose module, special-purpose module, different layer different abstraction, pass-through method, decorator pattern, pass-through variable, context object pattern, pull complexity downwards, overexposure, defaults in interfaces, classitis, shallow method, repetition, separation of general-purpose and special-purpose code, undo history pattern, fence grouping, splitting and joining methods, conjoined methods, design it twice, strategic programming, tactical programming, tactical tornado, investment mindset, define errors out of existence, exception masking, exception aggregation, crash on fatal conditions, mask versus propagate trade-off, design special cases away, comments-first design, interface comments, implementation comments, comment conventions, comment repeats code, implementation documentation contaminates interface, cross-module design documentation, designNotes approach, choosing names, name precision, name consistency, short-name trade-offs, comments as design tool, procrastination of documentation, maintaining comments near code, avoiding duplicate documentation, pre-commit diff checks, consistency in design, enforceable style guidelines, when in rome principle, obvious code practices, white space and formatting, event-driven complexity, generic container anti-pattern, unit testing, system and integration testing, test-driven development critique, microbenchmarking, measure before modifying, critical path optimization, design around the critical path, buffer data structure optimization, ramcloud buffer redesign, design patterns evaluation, getters and setters critique, object-oriented inheritance trade-offs, consistency enforcement mechanisms, refactoring during maintenance, comments maintenance practices, cross-module invariants, red flags catalog, summary of design principles, design review practice, example-driven pedagogy\nCategories: software architecture, software engineering, systems design, programming languages, software maintenance",
  "_note": "Showing 10 of 89 concepts"
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
  "total_concepts": 162,
  "primary_concepts": [
    "systems thinking",
    "system dynamics",
    "feedback loop",
    "balancing feedback loop",
    "reinforcing feedback loop",
    "stocks and flows",
    "stock",
    "flow",
    "delay",
    "buffer"
  ],
  "related_concepts": [],
  "categories": [
    "systems thinking",
    "system dynamics",
    "environmental science",
    "public policy",
    "organizational management",
    "complexity science",
    "systems science"
  ],
  "summary": "Thinking in Systems is a primer on systems thinking by Donella H. Meadows, offering foundational insights into system structures, behaviors, surprises, traps, leverage points for intervention, and practical applications for understanding and addressing complex real-world challenges like sustainability and global limits.\n\nKey Concepts: systems thinking, system dynamics, feedback loop, balancing feedback loop, reinforcing feedback loop, stocks and flows, stock, flow, delay, buffer, dynamic equilibrium, resilience, self-organization, hierarchy, system boundaries, information flows, mental models, archetypes, policy resistance, tragedy of the commons, shifting the burden, drift to low performance, escalation, success to the successful, rule beating, seeking the wrong goal, leverage points, parameters and constants, stock and flow architecture, dominance shifting, nonlinear relationships, exponential growth, overshoot, collapsing back side of a peak, renewable resource constraint, nonrenewable resource constraint, carrying capacity, behavior over time graphs, stock-and-flow diagrams, clouds as sources and sinks, model simplification, scenario analysis, validation through behavior patterns, bounded rationality, satisficing, intrinsic responsibility, information transparency, feedback policies, meta-feedback and learning loops, paradigm, transcending paradigms, mental-model disclosure, measurement design, internalizing externalities, privatization versus regulation, mutual coercion mutually agreed upon, oscillation damping, overshoot and collapse management, time horizon expansion, boundary revision, scenario stress testing, nested systems, suboptimization, creative self-organization rules, diversity and redundancy, information accountability, learning organizations, error-embracing, language shaping perception, ethical boundary of caring, dance metaphor for system governance, systems literacy education, quantitative and qualitative integration, model transparency, feedback-based taxation, intrinsic versus extrinsic incentives, systemic ethics, sustainability, sustainable development, sustainable living practice, global modeling, complexity science, interconnection, cultural change through publishing, global commons stewardship, citizen empowerment, organizational learning, environmental studies education, conservation and environment policy, limits to growth modeling, resilience thinking, adaptive management, long-term forecasting, interdisciplinary research, transdisciplinary collaboration, stakeholder engagement, participatory action research, sustainability assessment, triple bottom line analysis, environmental communication, science communication via publishing, ecoethical stewardship, public policy advocacy, environmental pedagogy, community-based stewardship, behavioral change strategies, public engagement campaigns, environmental monitoring, systems mapping, leverage points identification, model validation and sensitivity, causal loop diagramming, stock and flow analysis, system archetypes, feedback loop dynamics, reinforcing feedback, balancing feedback, resource depletion dynamics, pollution accumulation dynamics, tipping points, exponential growth dynamics, planetary boundaries framework, ecological footprint accounting, socioecological systems analysis, ecological economics, regenerative agriculture, slow money investing, sustainable finance, conservation finance, food systems thinking, soil fertility management, consumer product toxicology, chemical exposure pathways, hazardous substances regulation, green chemistry principles, energy transition pathways, carbon emission mitigation strategies, climate solutions frameworks, scenario narratives, model parameter calibration, sensitivity analysis, trophic and nutrient cycles, public-facing environmental journalism, science-informed policy guidance, holistic assessment metrics, systems literacy, transformation pathways, boundary critique methods, integrative modeling, institutional change strategies, comparative analysis, case study method, grassroots mobilization, education for sustainable development, publicly accessible scientific literature, risk communication, environmental health science, holocene historical framing, gaia hypothesis discourse, science and society dialogue, environmental ethics, stewardship planning\nCategories: systems thinking, system dynamics, environmental science, public policy, organizational management, complexity science, systems science",
  "_note": "Showing 10 of 162 concepts"
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
  "total_concepts": 216,
  "primary_concepts": [
    "object-oriented design",
    "reusable software design",
    "design patterns catalog",
    "pattern template",
    "creational patterns",
    "structural patterns",
    "behavioral patterns",
    "intent section",
    "motivation section",
    "applicability section"
  ],
  "related_concepts": [],
  "categories": [
    "software architecture",
    "object-oriented design",
    "software engineering",
    "user interface design",
    "object-oriented programming",
    "programming languages"
  ],
  "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides a comprehensive catalog and guide to reusable design patterns in object-oriented programming, organized into creational, structural, and behavioral categories, illustrated through a document editor case study, and supplemented by prefaces, glossaries, notation guides, and a CD-ROM edition for enhanced accessibility.\n\nKey Concepts: object-oriented design, reusable software design, design patterns catalog, pattern template, creational patterns, structural patterns, behavioral patterns, intent section, motivation section, applicability section, structure diagramming, participants, consequences analysis, implementation guidance, known uses, related patterns, pattern classification by purpose, pattern classification by scope, mvc triad, program to an interface principle, favor composition over inheritance principle, delegation technique, class versus interface inheritance, compile-time versus run-time structure, aggregation versus acquaintance, encapsulation, polymorphism, inheritance reuse, object composition reuse, parameterized types and templates, design for change, causes of redesign, framework architecture, toolkit architecture, application design concerns, selection process for patterns, how to use a pattern, mvc as pattern composition, glyph composite model, glyph interface, composite pattern, compositor class, composition class, strategy pattern, transparent enclosure concept, monoglyph concept, decorator pattern, embellishment management, widget abstraction, abstract factory pattern, product family concept, factory as singleton, window abstraction, windowimp implementor, bridge pattern, window system factory, command pattern, menu item command relationship, undo command history, reversible operation flag, iterator pattern, createiterator operation, null iterator, list iterator, preorder iterator, traversal versus traversal action separation, visitor pattern, accept method, spelling checking visitor, hyphenation visitor, discretionary glyph, iterator visitor collaboration, flyweight pattern, intrinsic versus extrinsic state, flyweight factory, sharing and identity caveat, prototype pattern, clone semantics, prototype manager, initialize clones operation, builder pattern, director role, product internal representation, standard maze builder, counting maze builder, factory method pattern, parameterized factory method, templates versus factory methods, singleton pattern, singleton registry, shallow versus deep copy, class object as factory, adapter pattern, class adapter variant, object adapter variant, pluggable adapters, two-way adapter, facade pattern, subsystem public versus private interface, mediator pattern, proxy pattern, memento pattern, observer pattern, state pattern, template method pattern, chain of responsibility pattern, interpreter pattern, mediator as loose coupling, decorator usage caveats, caching invalidation responsibility, parent reference invariant, who deletes components policy, child-management interface design, traversal caching trade-offs, object sharing implications, layering with facades, pattern relationships graph, sample code pedagogy, notation and diagrams guide, foundation classes, case study methodology, lexi document editor, lexi formatting pipeline, spell-check and hyphenation analysis, glyph, character glyph, glyph context, extrinsic state, intrinsic state, btree font mapping, glyph factory, create character operation, virtual proxy, protection proxy, remote proxy, smart reference, image proxy, get extent operation, draw operation, handle mouse operation, operator arrow overloading, does not understand mechanism, copy on write, reference counting, concrete command, macro command, undo and redo, simple command template, receiver, invoker, command history, originator, caretaker, narrow and wide memento interfaces, incremental mementos, abstract syntax tree, terminal expression, nonterminal expression, parsing versus interpretation, double dispatch, element accept operation, equipment visitor, external iterator, internal iterator, cursor, iterator pointer proxy, robust iterator, composite traversal, successor link, request as object, help handler, colleague, dialog director, change manager, subject, observer, push versus pull model, subject-observer mapping, dangling reference avoidance, state object sharing, change state operation, table-driven state machine, compositor strategy, strategy as template, strategy optionality, hook operation, factory method, inverted control, adapter versus bridge, decorator versus proxy, prototype defer copying, separation of concerns, loose coupling, encapsulation boundaries, language feature exploitation, c++ template techniques, operator overloading idiom, doesnotunderstand forwarding, friend declaration, resource acquisition is initialization, robustness to modification, design refactoring, pattern vocabulary, pattern composition, implementation trade offs, sample code idioms, policy objects, separated interfaces, language portability, object traversal, encapsulating behavior, design patterns cataloging, trade off analysis, pattern applicability, sample domains, documentation as teaching\nCategories: software architecture, object-oriented design, software engineering, user interface design, object-oriented programming, programming languages",
  "_note": "Showing 10 of 216 concepts"
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
    "totalCategories": 20,
    "categoriesReturned": 20,
    "rootCategories": 0,
    "totalDocuments": 4,
    "sortedBy": "popularity",
    "searchQuery": null
  },
  "categories": [
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
        "documents": 2,
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
        "documents": 2,
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
        "documents": 2,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3161982455,
      "name": "complexity science",
      "description": "Concepts and practices related to complexity science",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "complexity science"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 1309507469,
      "name": "environmental science",
      "description": "Concepts and practices related to environmental science",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "environmental science"
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
      "id": 1087994018,
      "name": "military history",
      "description": "Concepts and practices related to military history",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "military history"
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
      "id": 2833643773,
      "name": "object-oriented design",
      "description": "Concepts and practices related to object-oriented design",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "object-oriented design"
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
      "id": 1573810230,
      "name": "organizational management",
      "description": "Concepts and practices related to organizational management",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "organizational management"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3183338954,
      "name": "public policy",
      "description": "Concepts and practices related to public policy",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "public policy"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 1697946135,
      "name": "software maintenance",
      "description": "Concepts and practices related to software maintenance",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "software maintenance"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 1787959346,
      "name": "system dynamics",
      "description": "Concepts and practices related to system dynamics",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "system dynamics"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3124593461,
      "name": "systems design",
      "description": "Concepts and practices related to systems design",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "systems design"
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
    },
    {
      "id": 2877534165,
      "name": "user interface design",
      "description": "Concepts and practices related to user interface design",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "user interface design"
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
    "totalConcepts": 92,
    "documentsReturned": 1
  },
  "documents": [
    {
      "title": "",
      "preview": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a biographical account by Ssu-ma Ch'ien of the ancient Chinese military strategist Sun Tzu, including his legendary demonstrat...",
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
    "totalDocuments": 2,
    "totalChunks": 0,
    "totalConcepts": 304,
    "documentsReturned": 2
  },
  "documents": [
    {
      "title": "",
      "preview": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through effective problem decomposition, modular abstractions, information hiding, and strategic prac...",
      "primaryConcepts": []
    },
    {
      "title": "",
      "preview": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides a comprehensive catalog and guide to reusable design patterns in object-oriented programming, organized into creat...",
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
    "totalConcepts": 162,
    "documentsReturned": 1
  },
  "documents": [
    {
      "title": "",
      "preview": "Thinking in Systems is a primer on systems thinking by Donella H. Meadows, offering foundational insights into system structures, behaviors, surprises, traps, leverage points for intervention, and pra...",
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
    "timestamp": "2025-12-03T16:34:32.977Z"
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