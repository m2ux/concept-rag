# MCP Tool Test Report - Detailed Output

**Generated:** 2025-11-28T16:21:19.962Z
**Database:** ./test_db

---

## 1. concept_search

Hybrid scoring: 40% name, 30% vector, 20% BM25, 10% synonyms

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
  "summary": "Systematic planning and conduct of armed conflict to achieve political objectives. In this document it encompasses deception, timing, logistics, terrain exploitation, unified command, and economy of force to secure victory while minimizing cost and national suffering.",
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
      "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
      "pages": []
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
  "concept": "software complexity",
  "concept_id": 3445340504,
  "summary": "Structure-related characteristics of a software system that make it hard to understand and modify. This document treats complexity as the developer’s experience of cognitive load, change amplification, and unknown unknowns, and emphasizes design choices to minimize it throughout a system’s lifetime.",
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
      "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
      "pages": [
        12,
        13,
        14
      ]
    }
  ],
  "chunks": [
    {
      "text": "complexity.  This  book is  an  opinion piece, so  some readers will disagree\nwith some of  my suggestions. If  you do disagree, try to  understand why.\nI’m interested in  hearing about things that work for you, things that don’t\nwork, and any other ideas you may have about software design. I hope that\nthe ensuing conversations will improve our collective understanding of\nsoftware design.  I  will incorporate what I  learn in  future editions of  this\nbook.",
      "title": "Clean Architecture A Craftsman's Guide to Software",
      "page": 12,
      "concept_density": "0.000",
      "concepts": [
        "software complexity"
      ]
    },
    {
      "text": "If for some reason the software-design-book Google Group should disappear\nin the future, search on the Web for my home page; it will contain updated\ninstructions for how to  communicate about the book. Please don’t  send\nbook-related email to my personal email address.\nI recommend that you take the suggestions in this book with a grain of\nsalt. The overall goal is to reduce complexity; this is more important than\nany particular principle or idea you read here. If you try an idea from this",
      "title": "Clean Architecture A Craftsman's Guide to Software",
      "page": 13,
      "concept_density": "0.000",
      "concepts": [
        "software complexity"
      ]
    },
    {
      "text": "Chapter 1\nIntroduction\n(It’s All About Complexity)\nWriting computer software is one of the purest creative activities in the\nhistory of the human race. Programmers aren’t  bound by  practical\nlimitations such  as the laws of physics; we can create exciting virtual\nworlds with behaviors that could never exist in the real world.\nProgramming doesn’t require great physical skill or coordination, like ballet\nor basketball. All programming requires is a creative mind and the ability to",
      "title": "Clean Architecture A Craftsman's Guide to Software",
      "page": 14,
      "concept_density": "0.000",
      "concepts": [
        "software complexity"
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
  "summary": "A closed causal chain where changes in a stock influence flows that in turn change that same stock through information and decisions. The document centers feedback loops as the primary drivers of system behavior, stability, and surprise.",
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
      "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
      "pages": [
        1
      ]
    }
  ],
  "chunks": [
    {
      "text": "to the competitive exclusion principle, if a reinforcing feedback loop rewards the winner of a competition with the means to win further competitions, the result will be the elimination of all but a few competitors. — For he that hath, to him shall be given; and he that hath not, from him shall be taken even that which he hath (Mark 4:25) or — The rich get richer and the poor get poorer. A diverse system with multiple pathways and redundancies is more stable and less vulnerable to external",
      "title": "Thinking in Systems",
      "page": 1,
      "concept_density": "0.000",
      "concepts": [
        "system",
        "feedback loop",
        "reinforcing feedback loop"
      ]
    },
    {
      "text": "you’ll find that you can understand this graphical language easily. I start with the basics: the definition of a system and a dissection of its parts (in a reductionist, unholistic way). Then I put the parts back together to show how they interconnect to make the basic operating unit of a system: the feedback loop. Next I will introduce you to a systems zoo—a collection of some common and interesting types of systems. You’ll see how a few of these creatures behave and why and where they can be",
      "title": "Thinking in Systems",
      "page": 1,
      "concept_density": "0.000",
      "concepts": [
        "system",
        "feedback loop"
      ]
    }
  ],
  "stats": {
    "total_documents": 1,
    "total_chunks": 100,
    "sources_returned": 1,
    "chunks_returned": 2
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
  "summary": "A wrapping design where an object implements the same API as an inner object and extends behavior by delegating calls. The book cautions against proliferation of shallow decorator classes and suggests folding frequently-used decorators into core classes or combining decorators where appropriate.",
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
      "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
      "pages": []
    },
    {
      "title": "Design Patterns Elements of Reusable Object-Oriented - Gamma, Erich;Helm, Richard;Johnson, Ralph E ;Vlissides, John - Uttar Pradesh, India, 2016 - 9780201633610 - 2121300da35565356b45a1b90df80e9d - Anna’s Archive",
      "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
      "pages": [
        3,
        10,
        16
      ]
    }
  ],
  "chunks": [
    {
      "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n3 \n4 Structural Patterns..............................................155 \nAdapter...........................................................157 \nBridge............................................................171 \nComposite.........................................................183 \nDecorator.........................................................196 \nFaçade............................................................208",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 3,
      "concept_density": "0.000",
      "concepts": [
        "design patterns",
        "adapter pattern",
        "bridge pattern",
        "composite pattern",
        "decorator pattern",
        "structural patterns"
      ]
    },
    {
      "text": "problems. Somepeople read the catalog through first and then use aproblem-directed \napproach to apply the patterns to their projects. \nIf you aren't an experienced object-oriented designer, then start withthe simplest \nand most common patterns: \n• Abstract Factory (page 99) \n• Adapter (157) \n• Composite (183) \n• Decorator (196) \n• Factory Method (121) \n• Observer (326) \n• Strategy (349) \n• Template Method (360) \nIt's hard to find an object-oriented system that doesn't use at leasta couple",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 10,
      "concept_density": "0.000",
      "concepts": [
        "design patterns",
        "pattern template",
        "related patterns",
        "abstract factory pattern",
        "factory method pattern",
        "adapter pattern",
        "composite pattern",
        "decorator pattern",
        "observer pattern",
        "strategy pattern"
      ]
    },
    {
      "text": "to replace the algorithm either statically or dynamically, when you have a lot \nof variants of the algorithm, or when the algorithm has complex data structures \nthat you want to encapsulate. \nMVC uses other design patterns, such as Factory Method (121) to specify the default \ncontroller class for a view and Decorator (196) to add scrolling to a view. But \nthe main relationships in MVC are given by the Observer, Composite, and Strategy \ndesign patterns. \nDescribing Design Patterns",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 16,
      "concept_density": "0.000",
      "concepts": [
        "design patterns",
        "related patterns",
        "factory method pattern",
        "composite pattern",
        "decorator pattern",
        "observer pattern",
        "strategy pattern"
      ]
    }
  ],
  "stats": {
    "total_documents": 2,
    "total_chunks": 200,
    "sources_returned": 2,
    "chunks_returned": 3
  }
}
```

---

## 2. catalog_search

Hybrid scoring: 30% vector, 30% BM25, 25% title, 15% WordNet

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
    "text_preview": "...",
    "scores": {
      "hybrid": "0.282",
      "vector": "-0.895",
      "bm25": "1.000",
      "title": "1.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "war",
      "state of war",
      "hostility"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.280",
      "vector": "-0.899",
      "bm25": "1.000",
      "title": "1.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "war",
      "state of war",
      "hostility"
    ]
  },
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.034",
      "vector": "-0.888",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "war",
      "state of war",
      "hostility"
    ]
  },
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.032",
      "vector": "-0.892",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "war",
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
    "text_preview": "...",
    "scores": {
      "hybrid": "0.402",
      "vector": "-0.492",
      "bm25": "1.000",
      "title": "1.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "architecture",
      "computer architecture",
      "structure"
    ]
  },
  {
    "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.153",
      "vector": "-0.489",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "architecture",
      "computer architecture",
      "structure"
    ]
  },
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.142",
      "vector": "-0.526",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "architecture",
      "computer architecture",
      "structure"
    ]
  },
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.136",
      "vector": "-0.546",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "architecture",
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
    "text_preview": "...",
    "scores": {
      "hybrid": "0.357",
      "vector": "-0.645",
      "bm25": "1.000",
      "title": "1.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "system",
      "plan of action"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.067",
      "vector": "-0.776",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "system",
      "plan of action"
    ]
  },
  {
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.065",
      "vector": "-0.784",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "system",
      "plan of action"
    ]
  },
  {
    "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.062",
      "vector": "-0.792",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "system",
      "plan of action"
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
    "text_preview": "...",
    "scores": {
      "hybrid": "0.385",
      "vector": "-0.550",
      "bm25": "1.000",
      "title": "1.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "pattern",
      "match"
    ]
  },
  {
    "source": "sample-docs/Programming/Clean Architecture_ A Craftsman's Guide to Software -- Robert C_ Martin -- Robert C_ Martin Series, 1st Edition, September 10, 2017 -- Pearson -- 9780134494166 -- 29f880be2248b1d30f3d956a037bb366 -- Anna’s Archive.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.097",
      "vector": "-0.677",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "pattern",
      "match"
    ]
  },
  {
    "source": "sample-docs/Programming/Thinking in Systems -- Meadows, Donella H -- 2008 -- Chelsea Green Publishing -- 9781603580052 -- 65f9216dde8878346246dd88ded41946 -- Anna’s Archive.epub",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.092",
      "vector": "-0.694",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "pattern",
      "match"
    ]
  },
  {
    "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "0.091",
      "vector": "-0.697",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "pattern",
      "match"
    ]
  }
]
```

