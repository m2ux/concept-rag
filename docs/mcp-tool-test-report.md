# MCP Tool Test Report - Detailed Output

**Generated:** 2025-11-28T17:03:20.484Z
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
  "summary": "Systematic planning and conduct of armed conflict to achieve political objectives and national security. In this document it frames overarching principles—deception, timing, logistics, terrain exploitation and unified command—guiding decisions that minimize cost and maximize strategic advantage in war.",
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
  "summary": "The structural properties of code that make a system hard to understand and modify. In this book it denotes the accumulation of dependencies and obscurities that cause change amplification, cognitive load, and unknown unknowns, guiding design choices to minimize long-term cost.",
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
  "summary": "A closed chain of cause-and-effect whereby changes in a stock influence flows that in turn change that same stock. The text distinguishes feedback as the fundamental mechanism by which systems self-regulate, amplify, or produce unexpected outcomes.",
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
        "reinforcing feedback loop",
        "reinforcing feedback"
      ]
    },
    {
      "text": "you’ll find that you can understand this graphical language easily. I start with the basics: the definition of a system and a dissection of its parts (in a reductionist, unholistic way). Then I put the parts back together to show how they interconnect to make the basic operating unit of a system: the feedback loop. Next I will introduce you to a systems zoo—a collection of some common and interesting types of systems. You’ll see how a few of these creatures behave and why and where they can be",
      "title": "Thinking in Systems",
      "page": 1,
      "concept_density": "0.000",
      "concepts": [
        "system",
        "feedback loop",
        "interconnectedness"
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
  "summary": "A structural pattern that attaches additional responsibilities to objects dynamically by wrapping them with decorator objects conforming to the same interface. The book demonstrates decorators for UI embellishments like borders and scrollbars, avoiding subclass proliferation and enabling run-time composition.",
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
        "adapter pattern",
        "bridge pattern",
        "composite pattern",
        "decorator pattern",
        "design pattern",
        "object oriented design"
      ]
    },
    {
      "text": "problems. Somepeople read the catalog through first and then use aproblem-directed \napproach to apply the patterns to their projects. \nIf you aren't an experienced object-oriented designer, then start withthe simplest \nand most common patterns: \n• Abstract Factory (page 99) \n• Adapter (157) \n• Composite (183) \n• Decorator (196) \n• Factory Method (121) \n• Observer (326) \n• Strategy (349) \n• Template Method (360) \nIt's hard to find an object-oriented system that doesn't use at leasta couple",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 10,
      "concept_density": "0.000",
      "concepts": [
        "abstract factory pattern",
        "factory method pattern",
        "adapter pattern",
        "composite pattern",
        "decorator pattern",
        "observer pattern",
        "strategy pattern",
        "template method pattern",
        "border decorator",
        "scroller decorator"
      ]
    },
    {
      "text": "to replace the algorithm either statically or dynamically, when you have a lot \nof variants of the algorithm, or when the algorithm has complex data structures \nthat you want to encapsulate. \nMVC uses other design patterns, such as Factory Method (121) to specify the default \ncontroller class for a view and Decorator (196) to add scrolling to a view. But \nthe main relationships in MVC are given by the Observer, Composite, and Strategy \ndesign patterns. \nDescribing Design Patterns",
      "title": "Design Patterns Elements of Reusable Object-Oriented",
      "page": 16,
      "concept_density": "0.000",
      "concepts": [
        "factory method pattern",
        "composite pattern",
        "decorator pattern",
        "observer pattern",
        "strategy pattern",
        "border decorator",
        "scroller decorator",
        "design pattern",
        "reuse strategy"
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
      "hybrid": "0.132",
      "vector": "-0.906",
      "bm25": "0.511",
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
      "hybrid": "-0.020",
      "vector": "-0.901",
      "bm25": "0.000",
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
      "hybrid": "-0.264",
      "vector": "-0.879",
      "bm25": "0.000",
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
      "hybrid": "-0.269",
      "vector": "-0.896",
      "bm25": "0.000",
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
      "hybrid": "0.189",
      "vector": "-0.572",
      "bm25": "0.369",
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
    "source": "sample-docs/Programming/_Design Patterns_ Elements of Reusable Object-Oriented -- Gamma, Erich;Helm, Richard;Johnson, Ralph E_;Vlissides, John -- Uttar Pradesh, India, 2016 -- 9780201633610 -- 2121300da35565356b45a1b90df80e9d -- Anna’s Archive.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "-0.160",
      "vector": "-0.534",
      "bm25": "0.000",
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
    "source": "sample-docs/Philosophy/Sun Tzu - Art Of War.pdf",
    "text_preview": "...",
    "scores": {
      "hybrid": "-0.171",
      "vector": "-0.570",
      "bm25": "0.000",
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
      "hybrid": "-0.176",
      "vector": "-0.588",
      "bm25": "0.000",
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
      "hybrid": "0.213",
      "vector": "-0.598",
      "bm25": "0.475",
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
      "hybrid": "-0.222",
      "vector": "-0.739",
      "bm25": "0.000",
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
      "hybrid": "-0.244",
      "vector": "-0.812",
      "bm25": "0.000",
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
      "hybrid": "-0.245",
      "vector": "-0.816",
      "bm25": "0.000",
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
      "hybrid": "0.199",
      "vector": "-0.629",
      "bm25": "0.458",
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
      "hybrid": "-0.206",
      "vector": "-0.688",
      "bm25": "0.000",
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
      "hybrid": "-0.212",
      "vector": "-0.706",
      "bm25": "0.000",
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
      "hybrid": "-0.216",
      "vector": "-0.720",
      "bm25": "0.000",
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
    "text": "o maintains a reference to a Strategy object. \no may define an interface that lets Strategy access its data. \nCollaborations \n• Strategy and Context interact to implement the chosen algorithm. Acontext \nmay pass all data required by the algorithm to the strategywhen the algorithm \nis called. Alternatively, the context can passitself as an argument to \nStrategy operations. That lets the strategycall back on the context as \nrequired.",
    "source": "",
    "scores": {
      "hybrid": "0.118",
      "vector": "-0.154",
      "bm25": "0.450",
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
      "hybrid": "0.110",
      "vector": "-0.163",
      "bm25": "0.438",
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
      "hybrid": "0.105",
      "vector": "-0.161",
      "bm25": "0.424",
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
      "hybrid": "0.099",
      "vector": "-0.166",
      "bm25": "0.413",
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
      "hybrid": "0.086",
      "vector": "-0.201",
      "bm25": "0.415",
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
      "hybrid": "0.069",
      "vector": "-0.281",
      "bm25": "0.454",
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
    "text": "void Composition::Repair () { \n switch (_breakingStrategy) { \n case SimpleStrategy: \n  ComposeWithSimpleCompositor(); \n  break; \n case TeXStrategy: \n  ComposeWithTeXCompositor(); \n  break; \n  // ... \n } \n // merge results with existing composition, if necessary     \n} \nThe Strategy pattern eliminates this case statement by delegating \nthelinebreaking task to a Strategy object: \nvoid Composition::Repair () { \n  _compositor->Compose(); \n  // merge results with existing composition, if necessary",
    "source": "",
    "scores": {
      "hybrid": "0.047",
      "vector": "-0.299",
      "bm25": "0.416",
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
    "text": "chapter.  But he proceeds to give a biography of his descendant,  Sun Pin,\nborn about a hundred years after his famous ancestor's death, and also the\noutstanding military genius of his time.  The historian speaks of him too as\nSun Tzu, and in his preface we read:  \"Sun Tzu had his feet cut off and yet\ncontinued to discuss the art of war.\" It seems likely, then, that  \"Pin\" was a\nnickname  bestowed  on  him  after  his  mutilation,  unless  the  story  was",
    "source": "",
    "scores": {
      "hybrid": "0.039",
      "vector": "-0.161",
      "bm25": "0.258",
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
    "text": "interfaces must give a ConcreteStrategyefficient access to any data it needs \nfrom a context, and vice versa. \nOne approach is to have Context pass data in parameters to \nStrategyoperations—in other words, take the data to the strategy. This \nkeepsStrategy and Context decoupled. On the other hand, Context mightpass \ndata the Strategy doesn't need. \nAnother technique has a context pass itself as an argument, andthe strategy",
    "source": "",
    "scores": {
      "hybrid": "0.037",
      "vector": "-0.339",
      "bm25": "0.432",
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
    "text": "uses itnormally. If there isn't a strategy, then Context carries out \ndefaultbehavior. The benefit of this approach is that clients don't have \ntodeal with Strategy objects at all unless they don't like thedefault \nbehavior.",
    "source": "",
    "scores": {
      "hybrid": "0.030",
      "vector": "-0.325",
      "bm25": "0.400",
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
    "text": "victory will not stand in doubt;  if you know Heaven and know Earth, you\nmay make your victory complete.\n     [Li Ch`uan sums up as follows:  \"Given a knowledge of three things--the\naffairs of men, the seasons of heaven and the natural advantages of earth--,\nvictory will invariably crown   your battles.\"]",
    "source": "",
    "scores": {
      "hybrid": "0.016",
      "vector": "-0.384",
      "bm25": "0.423",
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
    "text": "extend. \n3. Strategies eliminate conditional statements.The Strategy pattern offers \nan alternative to conditional statements forselecting desired behavior. \nWhen different behaviors are lumped into oneclass, it's hard to avoid using \nconditional statements to select theright behavior. Encapsulating the \nbehavior in separate Strategy classeseliminates these conditional \nstatements. \nFor example, without strategies, the code for breakingtext into lines could \nlook like",
    "source": "",
    "scores": {
      "hybrid": "0.009",
      "vector": "-0.348",
      "bm25": "0.370",
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
    "text": "[Ho Shih thus expounds the paradox:  \"In warfare, first lay plans which\nwill ensure victory, and then lead your army to battle;  if you will not begin\nwith stratagem but rely on brute strength alone, victory will no longer be\nassured.\"]\n     16.  The consummate leader cultivates the moral law,  and strictly adheres\nto method and discipline; thus it is in his power to control success.\n     17.  In respect of military method,  we have,  firstly, Measurement;",
    "source": "",
    "scores": {
      "hybrid": "0.008",
      "vector": "-0.357",
      "bm25": "0.322",
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
    "text": "or extend the component's functionality by replacing the strategy object. \nFor example, we can support different border styles by having the component \ndefer border-drawing to a separate Border object. The Border object is a \nStrategy object that encapsulates a border-drawing strategy. By extending \nthe number of strategies from just one to an open-ended list, we achieve \nthe same effect as nesting decorators recursively. \nIn MacApp 3.0 [App89] and Bedrock [Sym93a], for example, graphical",
    "source": "",
    "scores": {
      "hybrid": "0.001",
      "vector": "-0.325",
      "bm25": "0.271",
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
    "text": "is the negation of civil order!\"  The unpalatable fact remains, however, that\neven Imperial wishes must be subordinated to military necessity.]",
    "source": "",
    "scores": {
      "hybrid": "-0.009",
      "vector": "-0.375",
      "bm25": "0.352",
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
    "text": "Factory Methods (121) are often called by template methods. In the Motivation \nexample,the factory method DoCreateDocument is called by the template \nmethodOpenDocument. \nStrategy (349): Template methods use inheritance to vary part of an \nalgorithm.Strategies use delegation to vary the entire algorithm.",
    "source": "",
    "scores": {
      "hybrid": "-0.011",
      "vector": "-0.338",
      "bm25": "0.311",
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
    "text": "Compositor's interface is carefully designed to support alllayout algorithms that \nsubclasses might implement. You don't want tohave to change this interface with \nevery new subclass, because that willrequire changing existing subclasses. In \ngeneral, the Strategy andContext interfaces determine how well the pattern \nachieves its intent.",
    "source": "",
    "scores": {
      "hybrid": "-0.017",
      "vector": "-0.346",
      "bm25": "0.304",
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
    "text": "22. Carefully study the well-being of your men,\n     [For  \"well-being\", Wang Hsi means, \"Pet them,  humor them, give them\nplenty of food and drink,  and look after them generally.\"]\nand do not overtax them.  Concentrate your energy and hoard your strength.\n          [Ch`en  recalls  the  line  of  action  adopted  in  224  B.C.  by  the  famous\ngeneral  Wang  Chien,    whose  military  genius      largely  contributed  to  the",
    "source": "",
    "scores": {
      "hybrid": "-0.025",
      "vector": "-0.341",
      "bm25": "0.279",
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
    "text": "men  in  taking  a  town  when  the  same  expenditure  of  soldiers  will  gain  a\nprovince.\"]\npositions which must not be contested, commands of the sovereign which\nmust not be obeyed.\n     [This is a hard saying for the Chinese, with their reverence for authority,\nand Wei Liao Tzu (quoted by Tu Mu) is moved to exclaim:    \"Weapons   are\nbaleful   instruments,   strife   is antagonistic to virtue, a military commander",
    "source": "",
    "scores": {
      "hybrid": "-0.031",
      "vector": "-0.355",
      "bm25": "0.277",
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
    "text": "which it flows; the soldier works out his victory in relation to the foe whom\nhe is facing.\n     32.  Therefore, just as water retains no constant shape,  so in warfare there\nare no constant conditions.\n     33.  He who can modify his tactics in relation to his opponent and thereby\nsucceed in winning, may be called a heaven-born captain.\n     34.  The five elements (water, fire, wood, metal, earth) are not always\nequally predominant;",
    "source": "",
    "scores": {
      "hybrid": "-0.037",
      "vector": "-0.362",
      "bm25": "0.270",
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
    "text": "independent of each other, so that a programmer can work on one module\nwithout having to understand the details of other modules.\nBecause software is  so malleable, software design is  a  continuous\nprocess that spans the entire lifecycle of  a  software system; this makes\nsoftware design different from the design of physical systems such as\nbuildings, ships, or bridges. However, software design has not always been\nviewed this way.  For much of  the history of  programming, design was",
    "source": "",
    "scores": {
      "hybrid": "0.178",
      "vector": "-0.044",
      "bm25": "0.438",
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
    "text": "13. Comments should describe things that are not obvious from the\ncode (see p. 101 ).\n14. Software should be designed for ease of reading, not ease of\nwriting (see p. 149 ).",
    "source": "",
    "scores": {
      "hybrid": "0.162",
      "vector": "0.099",
      "bm25": "0.257",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n395 \nSoftware Architecture programsponsored by the U.S. Department of Defense [GM92] \nconcentrates on gathering architectural information. Theknowledge-based software \nengineering community tries to representsoftware-related knowledge in general. \nThere are many other groupswith goals at least a little like ours. \nJames Coplien's Advanced C++: Programming Styles andIdioms [Cop92] has influenced",
    "source": "",
    "scores": {
      "hybrid": "0.151",
      "vector": "-0.013",
      "bm25": "0.391",
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
    "text": "With this background, let’s  discuss in more detail what causes\ncomplexity, and how to make software systems simpler.",
    "source": "",
    "scores": {
      "hybrid": "0.148",
      "vector": "-0.034",
      "bm25": "0.355",
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
    "text": "Once the software has reached adolescence and is put into service, itsevolution \nis governed by two conflicting needs: (1) the software mustsatisfy more \nrequirements, and (2) the software must be more reusable.New requirements usually \nadd new classes and operations and perhapswhole class hierarchies. The software \ngoes through an expansionaryphase to meet new requirements. This can't continue \nfor long,however. Eventually the software will become too inflexible andarthritic",
    "source": "",
    "scores": {
      "hybrid": "0.148",
      "vector": "-0.074",
      "bm25": "0.445",
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
    "text": "From Alexander's point of view, the patterns in this book do not forma pattern \nlanguage. Given the variety of software systems that peoplebuild, it's hard to \nsee how we could provide a \"complete\" set ofpatterns, one that offers step-by-step \ninstructions for designing anapplication. We can do that for certain classes of \napplications, suchas report-writing or making a forms-entry system. But our \ncatalog isjust a collection of related patterns; we can't pretend it's a \npatternlanguage.",
    "source": "",
    "scores": {
      "hybrid": "0.143",
      "vector": "0.048",
      "bm25": "0.260",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n59 \n \n \nFigure 2.8:  Embellished object structure \nNote that we can reverse the order of composition, putting thebordered composition \ninto the Scroller instance. In that case theborder would be scrolled along with \nthe text, which may or may not bedesirable. The point is, transparent enclosure \nmakes it easy toexperiment with different alternatives, and it keeps clients free \nofembellishment code.",
    "source": "",
    "scores": {
      "hybrid": "0.138",
      "vector": "-0.060",
      "bm25": "0.255",
      "title": "0.000",
      "wordnet": "0.300"
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n415 \n    Rect(Point(0, 0), Point(0, 0));",
    "source": "",
    "scores": {
      "hybrid": "0.138",
      "vector": "-0.017",
      "bm25": "0.362",
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
    "text": "Chapter 4\nModules Should Be Deep\nOne of the most important techniques for managing software complexity is\nto design systems so that developers only need to face a small fraction of\nthe overall complexity at any given time. This approach is called modular\ndesign , and this chapter presents its basic principles.\n4.1    Modular design\nIn modular design, a software system is decomposed into a collection of\nmodules that  are  relatively independent. Modules can  take  many forms,",
    "source": "",
    "scores": {
      "hybrid": "0.131",
      "vector": "-0.068",
      "bm25": "0.347",
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
    "text": "6. It’s more important for a module to have a simple interface than a\nsimple implementation (see pp. 55 , 71 ).\n7. General-purpose modules are deeper (see p. 39 ).\n8. Separate general-purpose and special-purpose code (see p. 62 ).\n9. Different layers should have different abstractions (see p. 45 ).\n10. Pull complexity downward (see p. 55 ).\n11. Define errors (and special cases) out of existence (see p. 79 ).\n12. Design it twice (see p. 91 ).",
    "source": "",
    "scores": {
      "hybrid": "0.130",
      "vector": "-0.002",
      "bm25": "0.227",
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
    "text": "this idea: if different layers have the same abstraction, such as pass-through\nmethods or  decorators, then there’s  a  good chance that  they  haven’t\nprovided enough benefit to compensate for the additional infrastructure they\nrepresent. Similarly,  pass-through arguments require each of  several\nmethods to be aware of their existence (which adds to complexity) without\ncontributing additional functionality.",
    "source": "",
    "scores": {
      "hybrid": "0.128",
      "vector": "-0.007",
      "bm25": "0.226",
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
    "text": "15. The increments of software development should be abstractions,\nnot features (see p. 154 ).",
    "source": "",
    "scores": {
      "hybrid": "0.123",
      "vector": "-0.057",
      "bm25": "0.365",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n330 \nlayering), or it must be forced to live in one layer orthe other (which \nmight compromise the layering abstraction). \n2. Support for broadcast communication.Unlike an ordinary request, the \nnotification that a subject sendsneedn't specify its receiver. The \nnotification is broadcastautomatically to all interested objects that \nsubscribed to it. Thesubject doesn't care how many interested objects exist;",
    "source": "",
    "scores": {
      "hybrid": "0.119",
      "vector": "-0.054",
      "bm25": "0.252",
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
    "text": "saving time.  The  general-purpose approach seems consistent with  the\ninvestment mindset discussed in Chapter 3 , where you spend a bit more\ntime up front to save time later on.\nOn the other hand, we know that it’s hard to predict the future needs of\na software system, so a general-purpose solution might include facilities\nthat are never actually needed. Furthermore, if you implement something\nthat  is  too  general-purpose, it  might  not  do  a  good  job  of  solving the",
    "source": "",
    "scores": {
      "hybrid": "0.108",
      "vector": "-0.041",
      "bm25": "0.260",
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
    "text": "requirements aresatisfied, and consolidation as the software becomes more general. \n \nThis cycle is unavoidable. But good designers are aware of thechanges that can \nprompt refactorings. Good designers also know classand object structures that \ncan help avoid refactorings—their designsare robust in the face of requirement \nchanges. A thoroughrequirements analysis will highlight those requirements that",
    "source": "",
    "scores": {
      "hybrid": "0.103",
      "vector": "-0.017",
      "bm25": "0.224",
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
    "text": "investments. This  amount is  small  enough that  it  won’t  impact your\nschedules significantly,  but  large  enough to  produce significant benefits\nover time. Your initial projects will thus take 10–20% longer than they\nwould in a purely tactical approach. That extra time will result in a better\nsoftware design, and you will start experiencing the benefits within a few\nmonths. It won’t be long before you’re developing at least 10–20% faster",
    "source": "",
    "scores": {
      "hybrid": "0.099",
      "vector": "-0.023",
      "bm25": "0.270",
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
    "text": "pages 1–22, Champéry, Switzerland, October 1992. Also available as IBM \nResearch DivisionTechnical Report RC 18524 (79392). \n \n \n[HO87] \nDaniel C. Halbert and Patrick D. O'Brien.Object-\noriented development. \nIEEE Software,4(5):71–79, September 1987.",
    "source": "",
    "scores": {
      "hybrid": "0.097",
      "vector": "-0.079",
      "bm25": "0.321",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n73 \nEncapsulating a Request \nFrom our perspective as designers, a pull-down menu is just anotherkind of glyph \nthat contains other glyphs. What distinguishespull-down menus from other glyphs \nthat have children is that mostglyphs in menus do some work in response to an \nup-click. \nLet's assume that these work-performing glyphs are instances of aGlyph subclass",
    "source": "",
    "scores": {
      "hybrid": "0.097",
      "vector": "-0.038",
      "bm25": "0.280",
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
    "text": "imprint of other factors that have shapedthe software landscape: components, \nresidue from the greatoperating system and browser wars, methods, processes, tools. \nEachline in this strata marks a definitive event: below that line,computing was \nthis way; above that line, the art of computing hadchanged. \nDesign Patterns draws such a line of demarcation;this is a work that represents \na change in the practice ofcomputing. Erich, Richard, Ralph, and John present",
    "source": "",
    "scores": {
      "hybrid": "0.096",
      "vector": "-0.029",
      "bm25": "0.270",
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
    "text": "get promoted into environments with harder and harder problems.\nEventually,  everyone reaches a  point where your first ideas are  no longer\ngood enough; if you want to get really great results, you have to consider a\nsecond possibility,  or  perhaps a  third, no matter how smart you are. The\ndesign of  large software systems falls in  this category: no-one is  good\nenough to get it right with their first try.\nUnfortunately, I often see smart people who insist on implementing the",
    "source": "",
    "scores": {
      "hybrid": "0.096",
      "vector": "-0.068",
      "bm25": "0.257",
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
    "text": "the stock it influences. Try thinking about that yourself. The more you do, the more you’ll begin to see feedback loops everywhere. The most common “non-feedback” decisions students suggest are falling in love and committing suicide. I’ll leave it to you to decide whether you think these are actually decisions made with no feedback involved. Watch out! If you see feedback loops everywhere, you’re already in danger of becoming a systems thinker! Instead of seeing only how A causes B, you’ll",
    "source": "",
    "scores": {
      "hybrid": "0.318",
      "vector": "0.081",
      "bm25": "0.515",
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
      "hybrid": "0.290",
      "vector": "0.027",
      "bm25": "0.498",
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
    "text": "of many more examples. The world is full of goal-seeking feedback loops. Balancing feedback loops are equilibrating or goal-seeking structures in systems and are both sources of stability and sources of resistance to change. The presence of a feedback mechanism doesn’t necessarily mean that the mechanism works well . The feedback mechanism may not be strong enough to bring the stock to the desired level. Feedbacks—the interconnections, the information part of the system—can fail for many",
    "source": "",
    "scores": {
      "hybrid": "0.273",
      "vector": "-0.048",
      "bm25": "0.531",
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
    "text": "a set of decisions or rules or physical laws or actions that are dependent on the level of the stock, and back again through a flow to change the stock. • Balancing feedback loops are equilibrating or goal-seeking structures in systems and are both sources of stability and sources of resistance to change. • Reinforcing feedback loops are self-enhancing, leading to exponential growth or to runaway collapses over time. • The information delivered by a feedback loop—even nonphysical feedback—can",
    "source": "",
    "scores": {
      "hybrid": "0.264",
      "vector": "-0.062",
      "bm25": "0.521",
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
    "text": "secrecy, • monitoring systems to report on environmental damage, • protection for whistleblowers, and • impact fees, pollution taxes, and performance bonds to recapture the externalized public costs of private benefits. 7. Reinforcing Feedback Loops— The strength of the gain of driving loops A balancing feedback loop is self-correcting; a reinforcing feedback loop is self-reinforcing. The more it works, the more it gains power to work some more, driving system behavior in one direction. The",
    "source": "",
    "scores": {
      "hybrid": "0.261",
      "vector": "-0.077",
      "bm25": "0.529",
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
      "hybrid": "0.252",
      "vector": "-0.059",
      "bm25": "0.490",
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
    "text": "cycles don’t come from presidents, although presidents can do much to ease or intensify the optimism of the upturns and the pain of the downturns. Economies are extremely complex systems; they are full of balancing feedback loops with delays, and they are inherently oscillatory. 5 Jay W. Forrester, 1989. Two-Stock Systems A Renewable Stock Constrained by a Nonrenewable Stock—an Oil Economy The systems I’ve displayed so far have been free of constraints imposed by their surroundings. The capital",
    "source": "",
    "scores": {
      "hybrid": "0.248",
      "vector": "-0.081",
      "bm25": "0.502",
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
    "text": "balancing death loop.Both also have an aging process. Steel mills and lathes and turbines get older and die just as people do. Systems with similar feedback structures produce similar dynamic behaviors. One of the central insights of systems theory, as central as the observation that systems largely cause their own behavior, is that systems with similar feedback structures produce similar dynamic behaviors, even if the outward appearance of these systems is completely dissimilar. A population",
    "source": "",
    "scores": {
      "hybrid": "0.240",
      "vector": "-0.079",
      "bm25": "0.478",
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
    "text": "goal (the thermostat), and a response mechanism (the furnace and/or air conditioner, fans, pumps, pipes, fuel, etc.). A complex system usually has numerous balancing feedback loops it can bring into play, so it can self-correct under different conditions and impacts. Some of those loops may be inactive much of the time—like the emergency cooling system in a nuclear power plant, or your ability to sweat or shiver to maintain your body temperature—but their presence is critical to the long term",
    "source": "",
    "scores": {
      "hybrid": "0.239",
      "vector": "-0.031",
      "bm25": "0.429",
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
    "text": "I don’t have to pay attention to it” ploy. No one can define or measure justice, democracy, security, freedom, truth, or love. No one can define or measure any value. But if no one speaks up for them, if systems aren’t designed to produce them, if we don’t speak about them and point toward their presence or absence, they will cease to exist. Make Feedback Policies for Feedback Systems President Jimmy Carter had an unusual ability to think in feedback terms and to make feedback policies.",
    "source": "",
    "scores": {
      "hybrid": "0.230",
      "vector": "0.038",
      "bm25": "0.438",
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
    "text": "expensive diagnostic machines can lead to out-of-sight health care costs. Escalation in morality can lead to holier-than-thou sanctimoniousness. Escalation in art can lead from baroque to rococo to kitsch. Escalation in environmentally responsible lifestyles can lead to rigid and unnecessary puritanism. Escalation, being a reinforcing feedback loop, builds exponentially. Therefore, it can carry a competition to extremes faster than anyone would believe possible. If nothing is done to break the",
    "source": "",
    "scores": {
      "hybrid": "0.224",
      "vector": "0.179",
      "bm25": "0.282",
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
      "hybrid": "0.221",
      "vector": "-0.103",
      "bm25": "0.454",
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
      "hybrid": "0.209",
      "vector": "0.000",
      "bm25": "0.422",
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
    "text": "Contents A Note from the Author A Note from the Editor Introduction: The Systems Lens Part One: System Structure and Behavior ONE. The Basics TWO. A Brief Visit to the Systems Zoo Part Two: Systems and Us THREE. Why Systems Work So Well FOUR. Why Systems Surprise Us FIVE. System Traps . . . and Opportunities Part Three: Creating Change— in Systems and in Our Philosophy SIX. Leverage Points—Places to Intervene in a System SEVEN. Living in a World of Systems Appendix System Definitions: A",
    "source": "",
    "scores": {
      "hybrid": "0.199",
      "vector": "-0.015",
      "bm25": "0.413",
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
      "hybrid": "0.197",
      "vector": "-0.043",
      "bm25": "0.336",
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
    "text": "when trying to achieve a particular goal. It doesn’t necessarily relate to the\noverall size  or  functionality of  the  system. People often  use  the  word\n“complex” to describe large systems with sophisticated features, but if such\na system is easy to work on, then, for the purposes of this book, it is not\ncomplex. Of course, almost all large and sophisticated software systems are\nin fact hard to work on, so they also meet my definition of complexity, but",
    "source": "",
    "scores": {
      "hybrid": "0.189",
      "vector": "0.030",
      "bm25": "0.342",
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
    "text": "rate high enough to cover the charges you incur while you’re paying (including interest). If you’re gearing up your work force to a higher level, you have to hire fast enough to correct for those who quit while you are hiring. In other words, your mental model of the system needs to include all the important flows, or you will be surprised by the system’s behavior. A stock-maintaining balancing feedback loop must have its goal set appropriately to compensate for draining or inflowing processes",
    "source": "",
    "scores": {
      "hybrid": "0.186",
      "vector": "-0.052",
      "bm25": "0.317",
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
    "text": "Systems Theory . (Philadelphia: University of Pennsylvania Press, 1991). The long, varied, and fascinating history of feedback concepts in social theory. Sweeney, Linda B. and Dennis Meadows. The Systems Thinking Playbook. (2001). A collection of 30 short gaming exercises that illustrate lessons about systems thinking and mental models. Organizations, Websites, Periodicals, and Software Creative Learning Exchange—an organization devoted to developing “systems citizens” in K–12 education.",
    "source": "",
    "scores": {
      "hybrid": "0.184",
      "vector": "-0.069",
      "bm25": "0.429",
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
      "hybrid": "0.183",
      "vector": "0.066",
      "bm25": "0.292",
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
    "text": "Bibliography of Systems Resources _____________ In addition to the works cited in the Notes, the items listed here are jumping off points—places to start your search for more ways to see and learn about systems. The fields of systems thinking and system dynamics are now extensive, reaching into many disciplines. For more resources, see also www.ThinkingInSystems.org Systems Thinking and Modeling Books Bossel, Hartmut. Systems and Models: Complexity, Dynamics, Evolution, Sustainability .",
    "source": "",
    "scores": {
      "hybrid": "0.181",
      "vector": "-0.046",
      "bm25": "0.397",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n431 \n \nDesign pattern relationships",
    "source": "",
    "scores": {
      "hybrid": "0.258",
      "vector": "0.157",
      "bm25": "0.488",
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
      "hybrid": "0.232",
      "vector": "0.092",
      "bm25": "0.488",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n44 \nTable 1.2:  Design aspects that design patterns let you vary \nHow to Use a Design Pattern \nOnce you've picked a design pattern, how do you use it? Here's a step-by-step \napproach to applying a design pattern effectively: \n1. Read the pattern once through for an overview. Pay particular attention \nto the Applicability and Consequences sections to ensure the pattern is \nright for your problem.",
    "source": "",
    "scores": {
      "hybrid": "0.224",
      "vector": "0.045",
      "bm25": "0.516",
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
      "hybrid": "0.209",
      "vector": "0.016",
      "bm25": "0.506",
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
      "hybrid": "0.195",
      "vector": "-0.018",
      "bm25": "0.505",
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
      "hybrid": "0.175",
      "vector": "-0.040",
      "bm25": "0.477",
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
      "hybrid": "0.155",
      "vector": "-0.062",
      "bm25": "0.450",
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
      "hybrid": "0.149",
      "vector": "-0.096",
      "bm25": "0.469",
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
      "hybrid": "0.141",
      "vector": "-0.085",
      "bm25": "0.439",
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
      "hybrid": "0.140",
      "vector": "-0.121",
      "bm25": "0.471",
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
      "hybrid": "0.138",
      "vector": "-0.121",
      "bm25": "0.465",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n14 \nfocuses on a particular object-oriented design problem or issue. It describes \nwhen it applies, whether it can be applied in view of other design constraints, \nand the consequences and trade-offs of its use. Since we must eventually implement \nour designs, a design pattern also provides sample C++ and (sometimes) Smalltalk \ncode to illustrate an implementation.",
    "source": "",
    "scores": {
      "hybrid": "0.137",
      "vector": "-0.104",
      "bm25": "0.447",
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
      "hybrid": "0.134",
      "vector": "-0.124",
      "bm25": "0.459",
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
      "hybrid": "0.134",
      "vector": "-0.141",
      "bm25": "0.476",
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
      "hybrid": "0.133",
      "vector": "-0.152",
      "bm25": "0.485",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n121 \nFactory Method \nIntent \nDefine an interface for creating an object, but let subclasses decide which class \nto instantiate. Factory Method lets a class defer instantiation to subclasses. \nAlso Known As \nVirtual Constructor \nMotivation \nFrameworks use abstract classes to define and maintain relationships between \nobjects. A framework is often responsible for creating these objects as well.",
    "source": "",
    "scores": {
      "hybrid": "0.129",
      "vector": "-0.069",
      "bm25": "0.391",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n170 \n1\nCreateManipulator is an example of a Factory Method (121).",
    "source": "",
    "scores": {
      "hybrid": "0.120",
      "vector": "-0.138",
      "bm25": "0.439",
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
    "text": "How do we describe design patterns?  Graphical notations, while important and \nuseful, aren't sufficient. They simply capture the end product of the design \nprocess as relationships between classes and objects. To reuse the design, we \nmust also record the decisions, alternatives, and trade-offs that led to it. \nConcrete examples are important too, because they help you see the design in action. \nWe describe design patterns using a consistent format. Each pattern is divided",
    "source": "",
    "scores": {
      "hybrid": "0.119",
      "vector": "-0.159",
      "bm25": "0.457",
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
    "text": "that addresses them using design patterns is far more likely to achieve high levels \nof design and code reuse than one that doesn't. Mature frameworks usually \nincorporate several design patterns. The patterns help make the framework's \narchitecture suitable to many different applications without redesign. \nAn added benefit comes when the framework is documented with the design patterns \nit uses [BJ94]. People who know the patterns gain insight into the framework faster.",
    "source": "",
    "scores": {
      "hybrid": "0.118",
      "vector": "-0.168",
      "bm25": "0.464",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n46 \n2. A Case Study: Design a Document Editor \nThis chapter presents a case study in the design of a \n\"What-You-See-Is-What-You-Get\" (or \"WYSIWYG\") document editor called Lexi.\n1\n \nWe'llsee how design patterns capture solutions to design problems inLexi and \napplications like it. By the end of this chapter you willhave gained experience \nwith eight patterns, learning them byexample.",
    "source": "",
    "scores": {
      "hybrid": "0.117",
      "vector": "-0.154",
      "bm25": "0.448",
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
  "total_concepts": 92,
  "primary_concepts": [
    "military strategy",
    "deception tactics",
    "intelligence operations",
    "logistics and supply management",
    "command and control",
    "moral law and morale",
    "terrain analysis",
    "timing and tempo",
    "economy of force and speed",
    "combined arms and unit organization"
  ],
  "related_concepts": [],
  "categories": [
    "military strategy",
    "defense studies",
    "intelligence studies",
    "logistics and supply chain",
    "organizational leadership"
  ],
  "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a historical biography of the ancient Chinese military strategist Sun Tzu, recounts his legendary demonstration of troop discipline by training the King of Wu's concubines, details his military achievements and legacy, and begins the first chapter on the vital strategic principles of warfare.\n\nKey Concepts: military strategy, deception tactics, intelligence operations, logistics and supply management, command and control, moral law and morale, terrain analysis, timing and tempo, economy of force and speed, combined arms and unit organization, discipline and law, victory without fighting, five factors framework, seven considerations forecasting, measurement estimation calculation balancing chain, direct and indirect maneuver methods, tactical dispositions, energy and momentum management, weak point exploitation, variation in tactics, maneuvering art, attack by stratagem, siege avoidance principle, foraging on enemy, signal and communications systems, types of terrain taxonomy, nine situations framework, spies and intelligence taxonomy, converted spy exploitation, doomed spy deception, surviving spy operations, local guide utilization, feints and baiting, simulated disorder technique, hold-out outlet tactic, burn-bridges commitment method, concentration and dispersion control, seizing advantageous ground, avoid uphill assault rule, river crossing tactics, camp placement and hygiene, forced marches and rapid mobility, supply-train protection, plunder allotment policy, using conquered foe augmentation, rewards and punishment certainty, officer selection and role assignment, training and rehearsal practice, signal discipline and mass synchronization, psychological operations, ambush and surprise tactics, holding and yielding strategy, isolation and interdiction, occupation of passes and chokepoints, water and fire element employment, attack by fire methods, seasonal and celestial timing, supply economy calculus, civil-military relations principle, authority clarity principle, psychology of moods and timetables, reading signs and indicators, camp security and counter-ambush, night-fighting and nocturnal signals, alliances and diplomatic manipulation, preventive attrition avoidance, psychological coercion of commanders, division and envelopment tactics, reserve utilization and economy, counterintelligence measures, morale cultivation techniques, leadership virtues framework, balance of chances assessment, use of psychology in pursuit restraint, tactical concealment and subdivision, use of local resources and environmental engineering, mood and provocation management, selection of engagement ratios, use of captured standards and flags, operational secrecy and need-to-know, risk calculus for protracted war, psychological bait and sacrifice, commanders as bulwark concept, controlling home front economy, psychological threshold management, integration of reconnaissance and planning, psychology of besieged and returning armies, use of ambulatory displays and theatrics, cumulative small maneuvers doctrine, unit signaling and password techniques, leader presence and composure, preventive sabotage and interdiction\nCategories: military strategy, defense studies, intelligence studies, logistics and supply chain, organizational leadership",
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
  "total_concepts": 92,
  "primary_concepts": [
    "software complexity",
    "dependencies in code",
    "obscurity in design",
    "change amplification",
    "cognitive load in development",
    "unknown unknowns",
    "modular design principle",
    "interface versus implementation",
    "abstraction in software",
    "deep module principle"
  ],
  "related_concepts": [],
  "categories": [
    "software architecture",
    "software engineering",
    "systems design",
    "programming language design",
    "human computer interaction"
  ],
  "summary": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through deep modules, information hiding, strategic decomposition, and practical techniques like writing comments first and designing errors out of existence, drawn from the author's Stanford course and decades of experience.\n\nKey Concepts: software complexity, dependencies in code, obscurity in design, change amplification, cognitive load in development, unknown unknowns, modular design principle, interface versus implementation, abstraction in software, deep module principle, shallow module antipattern, information hiding, information leakage, temporal decomposition antipattern, general purpose module strategy, special purpose module tradeoff, pull complexity downward, make common case simple principle, defaults as interface design, pass-through method antipattern, decorator pattern risks, different layer different abstraction rule, pass-through variable antipattern, context object pattern, information overexposure, classitis antipattern, bring together versus separate decision, separate general purpose and special purpose code, red flag detection, design it twice practice, write comments first practice, comments for abstraction, comments for precision, comments for intuition, implementation comment guideline, interface comment guideline, comment repetition antipattern, implementation detail contamination antipattern, cross module documentation strategy, names as images principle, naming precision guideline, naming consistency guideline, hard to pick name red flag, comments first as design tool, tactical programming mindset, strategic programming mindset, tactical tornado antipattern, investment mindset in engineering, startups and design tradeoff, code reviews as learning, split versus join criterion, conjoined methods red flag, repetition red flag, undo infrastructure pattern, action object pattern, fence grouping technique, exceptions as complexity source, define errors out of existence, exception masking technique, exception aggregation technique, promote error to simpler recovery, crash on fatal condition, define special cases out of existence, mask versus aggregate design tradeoff, unit testing for refactoring, test driven development critique, design patterns guidance, getters and setters critique, consistency principle, style enforcement tooling, when in rome guideline, code should be obvious principle, whitespace and formatting guideline, event driven complexity, generic container antipattern, measuring before optimizing rule, critical path optimization, microbenchmark practice, ramcloud buffer optimization case study, cache and allocation awareness, latency cost model, design for performance tradeoff, modifying existing code strategy, keep comments near code guideline, avoid documentation duplication, check diffs before commit practice, higher level comments resilience, consistency enforcement in teams, when not to change conventions rule, pass through mitigation techniques, avoid getters and setters guideline, summarize red flags checklist\nCategories: software architecture, software engineering, systems design, programming language design, human computer interaction",
  "_note": "Showing 10 of 92 concepts"
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
  "total_concepts": 177,
  "primary_concepts": [
    "system",
    "systems thinking",
    "system structure",
    "behavior over time",
    "stock",
    "flow",
    "stocks and flows modeling",
    "feedback loop",
    "balancing feedback loop",
    "reinforcing feedback loop"
  ],
  "related_concepts": [],
  "categories": [
    "systems thinking",
    "system dynamics",
    "environmental science",
    "organizational management",
    "public policy",
    "complexity science",
    "sustainability science"
  ],
  "summary": "Thinking in Systems is a primer by Donella H. Meadows that introduces foundational concepts of systems thinking, including system structures, behaviors, surprises, traps, leverage points for intervention, and guidelines for living and creating change in a complex, interconnected world, drawing from decades of systems modeling and interdisciplinary wisdom.\n\nKey Concepts: system, systems thinking, system structure, behavior over time, stock, flow, stocks and flows modeling, feedback loop, balancing feedback loop, reinforcing feedback loop, dynamic equilibrium, time graph, delay, buffer, stock as memory, information flow, system boundary, purpose and function, mental model, bounded rationality, satisficing, emergent behavior, resilience, self-organization, hierarchy, suboptimization, shifting dominance, nonlinearity, threshold and tipping point, overshoot, carrying capacity, limits to growth, renewable resource dynamics, nonrenewable resource dynamics, regeneration rate, yield per unit capital, capital stock, investment fraction, depreciation and lifetime, population dynamics, aging chain, bathtub dynamics, thermostat structure, inventory management, perception delay, response delay, delivery delay, oscillation, exponential growth, doubling time heuristic, nonlinear feedback sensitivity, archetype, policy resistance, tragedy of the commons, drift to low performance, escalation, success to the successful, shifting the burden, rule beating, seeking the wrong goal, leverage point, places to intervene in a system, parameters and constants, stock and flow structure intervention, delay management, feedback strength, information transparency, rules and incentives design, self-organization capacity, system goals intervention, paradigm shift, transcending paradigms, exposing mental models, behavioral scenarios and testing, model boundary selection, sensitivity analysis, simplifying assumptions, event-level versus behavior-level thinking, intrinsic responsibility, mutual coercion mutually agreed upon, internalizing externalities, learning policies, transparency and whistleblower protection, language and framing, quality versus quantity focus, celebrating complexity, humility and error-embracing, expand time horizons, defy disciplinary boundaries, locate responsibility in systems, monitoring and feedback policies, model equations, clouds as modeling shorthand, systems archetype catalog, design for resilience, internal feedback versus external blame, ethics of system design, holism versus reductionism, systems lens, sustainability, global modeling, sustainable development, environmental stewardship, complexity, global commons, cultural change through publishing, organizational learning, interconnectedness, long-term thinking, citizen empowerment, conservation science, science communication, system dynamics modeling, scenario analysis, integrated assessment modeling, feedback loop analysis, ecological economics, organizational design for sustainability, participatory governance, environmental pedagogy, public advocacy through books, citizen climate action, toxic chemical assessment, slow money investing, life cycle thinking, strategic foresight, environmental policy analysis, interdisciplinary research methods, teaching environmental studies, public intellectual column writing, book catalog distribution, editorial curation for impact, stewardship narratives, public-facing scientific forewords, sustainability institutes, population and resource coupling, carrying capacity modeling, reinforcing feedback, balancing feedback, stock and flow structures, delay effects in systems, overshoot and collapse dynamics, environmental indicators, ecological footprint accounting, pollutant exposure pathways, regulatory risk assessment, food system resilience, local investment strategies, soil fertility management, holocene perspective, gaia hypothesis interpretation, science and intuition integration, conversations with scientists, public catalog marketing, foreword framing, book pricing strategy, accessibility in publishing, environmental narrative framing, consumer product toxicity, transdisciplinary synthesis, media outreach for sustainability, research fellowship recognition, academic teaching in practice, book-driven civic education, ethical stewardship frameworks, sustainability metrics design, holistic risk communication, stakeholder engagement practices, policy-relevant scholarship, narrative reflection, consumer empowerment, applied systems pedagogy, scientific foreword use, publishing as activism, community-supported investment, environmental history perspective, public-facing research dissemination\nCategories: systems thinking, system dynamics, environmental science, organizational management, public policy, complexity science, sustainability science",
  "_note": "Showing 10 of 177 concepts"
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
  "total_concepts": 162,
  "primary_concepts": [
    "abstract factory pattern",
    "builder pattern",
    "factory method pattern",
    "prototype pattern",
    "singleton pattern",
    "adapter pattern",
    "bridge pattern",
    "composite pattern",
    "decorator pattern",
    "facade pattern"
  ],
  "related_concepts": [],
  "categories": [
    "software architecture",
    "object-oriented design",
    "software engineering",
    "human-computer interaction",
    "programming languages",
    "user interface engineering"
  ],
  "summary": "This document presents the table of contents and preface for \"Design Patterns: Elements of Reusable Object-Oriented Software,\" a foundational book introducing key object-oriented design patterns through an introductory overview, a document editor case study, a comprehensive catalog of creational, structural, and behavioral patterns, and supplementary materials like a glossary and notation guide, along with a CD-ROM edition preface highlighting the book's impact and hypertext benefits.\n\nKey Concepts: abstract factory pattern, builder pattern, factory method pattern, prototype pattern, singleton pattern, adapter pattern, bridge pattern, composite pattern, decorator pattern, facade pattern, flyweight pattern, proxy pattern, chain of responsibility pattern, command pattern, interpreter pattern, iterator pattern, mediator pattern, memento pattern, observer pattern, state pattern, strategy pattern, template method pattern, visitor pattern, model view controller, glyph abstraction, recursive composition, compositor, composition pattern, linebreaking algorithm, formatting strategy, compositor strategy, transparent enclosure, monoglyph, border decorator, scroller decorator, discretionary glyph, spelling checking visitor, hyphenation visitor, command history, undo redo mechanism, iterator types, preorder traversal, list iterator, null iterator, visitor traversal, separation of traversal and traversal actions, program to an interface, favor object composition over class inheritance, delegation, dynamic binding, polymorphism, encapsulation, abstraction, inheritance versus composition, interface inheritance, implementation inheritance, class and object scope, pattern classification by purpose and scope, pattern catalog organization, pattern template elements, applicability assessment, trade offs and consequences, design for change, loose coupling, tight coupling, coupling and cohesion, aggregation and acquaintance, runtime and compile-time structures, mixin class, parameterized types and generics, createiterator operation, prototype manager, clone operation and deep copy, prototype registration, lazy initialization, singleton registry, handle body idiom, reference counting for shared objects, caching for performance, facade versus mediator, decorator versus inheritance tradeoff, class adapter versus object adapter, pluggable adapters, two way adapter, factory as singleton, prototype versus abstract factory tradeoff, framework toolkit application distinction, inversion of control, template method usage, macro command, composite and iterator synergy, visitor tradeoffs, mediator pattern decoupling, memento encapsulation of state, proxy as surrogate, intrinsic and extrinsic state, design pattern, object oriented design, encapsulation principle, inheritance, high cohesion, separation of concerns, reuse strategy, refactoring, framework, flyweight factory, intrinsic state, extrinsic state, glyph context, b tree mapping, glyph factory, glyph composite structure, character flyweight, compact font mapping, font span, index-based lookup, lazy instantiation, virtual proxy, protection proxy, remote proxy, smart reference, operator overloading proxy, does not understand hook, copy on write, reference counting, persistent object loading, operator arrow forwarding, smalltalk message forwarding, undo redo history, command as first class object, undo state capture, memento caretaking, incremental mementos, change manager, directed acyclic graph manager, push versus pull notification, subject observer mapping, dangling observer handling, aspect based registration, template method hooks, factory method as primitive, double dispatch, multiple dispatch, traversal placement decision, internal iterator, external iterator, cursor iterator, robust iterator, iterator cleanup proxy, cursor based composite iteration, filtering traversal, iterator as internal traverser, command serialization, arguments bundling request object, handler successor link, help handler example, widget director, dialog creation template, view manager pattern, event subscription, delegation pattern, role based decomposition\nCategories: software architecture, object-oriented design, software engineering, human-computer interaction, programming languages, user interface engineering",
  "_note": "Showing 10 of 162 concepts"
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
    "totalDocuments": 23,
    "sortedBy": "popularity",
    "searchQuery": null
  },
  "categories": [
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
      "id": 3450474974,
      "name": "programming language design",
      "description": "Concepts and practices related to programming language design",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "programming language design"
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
      "id": 3580034254,
      "name": "user interface engineering",
      "description": "Concepts and practices related to user interface engineering",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "user interface engineering"
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
      "preview": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" provides a historical biography of the ancient Chinese military strategist Sun Tzu, recounts his legendary demonstration of troop disci...",
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
      "preview": "This book outlines a philosophy of software design, emphasizing principles for managing complexity through deep modules, information hiding, strategic decomposition, and practical techniques like writ...",
      "primaryConcepts": []
    },
    {
      "title": "",
      "preview": "This document presents the table of contents and preface for \"Design Patterns: Elements of Reusable Object-Oriented Software,\" a foundational book introducing key object-oriented design patterns throu...",
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
      "preview": "Thinking in Systems is a primer by Donella H. Meadows that introduces foundational concepts of systems thinking, including system structures, behaviors, surprises, traps, leverage points for intervent...",
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
    "timestamp": "2025-11-28T17:04:08.271Z"
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