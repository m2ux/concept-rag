# MCP Tool Test Report - Detailed Output

**Generated:** 2025-11-28T17:44:07.002Z
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
  "summary": "Systematic planning and conduct of armed conflict to achieve political objectives with minimal cost. In this document it encompasses deception, terrain exploitation, logistics, timing, force disposition, and unified command as methods to secure victory while preserving the state's resources and people.",
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
  "concept": "software architecture",
  "concept_id": 3503213995,
  "summary": "High-level organization of a software system describing components, their relationships, and interaction protocols. The text shows how patterns help architects structure subsystems, reduce coupling, and evolve frameworks by capturing recurrent collaboration strategies.",
  "match_score": "0.965",
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
  "summary": "A feedback loop is a causal chain where a stock influences flows that in turn change that same stock, closing the loop. The book emphasizes feedback loops as the primary mechanism by which systems generate characteristic behaviors like regulation, growth, oscillation, and collapse.",
  "match_score": "0.979",
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
      "concept_density": "0.225",
      "concepts": [
        "feedback loop",
        "reinforcing feedback"
      ]
    },
    {
      "text": "you’ll find that you can understand this graphical language easily. I start with the basics: the definition of a system and a dissection of its parts (in a reductionist, unholistic way). Then I put the parts back together to show how they interconnect to make the basic operating unit of a system: the feedback loop. Next I will introduce you to a systems zoo—a collection of some common and interesting types of systems. You’ll see how a few of these creatures behave and why and where they can be",
      "title": "Thinking in Systems",
      "page": 1,
      "concept_density": "0.225",
      "concepts": [
        "system definition",
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
  "summary": "A wrapper object that presents the same interface as a wrapped object to add behavior, often producing many small shallow classes. The author acknowledges decorators’ usefulness but warns of overuse, recommending composition or combining buffering-like defaults into core classes when the feature is universally needed.",
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
      "concept_density": "5.000",
      "concepts": [
        "design pattern",
        "structural patterns",
        "adapter pattern",
        "bridge pattern",
        "composite pattern",
        "decorator pattern",
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
        "pattern template",
        "related patterns",
        "abstract factory",
        "factory method",
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
      "concept_density": "1.667",
      "concepts": [
        "design pattern",
        "related patterns",
        "abstract factory",
        "factory method",
        "composite pattern",
        "decorator pattern",
        "observer pattern",
        "strategy pattern",
        "mvc",
        "border decorator"
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
      "hybrid": "0.403",
      "vector": "0.000",
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
      "hybrid": "0.361",
      "vector": "0.000",
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
      "hybrid": "0.267",
      "vector": "0.000",
      "bm25": "0.475",
      "title": "0.500",
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
      "hybrid": "0.262",
      "vector": "0.000",
      "bm25": "0.458",
      "title": "0.500",
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
    "text": "}; \n \nContext<MyStrategy> aContext; \nWith templates, there's no need to define an abstract class that defines \nthe interface to the Strategy. Using Strategy as atemplate parameter also \nlets you bind a Strategy to itsContext statically, which can increase \nefficiency. \n3. Making Strategy objects optional.The Context class may be simplified if \nit's meaningful not tohave a Strategy object. Context checks to see if it \nhas a Strategyobject before accessing it. If there is one, then Context",
    "source": "",
    "scores": {
      "hybrid": "0.181",
      "vector": "0.000",
      "bm25": "0.454",
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
      "hybrid": "0.175",
      "vector": "0.000",
      "bm25": "0.438",
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
      "hybrid": "0.173",
      "vector": "0.000",
      "bm25": "0.432",
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
      "hybrid": "0.169",
      "vector": "0.000",
      "bm25": "0.424",
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
      "hybrid": "0.169",
      "vector": "0.000",
      "bm25": "0.423",
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
      "hybrid": "0.166",
      "vector": "0.000",
      "bm25": "0.416",
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
      "hybrid": "0.166",
      "vector": "0.000",
      "bm25": "0.415",
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
      "hybrid": "0.165",
      "vector": "0.000",
      "bm25": "0.413",
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
    "text": "can be selectedat compile-time, and (2) it does not have to be changed at \nrun-time.In this case, the class to be configured (e.g., Context) isdefined \nas a template class that has a Strategy class as aparameter: \ntemplate <class AStrategy> \nclass Context { \n void Operation() { theStrategy.DoAlgorithm(); } \n  // ...  \nprivate: \n AStrategy theStrategy; \n}; \nThe class is then configured with a Strategy class when it's \ninstantiated: \nclass MyStrategy { \npublic: \n void DoAlgorithm(); \n};",
    "source": "",
    "scores": {
      "hybrid": "0.164",
      "vector": "0.000",
      "bm25": "0.411",
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
    "text": "ObjectWindows uses Validator objects to encapsulate validationstrategies. \nValidators are examples of Strategy objects. Data entryfields delegate the \nvalidation strategy to an optional Validatorobject. The client attaches a \nvalidator to a field if validation isrequired (an example of an optional strategy). \nWhen the dialog isclosed, the entry fields ask their validators to validate the \ndata.The class library provides validators for common cases, such as",
    "source": "",
    "scores": {
      "hybrid": "0.163",
      "vector": "0.000",
      "bm25": "0.408",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n351 \nStructure \n \nParticipants \n• Strategy (Compositor) \no declares an interface common to all supported algorithms. Context \nuses this interface to call the algorithm defined by a \nConcreteStrategy. \n• ConcreteStrategy (SimpleCompositor, TeXCompositor,ArrayCompositor) \no implements the algorithm using the Strategy interface. \n• Context (Composition) \no is configured with a ConcreteStrategy object.",
    "source": "",
    "scores": {
      "hybrid": "0.163",
      "vector": "0.000",
      "bm25": "0.407",
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
      "hybrid": "0.148",
      "vector": "0.000",
      "bm25": "0.370",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n349 \nStrategy \nIntent \nDefine a family of algorithms, encapsulate each one, and make theminterchangeable. \nStrategy lets the algorithm vary independently fromclients that use it. \nAlso Known As \nPolicy \nMotivation \nMany algorithms exist for breaking a stream of text into lines.Hard-wiring all \nsuch algorithms into the classes that require themisn't desirable for several \nreasons:",
    "source": "",
    "scores": {
      "hybrid": "0.147",
      "vector": "0.000",
      "bm25": "0.367",
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
    "text": "military  classic,\"  and  Wang  Hsi,    \"an  old  book  on  war.\"    Considering  the\nenormous  amount  of  fighting  that  had  gone  on  for  centuries  before  Sun\nTzu's time between the various kingdoms and principalities of China, it is\nnot  in  itself  improbable  that  a  collection  of  military  maxims  should  have\nbeen made and written down at some earlier period.]\nOn the field of battle,\n     [Implied, though not actually in the Chinese.]",
    "source": "",
    "scores": {
      "hybrid": "0.143",
      "vector": "0.000",
      "bm25": "0.358",
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
    "text": "[Ts`ao Kung's note is, freely translated:   \"The military sphere and the\ncivil  sphere  are  wholly  distinct;  you  can't  handle  an  army  in  kid  gloves.\"\nAnd Chang Yu says:   \"Humanity and justice are the principles on which to\ngovern a state, but not an army;  opportunism and flexibility,  on the other\nhand,  are military rather than civil virtues to assimilate the governing of an\narmy\"--to that of a State, understood.]",
    "source": "",
    "scores": {
      "hybrid": "0.142",
      "vector": "0.000",
      "bm25": "0.356",
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
    "text": "is the negation of civil order!\"  The unpalatable fact remains, however, that\neven Imperial wishes must be subordinated to military necessity.]",
    "source": "",
    "scores": {
      "hybrid": "0.141",
      "vector": "0.000",
      "bm25": "0.352",
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
    "text": "and    'a  spear'  (cessation  of  hostilities).    Military  prowess  is  seen  in  the\nrepression   of   cruelty,  the calling in of   weapons,   the preservation of the",
    "source": "",
    "scores": {
      "hybrid": "0.138",
      "vector": "0.000",
      "bm25": "0.346",
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
    "text": "or extend the component's functionality by replacing the strategy object. \nFor example, we can support different border styles by having the component \ndefer border-drawing to a separate Border object. The Border object is a \nStrategy object that encapsulates a border-drawing strategy. By extending \nthe number of strategies from just one to an open-ended list, we achieve \nthe same effect as nesting decorators recursively. \nIn MacApp 3.0 [App89] and Bedrock [Sym93a], for example, graphical",
    "source": "",
    "scores": {
      "hybrid": "0.131",
      "vector": "0.000",
      "bm25": "0.271",
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
    "text": "Compositor's interface is carefully designed to support alllayout algorithms that \nsubclasses might implement. You don't want tohave to change this interface with \nevery new subclass, because that willrequire changing existing subclasses. In \ngeneral, the Strategy andContext interfaces determine how well the pattern \nachieves its intent.",
    "source": "",
    "scores": {
      "hybrid": "0.122",
      "vector": "0.000",
      "bm25": "0.304",
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
    "text": "who relies solely on warlike measures shall be exterminated; he who relies\nsolely on peaceful measures shall perish. Instances of this are Fu Ch`ai on\nthe one hand and Yen Wang on the other. In military matters, the Sage's rule\nis normally to keep the peace, and to move his forces only when occasion\nrequires.  He will not use armed force unless driven to it by necessity.",
    "source": "",
    "scores": {
      "hybrid": "0.116",
      "vector": "0.000",
      "bm25": "0.234",
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
      "hybrid": "0.195",
      "vector": "0.000",
      "bm25": "0.438",
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
      "hybrid": "0.178",
      "vector": "0.000",
      "bm25": "0.445",
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
    "text": "software more quickly, but the software development process will be more\nenjoyable.",
    "source": "",
    "scores": {
      "hybrid": "0.175",
      "vector": "0.000",
      "bm25": "0.437",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n395 \nSoftware Architecture programsponsored by the U.S. Department of Defense [GM92] \nconcentrates on gathering architectural information. Theknowledge-based software \nengineering community tries to representsoftware-related knowledge in general. \nThere are many other groupswith goals at least a little like ours. \nJames Coplien's Advanced C++: Programming Styles andIdioms [Cop92] has influenced",
    "source": "",
    "scores": {
      "hybrid": "0.163",
      "vector": "0.017",
      "bm25": "0.391",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n59 \n \n \nFigure 2.8:  Embellished object structure \nNote that we can reverse the order of composition, putting thebordered composition \ninto the Scroller instance. In that case theborder would be scrolled along with \nthe text, which may or may not bedesirable. The point is, transparent enclosure \nmakes it easy toexperiment with different alternatives, and it keeps clients free \nofembellishment code.",
    "source": "",
    "scores": {
      "hybrid": "0.162",
      "vector": "0.000",
      "bm25": "0.255",
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
    "text": "actually used. \nWith this book, the Gang of Four have made a seminalcontribution to software \nengineering. There is much to learnedfrom them, and much to be actively applied. \nGrady Booch \nChief Scientist, Rational Software Corporation",
    "source": "",
    "scores": {
      "hybrid": "0.160",
      "vector": "0.000",
      "bm25": "0.400",
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
    "text": "Chapter 19\nSoftware Trends\nAs a way of illustrating the principles discussed in this book, this chapter\nconsiders several trends and patterns that have become popular in software\ndevelopment over the last few decades. For each trend, I will describe how\nthat trend relates to the principles in this book and use the principles to\nevaluate whether that trend provides leverage against software complexity.\n19.1  Object-oriented programming and inheritance",
    "source": "",
    "scores": {
      "hybrid": "0.160",
      "vector": "0.000",
      "bm25": "0.399",
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
    "text": "15. The increments of software development should be abstractions,\nnot features (see p. 154 ).",
    "source": "",
    "scores": {
      "hybrid": "0.146",
      "vector": "0.000",
      "bm25": "0.365",
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
      "hybrid": "0.141",
      "vector": "0.000",
      "bm25": "0.252",
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
    "text": "13. Comments should describe things that are not obvious from the\ncode (see p. 101 ).\n14. Software should be designed for ease of reading, not ease of\nwriting (see p. 149 ).",
    "source": "",
    "scores": {
      "hybrid": "0.135",
      "vector": "0.030",
      "bm25": "0.257",
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
      "hybrid": "0.131",
      "vector": "0.000",
      "bm25": "0.227",
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
    "text": "From Alexander's point of view, the patterns in this book do not forma pattern \nlanguage. Given the variety of software systems that peoplebuild, it's hard to \nsee how we could provide a \"complete\" set ofpatterns, one that offers step-by-step \ninstructions for designing anapplication. We can do that for certain classes of \napplications, suchas report-writing or making a forms-entry system. But our \ncatalog isjust a collection of related patterns; we can't pretend it's a \npatternlanguage.",
    "source": "",
    "scores": {
      "hybrid": "0.124",
      "vector": "0.000",
      "bm25": "0.260",
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
    "text": "saving time.  The  general-purpose approach seems consistent with  the\ninvestment mindset discussed in Chapter 3 , where you spend a bit more\ntime up front to save time later on.\nOn the other hand, we know that it’s hard to predict the future needs of\na software system, so a general-purpose solution might include facilities\nthat are never actually needed. Furthermore, if you implement something\nthat  is  too  general-purpose, it  might  not  do  a  good  job  of  solving the",
    "source": "",
    "scores": {
      "hybrid": "0.124",
      "vector": "0.000",
      "bm25": "0.260",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n61 \nto add general scrolling operations; Button is anabstract class that adds \nbutton-oriented operations; and so on. \n2. A set of concrete subclasses for each abstract subclass thatimplement \ndifferent look-and-feel standards. For example, ScrollBarmight have \nMotifScrollBar and PMScrollBar subclasses that implementMotif and \nPresentation Manager-style scroll bars, respectively.",
    "source": "",
    "scores": {
      "hybrid": "0.116",
      "vector": "0.000",
      "bm25": "0.291",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n302 \nListIterator<Employee*> i(employees); \nint count = 0; \nfor (i.First(); !i.IsDone(); i.Next()) { \ncount++; \ni.CurrentItem()->Print(); \nif (count >= 10) { \nbreak; \n} \n} \nInternal iterators can encapsulate different kinds of iteration. \nForexample, FilteringListTraverser encapsulates aniteration that \nprocesses only items that satisfy a test: \ntemplate <class Item> \nclass FilteringListTraverser { \npublic:",
    "source": "",
    "scores": {
      "hybrid": "0.115",
      "vector": "0.000",
      "bm25": "0.286",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n326 \nObserver \nIntent \nDefine a one-to-many dependency between objects so that when oneobject changes \nstate, all its dependents are notified and updatedautomatically. \nAlso Known As \nDependents, Publish-Subscribe \nMotivation \nA common side-effect of partitioning a system into a collection ofcooperating \nclasses is the need to maintain consistency betweenrelated objects. You don't",
    "source": "",
    "scores": {
      "hybrid": "0.114",
      "vector": "0.000",
      "bm25": "0.285",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n299 \n} \nNow we're in a position to write the code for printingthe employees \nindependent of a concrete representation. \n// we know only that we have an AbstractList \nAbstractList<Employee*>* employees; \n// ... \nIterator<Employee*>* iterator = employees->CreateIterator(); \nPrintEmployees(*iterator); \ndelete iterator; \n5. Making sure iterators get deleted.Notice that CreateIterator returns a",
    "source": "",
    "scores": {
      "hybrid": "0.112",
      "vector": "0.000",
      "bm25": "0.231",
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
      "hybrid": "0.112",
      "vector": "0.000",
      "bm25": "0.231",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n73 \nEncapsulating a Request \nFrom our perspective as designers, a pull-down menu is just anotherkind of glyph \nthat contains other glyphs. What distinguishespull-down menus from other glyphs \nthat have children is that mostglyphs in menus do some work in response to an \nup-click. \nLet's assume that these work-performing glyphs are instances of aGlyph subclass",
    "source": "",
    "scores": {
      "hybrid": "0.112",
      "vector": "0.000",
      "bm25": "0.280",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n364 \nImplementation \nThree implementation issues are worth noting: \n1. Using C++ access control.In C++, the primitive operations that a template \nmethod calls can bedeclared protected members. This ensures that they are \nonly called bythe template method. Primitive operations that must be \noverridden aredeclared pure virtual. The template method itself should not",
    "source": "",
    "scores": {
      "hybrid": "0.112",
      "vector": "0.000",
      "bm25": "0.229",
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
    "text": "different mechanisms, at different time scales, and with redundancy—one kicking in if another one fails. A set of feedback loops that can restore or rebuild feedback loops is resilience at a still higher level—meta-resilience, if you will. Even higher meta-meta- resilience comes from feedback loops that can learn , create , design , and evolve ever more complex restorative structures. Systems that can do this are self-organizing, which will be the next surprising system characteristic I come",
    "source": "",
    "scores": {
      "hybrid": "0.296",
      "vector": "0.000",
      "bm25": "0.540",
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
      "hybrid": "0.292",
      "vector": "0.000",
      "bm25": "0.531",
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
      "hybrid": "0.288",
      "vector": "0.000",
      "bm25": "0.521",
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
    "text": "the stock it influences. Try thinking about that yourself. The more you do, the more you’ll begin to see feedback loops everywhere. The most common “non-feedback” decisions students suggest are falling in love and committing suicide. I’ll leave it to you to decide whether you think these are actually decisions made with no feedback involved. Watch out! If you see feedback loops everywhere, you’re already in danger of becoming a systems thinker! Instead of seeing only how A causes B, you’ll",
    "source": "",
    "scores": {
      "hybrid": "0.288",
      "vector": "0.005",
      "bm25": "0.515",
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
      "hybrid": "0.283",
      "vector": "0.000",
      "bm25": "0.508",
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
      "hybrid": "0.279",
      "vector": "0.000",
      "bm25": "0.498",
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
      "hybrid": "0.277",
      "vector": "0.003",
      "bm25": "0.490",
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
      "hybrid": "0.271",
      "vector": "0.000",
      "bm25": "0.478",
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
    "text": "It forces nations into reinforcing loops “racing to the bottom,” competing with each other to weaken environmental and social safeguards in order to attract corporate investment. It’s a recipe for unleashing “success to the successful” loops, until they generate enormous accumulations of power and huge centralized planning systems that will destroy themselves. 4. Self- Organization— The power to add, change, or evolve system structure The most stunning thing living systems and some social",
    "source": "",
    "scores": {
      "hybrid": "0.270",
      "vector": "0.020",
      "bm25": "0.454",
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
      "hybrid": "0.254",
      "vector": "0.000",
      "bm25": "0.436",
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
      "hybrid": "0.221",
      "vector": "0.041",
      "bm25": "0.413",
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
    "text": "I don’t have to pay attention to it” ploy. No one can define or measure justice, democracy, security, freedom, truth, or love. No one can define or measure any value. But if no one speaks up for them, if systems aren’t designed to produce them, if we don’t speak about them and point toward their presence or absence, they will cease to exist. Make Feedback Policies for Feedback Systems President Jimmy Carter had an unusual ability to think in feedback terms and to make feedback policies.",
    "source": "",
    "scores": {
      "hybrid": "0.220",
      "vector": "0.013",
      "bm25": "0.438",
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
      "hybrid": "0.214",
      "vector": "0.000",
      "bm25": "0.336",
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
      "hybrid": "0.207",
      "vector": "0.000",
      "bm25": "0.317",
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
      "hybrid": "0.199",
      "vector": "0.089",
      "bm25": "0.309",
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
      "hybrid": "0.198",
      "vector": "0.113",
      "bm25": "0.282",
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
    "text": "PART TWO Systems and Us",
    "source": "",
    "scores": {
      "hybrid": "0.189",
      "vector": "0.024",
      "bm25": "0.348",
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
    "text": "When systems work well, we see a kind of harmony in their functioning. Think of a community kicking in to high gear to respond to a storm. People work long hours to help victims, talents and skills emerge; once the emergency is over, life goes back to “normal.” Why do systems work so well? Consider the properties of highly functional systems—machines or human communities or ecosystems—which are familiar to you. Chances are good that you may have observed one of three characteristics:",
    "source": "",
    "scores": {
      "hybrid": "0.189",
      "vector": "0.026",
      "bm25": "0.346",
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
    "text": "a complex property of systems that it could never be understood. Computers were used to model mechanistic, “deterministic” systems, not evolutionary ones, because it was suspected, without much thought, that evolutionary systems were simply not understandable. New discoveries, however, suggest that just a few simple organizing principles can lead to wildly diverse self-organizing structures. Imagine a triangle with three equal sides. Add to the middle of each side another equilateral triangle,",
    "source": "",
    "scores": {
      "hybrid": "0.182",
      "vector": "0.000",
      "bm25": "0.355",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n93 \nDesign Pattern Catalog",
    "source": "",
    "scores": {
      "hybrid": "0.259",
      "vector": "0.161",
      "bm25": "0.488",
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
      "hybrid": "0.228",
      "vector": "0.081",
      "bm25": "0.488",
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
      "hybrid": "0.220",
      "vector": "0.033",
      "bm25": "0.516",
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
      "hybrid": "0.202",
      "vector": "0.000",
      "bm25": "0.506",
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
      "hybrid": "0.202",
      "vector": "0.000",
      "bm25": "0.505",
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
      "hybrid": "0.196",
      "vector": "0.000",
      "bm25": "0.489",
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
      "hybrid": "0.194",
      "vector": "0.000",
      "bm25": "0.485",
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
    "text": "the design patterns in this book have to be implemented each time they're \nused. Design patterns also explain the intent, trade-offs, and consequences \nof a design. \n2. Design patterns are smaller architectural elements than frameworks. A \ntypical framework contains several design patterns, but the reverse is never \ntrue. \n3. Design patterns are less specialized than frameworks. Frameworks always \nhave a particular application domain. A graphical editor framework might",
    "source": "",
    "scores": {
      "hybrid": "0.192",
      "vector": "0.000",
      "bm25": "0.481",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n12 \nThe purpose of this book is to record experience in designing object-oriented \nsoftware as design patterns. Each design pattern systematically names, explains, \nand evaluates an important and recurring design in object-oriented systems. Our \ngoal is to capture design experience in a form that people can use effectively. \nTo this end we have documented some of the most important design patterns and \npresent them as a catalog.",
    "source": "",
    "scores": {
      "hybrid": "0.192",
      "vector": "0.000",
      "bm25": "0.479",
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
    "text": "easilyoverride, such as an initialization operation. \nDesigns that use Abstract Factory, Prototype, or Builder are even moreflexible \nthan those that use Factory Method, but they're also morecomplex. Often, designs \nstart out using Factory Method and evolvetoward the other creational patterns \nas the designer discovers wheremore flexibility is needed. Knowing many design \npatterns gives youmore choices when trading off one design criterion against \nanother.",
    "source": "",
    "scores": {
      "hybrid": "0.191",
      "vector": "0.000",
      "bm25": "0.479",
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
      "hybrid": "0.191",
      "vector": "0.000",
      "bm25": "0.477",
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
      "hybrid": "0.190",
      "vector": "0.000",
      "bm25": "0.476",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n399 \na request to another object. The delegate carries out the request on behalf \nof the original object. \n   \ndesign pattern \n \nA design pattern systematically names, motivates, and explains a general \ndesign that addresses a recurring design problem in object-oriented \nsystems. It describes the problem, the solution, when to apply the solution, \nand its consequences. It also gives implementation hints and examples. The",
    "source": "",
    "scores": {
      "hybrid": "0.190",
      "vector": "0.000",
      "bm25": "0.474",
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
    "text": "Design Patterns: Elements of Reusable Object-Oriented Software \n102 \nConsequences \nThe Abstract Factory pattern has the following benefits and liabilities: \n1. It isolates concrete classes. The Abstract Factory pattern helps you control \nthe classes of objects that an application creates. Because a factory \nencapsulates the responsibility and the process of creating product objects, \nit isolates clients from implementation classes. Clients manipulate",
    "source": "",
    "scores": {
      "hybrid": "0.189",
      "vector": "0.000",
      "bm25": "0.472",
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
      "hybrid": "0.188",
      "vector": "0.000",
      "bm25": "0.471",
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
    "text": "Design patterns make it easier to reuse successful designs and architectures. \nExpressing proven techniques as design patterns makes them more accessible to \ndevelopers of new systems. Design patterns help you choose design alternatives \nthat make a system reusable and avoid alternatives that compromise reusability. \nDesign patterns can even improve the documentation and maintenance of existing \nsystems by furnishing an explicit specification of class and object interactions",
    "source": "",
    "scores": {
      "hybrid": "0.187",
      "vector": "0.000",
      "bm25": "0.468",
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
      "hybrid": "0.186",
      "vector": "0.000",
      "bm25": "0.465",
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
    "text": "them. The most common way to do this is to define a factory method (see  \nFactory Method (121)) for each product. A concrete factory will specify",
    "source": "",
    "scores": {
      "hybrid": "0.184",
      "vector": "0.000",
      "bm25": "0.459",
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
      "hybrid": "0.184",
      "vector": "0.000",
      "bm25": "0.459",
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
      "hybrid": "0.183",
      "vector": "0.000",
      "bm25": "0.457",
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
  "total_concepts": 100,
  "primary_concepts": [
    "military strategy",
    "deception tactics",
    "logistics and supply management",
    "intelligence and espionage",
    "terrain analysis",
    "leadership and command",
    "troop morale and moral law",
    "timing and tempo",
    "maneuver warfare",
    "risk management in warfare"
  ],
  "related_concepts": [],
  "categories": [
    "military strategy",
    "logistics and supply",
    "intelligence studies",
    "leadership studies",
    "decision theory"
  ],
  "summary": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" recounts the ancient Chinese strategist's biography, including his legendary demonstration of military discipline by drilling palace concubines for King Ho Lu of Wu, his subsequent victories, references to his descendant Sun Pin, historical context, and the opening lines of the first chapter on the vital importance of warfare to the state.\n\nKey Concepts: military strategy, deception tactics, logistics and supply management, intelligence and espionage, terrain analysis, leadership and command, troop morale and moral law, timing and tempo, maneuver warfare, risk management in warfare, tactical adaptability, discipline and training, planning and forecasting, operational calculations, foraging and provisioning, force concentration and division, signal and communication systems, siege warfare principles, campaign economy, surprise and ambush tactics, feints and bait operations, encirclement and containment, supply line protection, alliance and coalition management, reconnaissance and scouting, camp organization, night operations, river crossing tactics, movement and maneuver doctrine, combined arms employment, direct and indirect maneuver framework, measurement estimation calculation framework, pre-battle contingency analysis, simulated disorder techniques, using captured enemy resources, reward and punishment system, unit subdivision and hierarchy, emergency retreat planning, occupying key positions, masking force strength, deception through displays, psychological warfare and provocation, reading environmental indicators, variability of tactics principle, operational secrecy management, tactical decision quality, energy and momentum management, campaigning on distant ground, prohibiting superstition for cohesion, mobilization and mustering, moral law concept, heaven as environmental factors, earth as operational geography, commander virtues framework, method and discipline construct, swift and heavy chariot organization, picul and li logistical units, mantlets and movable shelters, ramparts and mound siege works, halberds and battle-axes drill, drums gongs banners signaling, converted spies, inward spies, local spies, doomed spies, surviving spies, spy handling protocols, fire attack techniques, star-calendar for operations, wind and weather exploitation, water as tactical medium, anchoring and boat positioning, burning boats cooking-pots tactic, hiding disposition under disorder, baiting and enticement method, separating enemy forces, occupying intersecting highways, hemmed-in ground tactics, desperate ground tactics, entangling ground concept, accessible ground concept, temporizing ground concept, narrow pass defense, precipitous height control, camp placement sunny side rule, forced march effects, foraging on enemy principle, plunder allocation policy, attrition costs accounting, frontline reward prioritization, discipline enforcement protocols, leave outlet policy, avoid siege maxim, treat captured soldiers humanely, tactical use of noise and spectacle, reading dust and bird signs, maintaining lines of communication, concealment of dispositions, centralized versus delegated command, placing army beyond retreat\nCategories: military strategy, logistics and supply, intelligence studies, leadership studies, decision theory",
  "_note": "Showing 10 of 100 concepts"
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
  "total_concepts": 79,
  "primary_concepts": [
    "complexity software",
    "modular design",
    "abstraction",
    "information hiding",
    "information leakage",
    "deep module",
    "shallow module",
    "temporal decomposition",
    "dependencies",
    "obscurity"
  ],
  "related_concepts": [],
  "categories": [
    "software architecture",
    "software engineering",
    "systems engineering",
    "computer science education"
  ],
  "summary": "This book presents a comprehensive philosophy of software design, emphasizing principles for managing complexity through effective problem decomposition, modular abstractions, information hiding, and strategic practices like writing insightful comments and designing for clarity, drawn from the author's Stanford course on the subject.\n\nKey Concepts: complexity software, modular design, abstraction, information hiding, information leakage, deep module, shallow module, temporal decomposition, dependencies, obscurity, change amplification, cognitive load, unknown unknowns, strategic programming, tactical programming, investment mindset, tactical tornado, design it twice, write comments first, interface comment, implementation comment, general-purpose module, special-purpose module, pull complexity downwards, pass-through method, pass-through variable, decorator pattern, context object, classitis, getters and setters, defaults in interfaces, design patterns application, unit testing, test-driven development, exception handling, define errors out of existence, exception masking, exception aggregation, crash on fatal errors, designnotes file, information hiding within class, somewhat general-purpose design, different layer different abstraction, pass-through variable mitigation, method splitting and factoring, conjoined methods, repetition red flag, overexposure, red flags checklist, comments for intuition, comments for precision, naming precision, naming consistency, hard to pick name indicator, comments as a design tool, maintain comments near code, avoid documentation duplication, check diffs for docs, consistency enforcement, coding style guidelines, code should be obvious, event-driven programming readability, generic containers anti-pattern, performance aware design, measure before modifying, design around the critical path, microbenchmarking, buffer optimization case study, unix deletion semantics, java substring critique, tcl unset lesson, undo history pattern, separate general-purpose and special-purpose, bring together when information shared, interface versus implementation distinction, simplicity over features, abstraction depth evaluation, pull complexity upward avoid, error promotion\nCategories: software architecture, software engineering, systems engineering, computer science education",
  "_note": "Showing 10 of 79 concepts"
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
  "total_concepts": 146,
  "primary_concepts": [
    "systems thinking",
    "system definition",
    "stocks and flows",
    "feedback loop",
    "balancing feedback",
    "reinforcing feedback",
    "dynamic equilibrium",
    "delays in feedback",
    "buffer and capacity",
    "resilience"
  ],
  "related_concepts": [],
  "categories": [
    "systems thinking",
    "system dynamics",
    "sustainability science",
    "organizational management",
    "ecology",
    "complexity science",
    "environmental studies"
  ],
  "summary": "Thinking in Systems is a posthumously edited primer by Donella H. Meadows that introduces foundational concepts of systems thinking, including system structures, behaviors, surprises, traps, leverage points for intervention, and guidelines for living amid complexity, drawing from decades of systems dynamics research to empower readers in addressing real-world problems.\n\nKey Concepts: systems thinking, system definition, stocks and flows, feedback loop, balancing feedback, reinforcing feedback, dynamic equilibrium, delays in feedback, buffer and capacity, resilience, self-organization, hierarchy and modularity, system boundaries, behavior over time graph, archetypes of system structure, policy resistance, tragedy of the commons, shifting the burden and addiction, success to the successful, escalation dynamics, rule beating, seeking wrong goals, bounded rationality, satisficing behavior, information flow design, intrinsic responsibility, leverage points, parameters and constants, stock-and-flow structure, delay sensitivity, strength of balancing loops, strength of reinforcing loops, rules and incentives, paradigm and mindset, transcending paradigms, behavioral archetypes catalog, limits to growth, renewable resource constraint, nonrenewable resource depletion, overshoot and collapse, business cycles and inventory oscillation, perceived signal smoothing, reaction time and response smoothing, doubling time heuristic, supply and demand as feedback, externalities and missing feedback, privatization and regulation tradeoffs, feedback-rich monitoring, modeling and simulation, behavior-driven scenario analysis, mental models articulation, language shaping perception, time horizon expansion, ethical system design, living within limits, learning organizations, error-embracing experimentation, systems literacy education, fractal geometry and self-similarity, stock memory and momentum, nonlinearity and thresholds, dominance shifting, carrying capacity, co-evolution of systems and limits, system redesign and leverage sequencing, integrated policy packages, scenario robustness and uncertainty, ethical stewardship, participatory system governance, glossary of system definitions, model transparency and assumptions, leverage hierarchy, sustainable development, global modeling, environmental stewardship, cultural change through publishing, complexity, interdependence, planetary boundaries, ecological economics, citizen engagement, systems dynamics modeling, feedback loops, stocks and flows analysis, leverage points identification, organizational learning, scenario analysis, long-term forecasting, integrated assessment modeling, participatory modeling, policy analysis for sustainability, sustainability indicators, ecological footprinting, life cycle assessment, adaptive management, transdisciplinary education, environmental studies pedagogy, public science communication, environmental journalism, systems mapping, causal loop diagrams, boundary critique, social-ecological systems approach, model assumptions transparency, model validation and calibration, sensitivity analysis, network analysis for global issues, agent-based modeling, optimization under constraints, resource accounting, carrying capacity assessment, resilience assessment, commons governance, community-based sustainability planning, slow money investing, toxic chemistry awareness, food systems thinking, regenerative agriculture, ecological restoration methods, chemical exposure pathways, product stewardship, energy transition, carbon budget analysis, waste management techniques, sustainable finance instruments, farm fertility management, agroecology practices, demographic transition analysis, per capita resource use metrics, consumption pattern analysis, nonrenewable resource depletion modeling, renewable resource management, pollution accumulation dynamics, tipping points, exponential growth dynamics, delayed feedback effects, supply-demand feedback, permaculture principles, indicator-based evaluation, metric standardization for sustainability, participatory publishing strategies, catalog distribution channels, foreword as scholarly endorsement, column-based public reflection, educational outreach through books, interdisciplinary research translation\nCategories: systems thinking, system dynamics, sustainability science, organizational management, ecology, complexity science, environmental studies",
  "_note": "Showing 10 of 146 concepts"
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
  "total_concepts": 188,
  "primary_concepts": [
    "design pattern",
    "pattern template",
    "pattern naming",
    "intent section",
    "motivation section",
    "applicability section",
    "structure section",
    "participants",
    "collaborations",
    "consequences section"
  ],
  "related_concepts": [],
  "categories": [
    "object-oriented design",
    "software architecture",
    "human-computer interaction",
    "programming languages",
    "software engineering",
    "user interface design"
  ],
  "summary": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides an introduction to design patterns for object-oriented programming, a case study on designing a document editor, a detailed catalog of creational, structural, and behavioral patterns, discussions on their applications, and supplementary resources including a glossary, notation guide, foundation classes, and a preface to its CD-ROM edition.\n\nKey Concepts: design pattern, pattern template, pattern naming, intent section, motivation section, applicability section, structure section, participants, collaborations, consequences section, implementation section, sample code, known uses, related patterns, creational patterns, structural patterns, behavioral patterns, abstract factory, factory method, builder pattern, prototype pattern, singleton pattern, adapter pattern, bridge pattern, composite pattern, decorator pattern, facade pattern, flyweight pattern, proxy pattern, chain of responsibility, command pattern, interpreter pattern, iterator pattern, mediator pattern, memento pattern, observer pattern, state pattern, strategy pattern, template method, visitor pattern, mvc, glyph, recursive composition, composition versus inheritance, transparent enclosure, monoglyph, scroller, border decorator, compositor, composition glyph, formatting trade-off, discretionary glyph, spelling checking visitor, hyphenation visitor, iterator protocol, null iterator, preorder iterator, createiterator, traversal and traversal actions separation, visitor accept operation, double dispatch, command object, command history, reversible predicate, undo redo mechanism, memento interfaces, iterator state encapsulation, visitor tradeoffs, intrinsic state, extrinsic state, flyweight factory, clone semantics, prototype registry, parameterized factory method, factory as singleton, factory selection strategies, language influence on design, class versus object scope, class inheritance versus interface inheritance, program to an interface, favor composition over inheritance principle, delegation, mixin class, parameterized types, run time versus compile time structure, aggregation versus acquaintance, encapsulation, polymorphism, dynamic binding, software reuse mechanisms, delegation self-passing, reuse on levels: application toolkit framework, designing for change, causes of redesign, pattern selection process, how to use a pattern, pattern catalog organization, pattern interrelationships, notation and diagramming, foundation classes, lexi case study, document structure problem, formatting versus representation separation, embellishing user interface, supporting multiple look and feel, supporting multiple window systems, window implementation hiding, window system factory, ui controller as strategy, composition order effects, pluggable adapters, two way adapter, pattern community, hypertext edition, design patterns, object-oriented design, software architecture, separation of concerns, reusability, loose coupling, refactoring, pattern language, trade-offs and forces, glyphcontext, b-tree font mapping, glyphfactory, virtual proxy, remote proxy, protection proxy, smart reference, operator overloading for proxy, doesnotunderstand mechanism, copy-on-write, reference counting, invoker and receiver, macro command, undo and redo, simplecommand template, originator and caretaker, incremental mementos, abstract syntax tree, context object for interpretation, sharing terminal symbols, element accept operation, external iterator, internal iterator, polymorphic iterator factory, robust iterator, colleague classes, dialog director, subject and observer roles, push versus pull notification, change manager, chain of responsibility pattern, successor link, request as object, command chaining, state transitions, strategy as template parameter, template method pattern, hook operations, factory method pattern, factory patterns family, image proxy, imageptr, persistence and serialization, remote object identifiers, smart pointers and resource management, doesnotunderstand proxy pattern, unidraw command interpretation, thin client invoker, template-method inversion of control, dynamic dispatch limitations, iterators for composite structures, cursor-based iteration, memento-based iteration, observer reentrancy and consistency, aspect-based notification, change-coalescing, command logging for recovery, visitor traversal responsibility, toolkit and framework distinctions, iterators and exception safety, design vocabulary, black-box reuse, white-box reuse, role of documentation and examples, known uses and related patterns\nCategories: object-oriented design, software architecture, human-computer interaction, programming languages, software engineering, user interface design",
  "_note": "Showing 10 of 188 concepts"
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
    "totalDocuments": 22,
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
      "id": 3581925764,
      "name": "computer science education",
      "description": "Concepts and practices related to computer science education",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "computer science education"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 3753948276,
      "name": "decision theory",
      "description": "Concepts and practices related to decision theory",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "decision theory"
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
      "id": 1210583398,
      "name": "environmental studies",
      "description": "Concepts and practices related to environmental studies",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "environmental studies"
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
      "id": 1219398223,
      "name": "leadership studies",
      "description": "Concepts and practices related to leadership studies",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "leadership studies"
      ],
      "statistics": {
        "documents": 1,
        "chunks": 0,
        "concepts": 0
      },
      "relatedCategories": []
    },
    {
      "id": 1647311600,
      "name": "logistics and supply",
      "description": "Concepts and practices related to logistics and supply",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "logistics and supply"
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
      "id": 3405947310,
      "name": "systems engineering",
      "description": "Concepts and practices related to systems engineering",
      "aliases": [],
      "parent": null,
      "hierarchy": [
        "systems engineering"
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
    "totalConcepts": 0,
    "documentsReturned": 1
  },
  "documents": [
    {
      "title": "",
      "preview": "This excerpt from the introduction to Sun Tzu's \"The Art of War\" recounts the ancient Chinese strategist's biography, including his legendary demonstration of military discipline by drilling palace co...",
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
      "preview": "This book presents a comprehensive philosophy of software design, emphasizing principles for managing complexity through effective problem decomposition, modular abstractions, information hiding, and ...",
      "primaryConcepts": []
    },
    {
      "title": "",
      "preview": "This book, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" provides an introduction to design patterns for object-oriented programming, a case study on designing a document editor, a...",
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
    "timestamp": "2025-11-28T17:44:55.537Z"
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