---

## 3. broad_chunks_search

Hybrid scoring: 40% vector, 40% BM25, 20% WordNet (no title)

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
    "text": "chapter.  But he proceeds to give a biography of his descendant,  Sun Pin,\nborn about a hundred years after his famous ancestor's death, and also the\noutstanding military genius of his time.  The historian speaks of him too as\nSun Tzu, and in his preface we read:  \"Sun Tzu had his feet cut off and yet\ncontinued to discuss the art of war.\" It seems likely, then, that  \"Pin\" was a\nnickname  bestowed  on  him  after  his  mutilation,  unless  the  story  was",
    "source": "",
    "scores": {
      "hybrid": "0.361",
      "vector": "-0.097",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "drawback in that a client must understandhow Strategies differ before it \ncan select the appropriate one.Clients might be exposed to implementation \nissues. Therefore youshould use the Strategy pattern only when the variation \nin behavior isrelevant to clients. \n6. Communication overhead between Strategy and Context.The Strategy interface \nis shared by all ConcreteStrategy classeswhether the algorithms they \nimplement are trivial or complex. Henceit's likely that some",
    "source": "",
    "scores": {
      "hybrid": "0.342",
      "vector": "-0.144",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n56 \nstrategies;they encapsulate different formatting algorithms. A composition is \nthecontext for a compositor strategy. \nThe key to applying the Strategy pattern is designing interfaces forthe strategy \nand its context that are general enough to support arange of algorithms. You \nshouldn't have to change the strategy orcontext interface to support a new",
    "source": "",
    "scores": {
      "hybrid": "0.333",
      "vector": "-0.167",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "o maintains a reference to a Strategy object. \no may define an interface that lets Strategy access its data. \nCollaborations \n• Strategy and Context interact to implement the chosen algorithm. Acontext \nmay pass all data required by the algorithm to the strategywhen the algorithm \nis called. Alternatively, the context can passitself as an argument to \nStrategy operations. That lets the strategycall back on the context as \nrequired.",
    "source": "",
    "scores": {
      "hybrid": "0.328",
      "vector": "-0.180",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "at run-time by adding asingle SetCompositor operation to Composition's basic \nglyphinterface. \nStrategy Pattern \nEncapsulating an algorithm in an object is the intent of the Strategy (349) pattern. \nThe key participants in thepattern are Strategy objects (which encapsulate \ndifferent algorithms)and the context in which they operate. Compositors are",
    "source": "",
    "scores": {
      "hybrid": "0.320",
      "vector": "-0.200",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "37.  By altering his arrangements and changing his plans,\n     [Wang Hsi thinks that this means not using the same stratagem twice.]\nhe keeps the enemy without definite knowledge.",
    "source": "",
    "scores": {
      "hybrid": "0.316",
      "vector": "-0.209",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "strategies as statelessobjects that contexts can share. Any residual state \nis maintained by thecontext, which passes it in each request to the Strategy \nobject. Sharedstrategies should not maintain state across invocations. The \nFlyweight (218) pattern describes this approach in moredetail. \nImplementation \nConsider the following implementation issues: \n1. Defining the Strategy and Context interfaces.The Strategy and Context",
    "source": "",
    "scores": {
      "hybrid": "0.312",
      "vector": "-0.219",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "without changing their class(es)",
    "source": "",
    "scores": {
      "hybrid": "0.310",
      "vector": "-0.224",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "}; \n \nContext<MyStrategy> aContext; \nWith templates, there's no need to define an abstract class that defines \nthe interface to the Strategy. Using Strategy as atemplate parameter also \nlets you bind a Strategy to itsContext statically, which can increase \nefficiency. \n3. Making Strategy objects optional.The Context class may be simplified if \nit's meaningful not tohave a Strategy object. Context checks to see if it \nhas a Strategyobject before accessing it. If there is one, then Context",
    "source": "",
    "scores": {
      "hybrid": "0.299",
      "vector": "-0.252",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "and his forces being thus distributed in many directions,  the numbers we\nshall have to face at any given point will be proportionately few.\n     17.  For should the enemy strengthen his van, he will weaken his rear;\nshould he strengthen his rear, he will weaken his van; should he strengthen\nhis  left,  he  will  weaken  his  right;    should  he  strengthen  his  right,  he  will\nweaken his left.  If he sends reinforcements everywhere, he will everywhere\nbe weak.",
    "source": "",
    "scores": {
      "hybrid": "0.295",
      "vector": "-0.318",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.111"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "11.  All armies prefer high ground to low.\n     [\"High Ground,\"  says Mei Yao-ch`en,  \"is not only more agreement and\nsalubrious, but more convenient from a military point of view; low ground\nis not only damp and unhealthy,  but also disadvantageous for fighting.\"]",
    "source": "",
    "scores": {
      "hybrid": "0.291",
      "vector": "-0.274",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "a decorator as a skin over an object that changes its behavior. An \nalternative is to change the object's guts. The Strategy (349) pattern is \na good example of a pattern for changing the guts.  \nStrategies are a better choice in situations where the Component class is \nintrinsically heavyweight, thereby making the Decorator pattern too costly \nto apply. In the Strategy pattern, the component forwards some of its \nbehavior to a separate strategy object. The Strategy pattern lets us alter",
    "source": "",
    "scores": {
      "hybrid": "0.290",
      "vector": "-0.276",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "a  battle,  may  give  the  appearance  of  disorder  when  no  real  disorder  is\npossible.  Your formation may be without head or tail, your dispositions all\ntopsy-turvy,  and yet a rout of your forces quite out of the question.\"]\n     17.  Simulated disorder postulates perfect   discipline, simulated fear\npostulates courage; simulated weakness postulates strength.\n     [In order to make the translation intelligible,  it is necessary to tone down",
    "source": "",
    "scores": {
      "hybrid": "0.287",
      "vector": "-0.338",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.111"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "duelist who finds his adversary's point menacing him with certain death, and\nhis  own  guard  astray,    is  compelled  to  conform  to  his      adversary's\nmovements,    and  to  content  himself  with  warding  off  his  thrusts,  so  the\ncommander whose communications are suddenly threatened finds himself\nin a false position, and he will be fortunate if he has not to change all his\nplans,  to  split  up  his  force  into  more  or  less  isolated  detachments,  and  to",
    "source": "",
    "scores": {
      "hybrid": "0.284",
      "vector": "-0.346",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.111"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "who relies solely on warlike measures shall be exterminated; he who relies\nsolely on peaceful measures shall perish. Instances of this are Fu Ch`ai on\nthe one hand and Yen Wang on the other. In military matters, the Sage's rule\nis normally to keep the peace, and to move his forces only when occasion\nrequires.  He will not use armed force unless driven to it by necessity.",
    "source": "",
    "scores": {
      "hybrid": "0.283",
      "vector": "-0.349",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.111"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n85 \n \nThe fundamental question with this approach is how the analysis \nobjectdistinguishes different kinds of glyphs without resorting to typetests or \ndowncasts. We don't want a SpellingChecker classto include (pseudo)code like \nvoid SpellingChecker::Check (Glyph* glyph) { \nCharacter* c; \nRow* r; \nImage* i; \n \nif (c = dynamic_cast<Character*>(glyph)) { \n // analyze the character \n} else if (r = dynamic_cast<Row*>(glyph)) {",
    "source": "",
    "scores": {
      "hybrid": "0.279",
      "vector": "-0.302",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "BorderDecorator(VisualComponent*, int borderWidth);",
    "source": "",
    "scores": {
      "hybrid": "0.279",
      "vector": "-0.302",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": ": a primer / Donella H. Meadows ; edited by Diana Wright. p. cm. Includes bibliographical references. eBook ISBN: 978-1-6035-8148-6 1. System analysis--Simulation methods 2. Decision making--Simulation methods 3. Critical thinking--Simulation methods 4. Sustainable development--Simulation methods. 5. Social sciences-Simulation methods. 6. Economic development--Environmental aspects--Simulation methods. 7. Population--Economic aspects--Simulation methods. 8. Pollution--Economic",
    "source": "",
    "scores": {
      "hybrid": "0.278",
      "vector": "-0.304",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n407 \n \n \nFigure B.2:  Object diagram notation \nInteraction Diagram \nAn interaction diagram shows the order in which requests between objectsget \nexecuted. Figure B.3 is aninteraction diagram that shows how a shape gets added \nto a drawing. \n \n \nFigure B.3:  Interaction diagram notation \nTime flows from top to bottom in an interaction diagram. A solidvertical line",
    "source": "",
    "scores": {
      "hybrid": "0.278",
      "vector": "-0.305",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
    ]
  },
  {
    "text": "to each subsystem level. If subsystems are dependent, then you can simplify \nthe dependencies between them by making them communicate with each other \nsolely through their facades.",
    "source": "",
    "scores": {
      "hybrid": "0.277",
      "vector": "-0.306",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "military",
      "strategy",
      "victory",
      "armed forces",
      "armed services",
      "military machine",
      "war machine",
      "force",
      "military science",
      "triumph"
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
    "text": "13. Comments should describe things that are not obvious from the\ncode (see p. 101 ).\n14. Software should be designed for ease of reading, not ease of\nwriting (see p. 149 ).",
    "source": "",
    "scores": {
      "hybrid": "0.490",
      "vector": "0.175",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "that it increases the cost of recovery considerably. This is not a problem in\nRAMCloud, since object corruption is quite rare. However, error promotion\nmay not make sense for errors that happen frequently. As one example, it\nwould not be practical to crash a server anytime one of its network packets\nis lost.\nOne  way  of  thinking about exception aggregation is  that  it  replaces\nseveral special-purpose mechanisms, each tailored for a particular situation,",
    "source": "",
    "scores": {
      "hybrid": "0.437",
      "vector": "0.093",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
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
    "text": "6. It’s more important for a module to have a simple interface than a\nsimple implementation (see pp. 55 , 71 ).\n7. General-purpose modules are deeper (see p. 39 ).\n8. Separate general-purpose and special-purpose code (see p. 62 ).\n9. Different layers should have different abstractions (see p. 45 ).\n10. Pull complexity downward (see p. 55 ).\n11. Define errors (and special cases) out of existence (see p. 79 ).\n12. Design it twice (see p. 91 ).",
    "source": "",
    "scores": {
      "hybrid": "0.432",
      "vector": "-0.020",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
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
    "text": "requirements aresatisfied, and consolidation as the software becomes more general. \n \nThis cycle is unavoidable. But good designers are aware of thechanges that can \nprompt refactorings. Good designers also know classand object structures that \ncan help avoid refactorings—their designsare robust in the face of requirement \nchanges. A thoroughrequirements analysis will highlight those requirements that",
    "source": "",
    "scores": {
      "hybrid": "0.431",
      "vector": "0.027",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "Science, itself a self-organizing system, likes to think that all the complexity of the world must arise, ultimately, from simple rules. Whether that actually happens is something that science does not yet know. Hierarchy So, naturalists observe, a flea Has smaller Fleas that on him prey; And these have smaller still to bite ‘em, And so proceed ad infinitum. —Jonathan Swift, 4 Jonathan Swift, 18th century poet In the process of creating new structures and increasing complexity, one thing that a",
    "source": "",
    "scores": {
      "hybrid": "0.425",
      "vector": "0.012",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
      "hybrid": "0.424",
      "vector": "0.009",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "have style guides that restrict program structure beyond the rules enforced",
    "source": "",
    "scores": {
      "hybrid": "0.411",
      "vector": "-0.022",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "and  good  design, and  both  companies built  sophisticated products that\nsolved complex problems with reliable software systems. The companies’\nstrong technical cultures became well known in Silicon Valley. Few other\ncompanies could compete with them for hiring the top technical talent.\nThese examples show that a company can succeed with either approach.\nHowever, it’s a lot more fun to work in a company that cares about software\ndesign and has a clean code base.\n3.5    Conclusion",
    "source": "",
    "scores": {
      "hybrid": "0.409",
      "vector": "-0.078",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
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
    "text": "can't be combined. You might envision aproxy-decorator that adds functionality \nto a proxy, or adecorator-proxy that embellishes a remote object. Although such \nhybridsmight be useful (we don't have real examples handy), they aredivisible \ninto patterns that are useful.",
    "source": "",
    "scores": {
      "hybrid": "0.405",
      "vector": "0.012",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
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
    "text": "which operations are executed, not on information hiding (see p. 32 ).\nOverexposure: An API forces callers to be aware of rarely used features in\norder to use commonly used features (see p. 36 ).\nPass-Through  Method: a  method does almost nothing  except pass its\narguments to another method with a similar signature (see p. 46 ).\nRepetition: a nontrivial piece of code is repeated over and over (see p. 62 ).\nSpecial-General Mixture: special-purpose code is  not cleanly separated",
    "source": "",
    "scores": {
      "hybrid": "0.405",
      "vector": "-0.038",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "Summary of Design Principles\nHere are the most important software design principles discussed in  this\nbook:\n1. Complexity is incremental: you have to sweat the small stuff (see\np. 11 ).\n2. Working code isn’t enough (see p. 14 ).\n3. Make continual small investments to improve system design (see\np. 15 ).\n4. Modules should be deep (see p. 22 )\n5. Interfaces should be designed to make the most common usage as\nsimple as possible (see p. 27 ).",
    "source": "",
    "scores": {
      "hybrid": "0.404",
      "vector": "-0.040",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n52 \nvoid Rectangle::Draw (Window* w) {   \n      w->DrawRect(_x0, _y0, _x1, _y1);     \n} \nwhere _x0, _y0, _x1, and _y1are data members of Rectangle that define two opposing \ncorners ofthe rectangle. DrawRect is the Window operation that makesthe rectangle \nappear on the screen. \nA parent glyph often needs to know how much space a child glyph occupies,for example,",
    "source": "",
    "scores": {
      "hybrid": "0.400",
      "vector": "0.001",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
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
    "text": "— SEVEN — Living in a World of Systems _____________ The real trouble with this world of ours is not that it is an unreasonable world, nor even that it is a reasonable one. The commonest kind of trouble is that it is nearly reasonable, but not quite. Life is not an illogicality; yet it is a trap for logicians. It looks just a little more mathematical and regular than it is. —G. K. Chesterton, 1 20th century writer People who are raised in the industrial world and who get enthused about systems",
    "source": "",
    "scores": {
      "hybrid": "0.400",
      "vector": "-0.001",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
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
    "text": "for FileInputStream , or through a method that disables or replaces the buffering\nmechanism), so that most developers do not even need to be aware of its\nexistence.\nIn contrast, the designers of the Unix system calls made the common\ncase  simple. For  example, they  recognized that  sequential I/O  is  most\ncommon, so  they  made that  the  default behavior.  Random access is  still\nrelatively easy to do, using the lseek system call, but a developer doing only",
    "source": "",
    "scores": {
      "hybrid": "0.398",
      "vector": "-0.005",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
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
    "text": "take these words quite literally of food and drink that have been poisoned by\nthe enemy.  Ch`en Hao and Chang Yu carefully point out that the saying has\na wider application.]\nDo not interfere with an army that is returning home.",
    "source": "",
    "scores": {
      "hybrid": "0.397",
      "vector": "-0.006",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
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
    "text": "that builds mazes randomly. Programs that build mazes take a MazeFactory as an \nargument so that the programmer can specify the classes of rooms, walls, and doors \nto construct.",
    "source": "",
    "scores": {
      "hybrid": "0.397",
      "vector": "-0.007",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n372 \n void VisitYourType(YourType*); \n}; \nMyType and YourType do not have to be related throughinheritance at all. \n5. Accumulating state.Visitors can accumulate state as they visit each element \nin the objectstructure. Without a visitor, this state would be passed as \nextraarguments to the operations that perform the traversal, or theymight \nappear as global variables. \n6. Breaking encapsulation.Visitor's approach assumes that the",
    "source": "",
    "scores": {
      "hybrid": "0.395",
      "vector": "-0.062",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n82 \nCreateIterator returns a NullIterator instance by default. ANullIterator is a \ndegenerate iterator for glyphs that have nochildren, that is, leaf glyphs. \nNullIterator's IsDone operationalways returns true. \nA glyph subclass that has children will override CreateIterator toreturn an \ninstance of a different Iterator subclass. Whichsubclass depends on the structure",
    "source": "",
    "scores": {
      "hybrid": "0.392",
      "vector": "-0.071",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "example, there's no reason we can't parameterize a class likePreorderIterator \nby the type of object in the structure.We'd use templates to do that in C++. Then \nwe can reuse the machineryin PreorderIterator to traverse other structures. \nIterator Pattern \nThe Iterator (289) pattern captures these techniquesfor supporting access and \ntraversal over object structures. It'sapplicable not only to composite structures",
    "source": "",
    "scores": {
      "hybrid": "0.392",
      "vector": "-0.071",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.100"
    },
    "matched_concepts": [],
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
    "text": "progress (and hence the  application) just  hangs until the  operation can\ncomplete successfully. If the hang lasts more than a short time, the NFS\nclient prints messages on the user’s console of the form “NFS server xyzzy\nnot responding still trying.”\nNFS users often complain about  the  fact  that  their applications  hang\nwhile waiting for an NFS server to resume normal operation. Many people\nhave suggested that NFS should abort operations with an exception rather",
    "source": "",
    "scores": {
      "hybrid": "0.391",
      "vector": "-0.022",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
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
    "text": "goal (the thermostat), and a response mechanism (the furnace and/or air conditioner, fans, pumps, pipes, fuel, etc.). A complex system usually has numerous balancing feedback loops it can bring into play, so it can self-correct under different conditions and impacts. Some of those loops may be inactive much of the time—like the emergency cooling system in a nuclear power plant, or your ability to sweat or shiver to maintain your body temperature—but their presence is critical to the long term",
    "source": "",
    "scores": {
      "hybrid": "0.493",
      "vector": "0.032",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "expensive diagnostic machines can lead to out-of-sight health care costs. Escalation in morality can lead to holier-than-thou sanctimoniousness. Escalation in art can lead from baroque to rococo to kitsch. Escalation in environmentally responsible lifestyles can lead to rigid and unnecessary puritanism. Escalation, being a reinforcing feedback loop, builds exponentially. Therefore, it can carry a competition to extremes faster than anyone would believe possible. If nothing is done to break the",
    "source": "",
    "scores": {
      "hybrid": "0.487",
      "vector": "0.117",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "the stock it influences. Try thinking about that yourself. The more you do, the more you’ll begin to see feedback loops everywhere. The most common “non-feedback” decisions students suggest are falling in love and committing suicide. I’ll leave it to you to decide whether you think these are actually decisions made with no feedback involved. Watch out! If you see feedback loops everywhere, you’re already in danger of becoming a systems thinker! Instead of seeing only how A causes B, you’ll",
    "source": "",
    "scores": {
      "hybrid": "0.477",
      "vector": "-0.007",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "life. Honor, Respect, and Distribute Information You’ve seen how information holds systems together and how delayed, biased, scattered, or missing information can make feedback loops malfunction. Decision makers can’t respond to information they don’t have, can’t respond accurately to information that is inaccurate, and can’t respond in a timely way to information that is late. I would guess that most of what goes wrong in systems goes wrong because of biased, late, or missing information. If I",
    "source": "",
    "scores": {
      "hybrid": "0.475",
      "vector": "-0.014",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "affect only future behavior; it can’t deliver a signal fast enough to correct behavior that drove the current feedback. • A stock-maintaining balancing feedback loop must have its goal set appropriately to compensate for draining or inflowing processes that affect that stock. Otherwise, the feedback process will fall short of or exceed the target for the stock. • Systems with similar feedback structures produce similar dynamic behaviors. Shifting Dominance, Delays, and Oscillations • Complex",
    "source": "",
    "scores": {
      "hybrid": "0.470",
      "vector": "-0.025",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "to  improve performance. Some  applications, such as  databases, need to\nknow exactly when data is written through to storage, so they can ensure\nthat data will be preserved after system crashes. Thus, the rules for flushing\ndata to secondary storage must be visible in the file system’s interface.\nWe  depend  on  abstractions to  manage complexity not  just  in\nprogramming, but  pervasively in  our  everyday lives. A  microwave oven",
    "source": "",
    "scores": {
      "hybrid": "0.460",
      "vector": "-0.051",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "Contents A Note from the Author A Note from the Editor Introduction: The Systems Lens Part One: System Structure and Behavior ONE. The Basics TWO. A Brief Visit to the Systems Zoo Part Two: Systems and Us THREE. Why Systems Work So Well FOUR. Why Systems Surprise Us FIVE. System Traps . . . and Opportunities Part Three: Creating Change— in Systems and in Our Philosophy SIX. Leverage Points—Places to Intervene in a System SEVEN. Living in a World of Systems Appendix System Definitions: A",
    "source": "",
    "scores": {
      "hybrid": "0.459",
      "vector": "0.048",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "in communication patterns that inheritance doesn't reveal. In general, the \nrun-time structures aren't clear from the code until you understand the patterns. \nDesigning for Change \nThe key to maximizing reuse lies in anticipating new requirements and changes \nto existing requirements, and in designing your systems so that they can evolve \naccordingly. \nTo design the system so that it's robust to such changes, you must consider how",
    "source": "",
    "scores": {
      "hybrid": "0.457",
      "vector": "0.042",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "It forces nations into reinforcing loops “racing to the bottom,” competing with each other to weaken environmental and social safeguards in order to attract corporate investment. It’s a recipe for unleashing “success to the successful” loops, until they generate enormous accumulations of power and huge centralized planning systems that will destroy themselves. 4. Self- Organization— The power to add, change, or evolve system structure The most stunning thing living systems and some social",
    "source": "",
    "scores": {
      "hybrid": "0.457",
      "vector": "-0.058",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "machines and factories. The more you make, the more capacity you have to make even more. This reinforcing feedback loop is the central engine of growth in an economy. Figure 14. Reinvestment in capital. By now you may be seeing how basic balancing and reinforcing feedback loops are to systems. Sometimes I challenge my students to try to think of any human decision that occurs without a feedback loop—that is, a decision that is made without regard to any information about the level of the stock",
    "source": "",
    "scores": {
      "hybrid": "0.456",
      "vector": "-0.061",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "You’ll be thinking not in terms of a static world, but a dynamic one. You’ll stop looking for who’s to blame; instead you’ll start asking, “What’s the system?” The concept of feedback opens up the idea that a system can cause its own behavior. So far, I have limited this discussion to one kind of feedback loop at a time. Of course, in real systems feedback loops rarely come singly. They are linked together, often in fantastically complex patterns. A single stock is likely to have several",
    "source": "",
    "scores": {
      "hybrid": "0.455",
      "vector": "-0.063",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "practical understanding of how these systems work, and how to work with them. Modern systems theory, bound up with computers and equations, hides the fact that it traffics in truths known at some level by everyone. It is often possible, therefore, to make a direct translation from systems jargon to traditional wisdom. Because of feedback delays within complex systems, by the time a problem becomes apparent it may be unnecessarily difficult to solve. — A stitch in time saves nine. According to",
    "source": "",
    "scores": {
      "hybrid": "0.454",
      "vector": "0.036",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "a set of decisions or rules or physical laws or actions that are dependent on the level of the stock, and back again through a flow to change the stock. • Balancing feedback loops are equilibrating or goal-seeking structures in systems and are both sources of stability and sources of resistance to change. • Reinforcing feedback loops are self-enhancing, leading to exponential growth or to runaway collapses over time. • The information delivered by a feedback loop—even nonphysical feedback—can",
    "source": "",
    "scores": {
      "hybrid": "0.452",
      "vector": "-0.071",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "limit to  what we can do with tools alone. If  we want to  make it  easier to\nwrite software, so that we can build more powerful systems more cheaply,",
    "source": "",
    "scores": {
      "hybrid": "0.448",
      "vector": "0.021",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "painful to work with. Over time the company realized that its culture was\nunsustainable. Eventually, Facebook changed its motto to “Move fast with\nsolid  infrastructure”  to  encourage its  engineers to  invest more  in  good\ndesign. It remains to be seen whether Facebook can successfully clean up\nthe problems that accumulated over years of tactical programming.\nIn  fairness  to  Facebook, I  should  point  out  that  Facebook’s  code",
    "source": "",
    "scores": {
      "hybrid": "0.447",
      "vector": "0.018",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "with each other. Picture a single-system stock—drug supply on the city streets, for example—with various actors trying to pull that stock in different directions. Addicts want to keep it high, enforcement agencies want to keep it low, pushers want to keep it right in the middle so prices don’t get either too high or too low. The average citizen really just wants to be safe from robberies by addicts trying to get money to buy drugs. All the actors work hard to achieve their different goals. If",
    "source": "",
    "scores": {
      "hybrid": "0.446",
      "vector": "0.015",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "programs are weak balancing loops that try to counter these strong reinforcing ones. It would be much more effective to weaken the reinforcing loops. That’s what progressive income tax, inheritance tax, and universal high-quality public education programs are meant to do. If the wealthy can influence government to weaken, rather than strengthen, those measures, then the government itself shifts from a balancing structure to one that reinforces success to the successful! Look for leverage points",
    "source": "",
    "scores": {
      "hybrid": "0.446",
      "vector": "-0.086",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "• There are always limits to resilience. • Systems need to be managed not only for productivity or stability, they also need to be managed for resilience. • Systems often have the property of self-organization—the ability to structure themselves, to create new structure, to learn, diversify, and complexify. • Hierarchical systems evolve from the bottom up. The purpose of the upper layers of the hierarchy is to serve the purposes of the lower layers. Source of System Surprises • Many",
    "source": "",
    "scores": {
      "hybrid": "0.445",
      "vector": "0.014",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.200"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "secrecy, • monitoring systems to report on environmental damage, • protection for whistleblowers, and • impact fees, pollution taxes, and performance bonds to recapture the externalized public costs of private benefits. 7. Reinforcing Feedback Loops— The strength of the gain of driving loops A balancing feedback loop is self-correcting; a reinforcing feedback loop is self-reinforcing. The more it works, the more it gains power to work some more, driving system behavior in one direction. The",
    "source": "",
    "scores": {
      "hybrid": "0.441",
      "vector": "-0.096",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
    ]
  },
  {
    "text": "vicious cycles and virtuous circles. Resilience: The ability of a system to recover from perturbation; the ability to restore or repair or bounce back after a change due to an outside force. Self-organization: The ability of a system to structure itself, to create new structure, to learn, or diversify. Shifting dominance: The change over time of the relative strengths of competing feedback loops. Stock: An accumulation of material or information that has built up in a system over time.",
    "source": "",
    "scores": {
      "hybrid": "0.440",
      "vector": "-0.100",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.400"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "feedback",
      "loops",
      "systems",
      "natural process",
      "loop",
      "program",
      "system",
      "plan of action"
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
    "source": "",
    "scores": {
      "hybrid": "0.451",
      "vector": "0.127",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n93 \nDesign Pattern Catalog",
    "source": "",
    "scores": {
      "hybrid": "0.447",
      "vector": "0.117",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n431 \n \nDesign pattern relationships",
    "source": "",
    "scores": {
      "hybrid": "0.414",
      "vector": "0.034",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "With more than 20 design patterns in the catalog to choose from, it might be hard \nto find the one that addresses a particular design problem, especially if the \ncatalog is new and unfamiliar to you. Here are several different approaches to \nfinding the design pattern that's right for your problem: \n1. Consider how design patterns solve design problems. Section 1.6 discusses \nhow design patterns help you find appropriate objects, determine object",
    "source": "",
    "scores": {
      "hybrid": "0.393",
      "vector": "-0.018",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "design process so that it improves the design of your software.",
    "source": "",
    "scores": {
      "hybrid": "0.387",
      "vector": "-0.032",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "A design pattern names, abstracts, and identifies the key aspects of a common \ndesign structure that make it useful for creating a reusable object-oriented design. \nThe design pattern identifies the participating classes and instances, their roles \nand collaborations, and the distribution of responsibilities. Each design pattern",
    "source": "",
    "scores": {
      "hybrid": "0.378",
      "vector": "-0.056",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n122 \n \nApplication subclasses redefine an abstract CreateDocument operation on \nApplication to return the appropriate Document subclass. Once an Application \nsubclass is instantiated, it can then instantiate application-specific Documents \nwithout knowing their class. We call CreateDocument a factory method because it's \nresponsible for \"manufacturing\" an object. \nApplicability \nUse the Factory Method pattern when",
    "source": "",
    "scores": {
      "hybrid": "0.377",
      "vector": "-0.057",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n389 \nComputer scientists name and catalog algorithms and data structures,but we don't \noften name other kinds of patterns. Design patternsprovide a common vocabulary \nfor designers to use to communicate, document,and explore design alternatives. \nDesign patterns make a system seemless complex by letting you talk about it at \na higher level ofabstraction than that of a design notation or programming",
    "source": "",
    "scores": {
      "hybrid": "0.371",
      "vector": "-0.073",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n39 \nOr maybe any change would require modifying lots of existing subclasses. \nDesign patterns offer ways to modify classes in such circumstances.  \nDesign patterns: Adapter (157), Decorator (196), Visitor (366). \nThese examples reflect the flexibility that design patterns can help you build \ninto your software. How crucial such flexibility is depends on the kind of software",
    "source": "",
    "scores": {
      "hybrid": "0.370",
      "vector": "-0.075",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n13 \n1. The pattern name is a handle we can use to describe a design problem, its \nsolutions, and consequences in a word or two. Naming a pattern immediately \nincreases our design vocabulary. It lets us design at a higher level of \nabstraction. Having a vocabulary for patterns lets us talk about them with \nour colleagues, in our documentation, and even to ourselves. It makes it",
    "source": "",
    "scores": {
      "hybrid": "0.367",
      "vector": "-0.082",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "objects (either simple or complex). Builder returns the product as a final step, \nbut as far as the Abstract Factory pattern is concerned, the product gets returned \nimmediately. \nA Composite (183) is what the builder often builds.",
    "source": "",
    "scores": {
      "hybrid": "0.366",
      "vector": "-0.085",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n132 \nRelated Patterns \nAbstract Factory (99) is often implemented with factory methods. The Motivation \nexample in the Abstract Factory pattern illustrates Factory Method as well. \nFactory methods are usually called within Template Methods (360). In the document \nexample above, NewDocument is a template method. \nPrototypes (133) don't require subclassing Creator. However, they often require",
    "source": "",
    "scores": {
      "hybrid": "0.364",
      "vector": "-0.089",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "What to Expect from Design Patterns \nHere are several ways in which the design patterns in this book canaffect the \nway you design object-oriented software, based on ourday-to-day experience with \nthem. \nA Common Design Vocabulary \nStudies of expert programmers for conventional languages haveshown that knowledge \nand experience isn't organized simply aroundsyntax but in larger conceptual \nstructures such as algorithms, datastructures and idioms [AS85, Cop92, Cur89,",
    "source": "",
    "scores": {
      "hybrid": "0.364",
      "vector": "-0.091",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "In general, a pattern has four essential elements:",
    "source": "",
    "scores": {
      "hybrid": "0.364",
      "vector": "-0.091",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n23 \nClearly there are many ways to organize design patterns. Having multiple ways \nof thinking about patterns will deepen your insight into what they do, how they \ncompare, and when to apply them. \n \n \nFigure 1.1:  Design pattern relationships \nHow Design Patterns Solve Design Problems \nDesign patterns solve many of the day-to-day problems object-oriented designers",
    "source": "",
    "scores": {
      "hybrid": "0.363",
      "vector": "-0.093",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n17 \nThe pattern's name conveys the essence of the pattern succinctly. A \ngood name is vital, because it will become part of your design vocabulary. \nThe pattern's classification reflects the scheme we introduce in Section \n1.5. \nIntent  \nA short statement that answers the following questions: What does the \ndesign pattern do? What is its rationale and intent? What particular design \nissue or problem does it address? \nAlso Known As",
    "source": "",
    "scores": {
      "hybrid": "0.361",
      "vector": "-0.098",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "For example, searching for strings that match a pattern is a commonproblem. Regular \nexpressions are a standard language for specifyingpatterns of strings. Rather \nthan building custom algorithms to matcheach pattern against strings, search \nalgorithms could interpret aregular expression that specifies a set of strings \nto match. \nThe Interpreter pattern describes how to define a grammar for simplelanguages, \nrepresent sentences in the language, and interpret thesesentences. In this example,",
    "source": "",
    "scores": {
      "hybrid": "0.358",
      "vector": "-0.177",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.143"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "without changing their class(es)",
    "source": "",
    "scores": {
      "hybrid": "0.357",
      "vector": "-0.109",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "force  a  problem into  a  design pattern when  a  custom approach will  be\ncleaner. Using design patterns doesn’t automatically improve a software\nsystem; it only does so if the design patterns fit. As with many ideas in\nsoftware design, the notion that design patterns are good doesn’t necessarily\nmean that more design patterns are better.\n19.6  Getters and setters\nIn  the  Java  programming community, getter and setter methods are  a",
    "source": "",
    "scores": {
      "hybrid": "0.354",
      "vector": "-0.114",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
    ]
  },
  {
    "text": "Other well-known names for the pattern, if any. \nMotivation  \nA scenario that illustrates a design problem and how the class and object \nstructures in the pattern solve the problem. The scenario will help you \nunderstand the more abstract description of the pattern that follows. \nApplicability  \nWhat are the situations in which the design pattern can be applied? \nWhat are examples of poor designs that the pattern can address? How can \nyou recognize these situations? \nStructure",
    "source": "",
    "scores": {
      "hybrid": "0.354",
      "vector": "-0.114",
      "bm25": "1.000",
      "title": "0.000",
      "wordnet": "0.000"
    },
    "matched_concepts": [],
    "expanded_terms": [
      "design",
      "pattern",
      "factory",
      "plan",
      "create by mental act",
      "match",
      "mill",
      "manufacturing plant",
      "manufactory",
      "plant"
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
  "total_concepts": 83,
  "primary_concepts": [
    "military strategy",
    "deception tactics warfare",
    "logistics and supply warfare",
    "command and control military",
    "intelligence operations",
    "terrain analysis military",
    "timing and tempo",
    "morale and moral law",
    "economy of force",
    "unity of command"
  ],
  "related_concepts": [],
  "categories": [
    "military strategy",
    "defense studies",
    "intelligence studies",
    "operations research",
    "organizational leadership"
  ],
  "summary": "This introduction to Sun Tzu's \"The Art of War\" provides a biographical account from Ssu-ma Ch'ien, including the legendary anecdote of Sun Tzu drilling the King of Wu's concubines to demonstrate military discipline, highlights his historical military successes against rival states, references his descendant Sun Pin, and begins the treatise with the first chapter on \"Laying Plans,\" emphasizing war's vital strategic importance to the state.\n\nKey Concepts: military strategy, deception tactics warfare, logistics and supply warfare, command and control military, intelligence operations, terrain analysis military, timing and tempo, morale and moral law, economy of force, unity of command, discipline and training, maneuver warfare, indirect tactics warfare, direct tactics warfare, planning and foreknowledge, laying plans framework, five factors strategic, seven considerations assessment, tactical dispositions framework, energy and momentum, weakness exploitation, formation and signals, combined arms coordination, surprise and ambush tactics, foraging and requisition, economics of war, signal intelligence reconnaissance, use of spies intelligence, types of spies intelligence, converted agents intelligence, doomed agents espionage, surviving scouts intelligence, fortifications and sieges, attack by stratagem framework, attack by fire tactics, signals and drums communications, reward and punishment system, civil military relations, commander virtues framework, measurement estimation calculation framework, unity of spirit, force concentration principle, divide and defeat tactic, feigned disorder tactic, baiting operations, ambush and rear attack, concentration and dispersion maneuvers, night operations doctrine, river crossing operations, mountain and pass operations, camp placement doctrine, psychological operations warfare, alliances and diplomacy warfare, use of conquered personnel, control of information, punitive execution principle, forgery and false signaling, supply line protection, mobility and forced marches, attrition avoidance principle, phasing and adaptation, risk and opportunity calculation, combined energy application, readiness and rehearsal, psychological moment timing, terrain denial operations, troop welfare management, bait sacrifice technique, camp security and counterintelligence, battlefield economy management, operational concealment techniques, strategic patience, countering hubris principle, psychophysical indicators reconnaissance, force recycling with captured materiel, leadership restraint doctrine, camp hygiene and health policy, contingency modification practice, tenacity induction tactic, integrated deception architecture, operational secrecy management, readiness thresholds doctrine, unit subdivision and delegation\nCategories: military strategy, defense studies, intelligence studies, operations research, organizational leadership",
  "_note": "Showing 10 of 83 concepts"
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
  "total_concepts": 96,
  "primary_concepts": [
    "software complexity",
    "modular design",
    "information hiding",
    "abstraction",
    "deep module",
    "shallow module",
    "dependencies",
    "obscurity",
    "change amplification",
    "cognitive load"
  ],
  "related_concepts": [],
  "categories": [
    "software architecture",
    "software engineering",
    "systems design",
    "programming languages",
    "human factors in computing"
  ],
  "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through deep modules, information hiding, strategic decomposition, and practical techniques to create maintainable, high-quality code, drawn from the author's Stanford course and decades of experience.\n\nKey Concepts: software complexity, modular design, information hiding, abstraction, deep module, shallow module, dependencies, obscurity, change amplification, cognitive load, unknown unknowns, incremental complexity, tactical programming, strategic programming, investment mindset, design it twice, interface, interface documentation, implementation comment, comments first practice, comment maintenance, red flags, information leakage, temporal decomposition, pass-through method, pass-through variable, context object, decorator pattern, dispatcher pattern, abstraction depth, general-purpose module, special-purpose module, separate general and special principle, pull complexity downward, defaults principle, configuration parameter critique, define errors out of existence, exception handling complexity, exception masking, exception aggregation, promote errors to fatal recovery, crash on irrecoverable conditions, undo history pattern, separation of concerns, classitis, pass-through layers critique, interface versus implementation separation, method splitting and joining, conjoined methods, repetition red flag, comments that repeat code, interface contamination warning, cross-module design decisions, designNotes file, choosing names principle, name precision rule, naming consistency, short-name debate, comments for precision, comments for intuition, code obviousness, readability over writability, white space and formatting, event-driven opacity, generic container avoidance, consistency enforcement, when in rome rule, unit testing for refactoring, test-driven development critique, code review practice, commit log versus code comments, avoiding comment duplication, cross-module references, performance-aware design, measure before modifying, critical path optimization, ramcloud buffer optimization, microbenchmark practice, data structure abstraction, pull special cases into normal flow, global state management, masking versus exposing trade-off, formal versus informal interface, invariants documentation, defaults as partial hiding, error promotion, narrow focused APIs, encapsulation over exposure, tooling for consistency, knowledge ownership, documentation as design canary, when to split classes, when to merge classes, cache and buffer design, design patterns pragmatic use, software trends critique\nCategories: software architecture, software engineering, systems design, programming languages, human factors in computing",
  "_note": "Showing 10 of 96 concepts"
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
  "total_concepts": 195,
  "primary_concepts": [
    "systems thinking lens",
    "system",
    "stock-and-flow structure",
    "stock",
    "flow",
    "feedback loop",
    "balancing feedback loop",
    "reinforcing feedback loop",
    "dynamic equilibrium",
    "delay"
  ],
  "related_concepts": [],
  "categories": [
    "systems thinking",
    "systems engineering",
    "environmental science",
    "public policy",
    "organizational management",
    "ecology",
    "sustainability science"
  ],
  "summary": "Thinking in Systems is a posthumously edited primer by Donella H. Meadows that introduces foundational concepts of systems thinking, including system structures, behaviors, surprises, traps, leverage points for intervention, and practical guidelines for applying these ideas to complex real-world challenges like sustainability and decision-making.\n\nKey Concepts: systems thinking lens, system, stock-and-flow structure, stock, flow, feedback loop, balancing feedback loop, reinforcing feedback loop, dynamic equilibrium, delay, buffer, behavior over time graph, stock as system memory, shifting dominance, nonlinearity, threshold effect, exponential growth, doubling time rule, overshoot and collapse, carrying capacity, limits-to-growth archetype, renewable resource dynamics, nonrenewable resource depletion, resource yield per unit capital, policy resistance, tragedy of the commons archetype, eroding goals archetype, escalation archetype, success-to-the-successful archetype, shifting the burden archetype, rule beating archetype, seeking the wrong goal archetype, archetype analysis, leverage point, parameters and numbers leverage, buffers leverage, stock-and-flow redesign leverage, delay management leverage, balancing feedback strengthening, reinforcing loop modulation, information flow design, rules and incentives design, self-organization leverage, goal alignment leverage, paradigm shift leverage, transcending paradigms leverage, model building practice, scenario analysis, boundary selection, mental model elicitation, information transparency, intrinsic responsibility, evaluation and learning policy, resilience assessment, self-repair and self-maintenance, hierarchy and nested systems, decomposition and modularity, time horizon expansion, boundary of caring, metrics design, behavior pattern cataloging, bathtub model, thermostat model, inventory oscillation model, population-capital coupling model, doubling phenomenon illustration, perception smoothing, response smoothing, delivery and production delays, information distortions, bounded rationality, mental model transparency, participatory systems design, adaptive management, meta-resilience, co-evolution, information disclosure policy, goal specification, goal harmonization, paradigm critique, transparency and accountability, systems literacy education, ethics of stewardship, holistic policy design, system traps identification, sustainable development, systems thinking, global modeling, sustainability practice, cultural change, commons stewardship, environmental education, citizen empowerment, complexity, planetary limits, resilience thinking, stewardship ethics, global citizenry, environmental publishing, systems dynamics, organizational learning, interdisciplinary research, long-term forecasting, scenario planning, public engagement, conservation science, environmental communication, sustainability indicators, ecosystem services, ecological economics, limits to growth model, policy levers, feedback loop analysis, leverage point identification, stock and flow modeling, model validation, scenario communication, participatory modeling, transdisciplinary collaboration, organizational change management, environmental policy analysis, citizen science, education for sustainability, complex systems modeling, systems mapping, environmental journalism, stewardship governance, sustainable finance, slow money investing, food systems resilience, toxic chemistry literacy, gaia hypothesis, holocene perspective, environmental pedagogy, sustainability indicators development, carrying capacity analysis, overshoot and collapse dynamics, nonlinear dynamics, tipping points, renewable energy transition, climate mitigation strategies, resource depletion modeling, pollution accumulation analysis, biodiversity loss assessment, soil fertility management, local investment strategies, community-supported agriculture, permaculture design, life cycle assessment, chemical risk communication, environmental ethics frameworks, citizen's guide formats, public-facing forewords, catalog distribution strategies, book-based advocacy, ecosystem restoration practices, environmental monitoring indicators, sustainability metrics standardization, intergenerational equity, environmental advocacy networks, systems literacy, policy scenario analysis, sustainable agriculture transitions, environmental stewardship campaigns, publication cataloging, science-into-policy translation, environmental recognition mechanisms, publication foreword strategy, systems-based curriculum design, behavioral change communication, integrated assessment modeling, publishing as activism, environmental authorship networks, eco-literacy outreach, global society analysis, sustainability-focused book curation, citizen column communication, environmental stewardship education, public catalog request systems, sustainable living politics, environmental foreword framing, systems-based policy advice, publication outreach channels, sustainability narrative framing, ecosocial systems analysis, environmental stewardship networks, sustainability outreach materials, climate solutions guidance, environmental literacy assessment, integrated curriculum materials, stewardship-oriented publishing strategy, sustainability-focused editorial curation, citizen empowerment literature, systems education programs, holistic sustainability frameworks\nCategories: systems thinking, systems engineering, environmental science, public policy, organizational management, ecology, sustainability science",
  "_note": "Showing 10 of 195 concepts"
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
  "total_concepts": 189,
  "primary_concepts": [
    "design patterns",
    "pattern template",
    "intent section",
    "motivation section",
    "applicability section",
    "structure notation",
    "participants concept",
    "collaborations concept",
    "consequences section",
    "implementation notes"
  ],
  "related_concepts": [],
  "categories": [
    "software architecture",
    "object-oriented design",
    "design patterns",
    "human-computer interaction",
    "systems engineering",
    "object-oriented programming",
    "programming languages"
  ],
  "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides a comprehensive guide to reusable design patterns in object-oriented programming, featuring an introduction to patterns, a case study on designing a document editor, a catalog of creational, structural, and behavioral patterns, discussions on their application, and supplementary resources like a glossary, notation guide, and foundation classes, along with a preface highlighting the benefits of its CD-ROM hypertext edition.\n\nKey Concepts: design patterns, pattern template, intent section, motivation section, applicability section, structure notation, participants concept, collaborations concept, consequences section, implementation notes, sample code, known uses, related patterns, catalog organization, pattern classification by purpose, pattern classification by scope, program to an interface principle, favor object composition principle, delegation concept, inheritance versus composition tradeoff, encapsulation concept, polymorphism concept, static versus dynamic structures distinction, creational patterns category, structural patterns category, behavioral patterns category, abstract factory pattern, factory method pattern, builder pattern, prototype pattern, singleton pattern, adapter pattern, bridge pattern, composite pattern, decorator pattern, facade pattern, flyweight pattern, proxy pattern, chain of responsibility pattern, command pattern, interpreter pattern, iterator pattern, mediator pattern, memento pattern, observer pattern, state pattern, strategy pattern, template method pattern, visitor pattern, model view controller pattern, glyph concept, composition class, compositor concept, transparent enclosure, monoglyph concept, discretionary glyph, spelling checking visitor, hyphenation visitor, iterator traversal separation, preorder iterator, createiterator hook, null iterator, command history structure, reversible command concept, memento privileged interface, facade versus mediator distinction, adapter versus bridge distinction, two-way adapter, pluggable adapter, handle body idiom, prototype manager, clone versus deep copy issue, lazy initialization, registry of singletons, class versus object scope, interface inheritance concept, implementation inheritance concept, mixin class concept, parameterized types and templates, white box versus black box reuse, run-time structure visibility, caching in composite structures, parent reference invariant, who deletes components policy, child management interface decision, iteration concurrency support, decorator identity caveat, strategy as alternative to decorator, framework concept, toolkit concept, application design concerns, causes of redesign taxonomy, how to select a pattern, how to apply a pattern, lexi case study, document structure abstraction, formatting encapsulation, supporting multiple look and feel, supporting multiple window systems, transparent embellishment of ui, user operations encapsulation, analysis separation pattern, visitor applicability principle, notation conventions, foundation classes, pattern community, trade off assessment technique, pattern selection heuristics, document traversal indexing issue, component sharing consequences, run time configuration via factories, decorator composition ordering, undo redone semantics, structural patterns, behavioral patterns, creational patterns, glyph flyweight, glyphcontext mapping, b-tree font mapping, flyweight factory, intrinsic versus extrinsic state, virtual proxy, protection proxy, remote proxy, smart reference proxy, operator arrow overloading, doesnotunderstand hook, copy-on-write optimization, character glyph, glyph factory, external iterator, internal iterator, polymorphic iterator, iterator proxy for cleanup, robust iterator, cursor iterator, dialog director, colleague objects, change manager, subject interface, observer interface, push versus pull notification, handler successor chain, request object representation, macro command, simple command template, undo and redo via command history, command as transaction log, originator and caretaker roles, narrow and wide memento interfaces, incremental mementos, abstract syntax tree, terminal and nonterminal expressions, double dispatch, element accept traversal, adapter versus bridge, encapsulation boundaries, separation of concerns, refactoring and consolidation, black-box reuse, white-box reuse, encapsulating variation, polymorphism, dynamic binding, friend access in c++, operator overloading for iterators, resource acquisition is initialization, doesnotunderstand based proxy, smart pointers and reference counting, function objects and functors, c++ templates for behavior parameterization, hook operations, stack versus heap allocation tradeoffs, shared state via flyweight, who controls traversal, who defines traversal algorithm, representing requests as objects, automatic forwarding performance concerns, iterator robustness strategies, aspects and selective observer registration, encapsulating complex update semantics, separation of interface and implementation, look and feel abstraction, layout objects as strategies, macro and composite commands ordering, avoidance of spurious updates, encoding requests for remote access, mixin classes for role composition, delegation as an implementation mechanism\nCategories: software architecture, object-oriented design, design patterns, human-computer interaction, systems engineering, object-oriented programming, programming languages",
  "_note": "Showing 10 of 189 concepts"
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
    "totalDocuments": 24,
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
      "id": 3405947310,
      "name": "systems engineering",
      "description": "Concepts and practices related to systems engineering",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "systems engineering"
      ],
      "statistics": {
        "documents": 2,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 178677026,
      "name": "defense studies",
      "description": "Concepts and practices related to defense studies",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "defense studies"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 864800086,
      "name": "design patterns",
      "description": "Concepts and practices related to design patterns",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "design patterns"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3070868771,
      "name": "ecology",
      "description": "Concepts and practices related to ecology",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "ecology"
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
      "id": 1566066723,
      "name": "human factors in computing",
      "description": "Concepts and practices related to human factors in computing",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "human factors in computing"
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
      "preview": "This introduction to Sun Tzu's \"The Art of War\" provides a biographical account from Ssu-ma Ch'ien, including the legendary anecdote of Sun Tzu drilling the King of Wu's concubines to demonstrate mili...",
      "primaryConcepts": []
    }
  ],
  "includeChildren": false,
  "categoriesSearched": [
    "military strategy"
  ]
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
    "totalConcepts": 0,
    "documentsReturned": 2
  },
  "documents": [
    {
      "title": "",
      "preview": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through deep modules, information hiding, strategic decomposition, and practical techniques to create...",
      "primaryConcepts": []
    },
    {
      "title": "",
      "preview": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides a comprehensive guide to reusable design patterns in object-oriented programming, featuring an introduction to pat...",
      "primaryConcepts": []
    }
  ],
  "includeChildren": false,
  "categoriesSearched": [
    "software architecture"
  ]
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
      "preview": "Thinking in Systems is a posthumously edited primer by Donella H. Meadows that introduces foundational concepts of systems thinking, including system structures, behaviors, surprises, traps, leverage ...",
      "primaryConcepts": []
    }
  ],
  "includeChildren": false,
  "categoriesSearched": [
    "systems thinking"
  ]
}
```

### Test 6.4: design patterns

**Input:**
```json
{
  "category": "design patterns"
}
```

**Status:** ✅ PASS

**Output:**
```json
{
  "category": {
    "id": 864800086,
    "name": "design patterns",
    "description": "Concepts and practices related to design patterns",
    "hierarchy": [
      "design patterns"
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
      "preview": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides a comprehensive guide to reusable design patterns in object-oriented programming, featuring an introduction to pat...",
      "primaryConcepts": []
    }
  ],
  "includeChildren": false,
  "categoriesSearched": [
    "design patterns"
  ]
}
```

---

## Summary

| Metric | Value |
|--------|-------|
| Total Tests | 21 |
| Passed | 21 |
| Failed | 0 |
| Success Rate | 100.0% |
