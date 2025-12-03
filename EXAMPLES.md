# Concept-RAG Examples

Practical usage scenarios demonstrating the power of conceptual search. Each example shows real queries, expected results, and best practices.

## Table of Contents

- [Example 1: Literature Review](#example-1-literature-review)
- [Example 2: Strategic Planning Research](#example-2-strategic-planning-research)
- [Example 3: Technical Documentation Search](#example-3-technical-documentation-search)
- [Example 4: Competitive Analysis](#example-4-competitive-analysis)
- [Example 5: Learning & Education](#example-5-learning--education)
- [Example 6: Content Creation](#example-6-content-creation)
- [Example 7: Library Exploration with Categories](#example-7-library-exploration-with-categories)
- [Example 8: Concept Attribution Research](#example-8-concept-attribution-research)
- [Complete Workflow Examples](#complete-workflow-examples)

---

## Example 1: Literature Review

### Scenario
You're a researcher studying innovation in organizations and have 50 academic papers in your database.

### Step 1: Discover Relevant Papers

**Query**: "What documents do I have about innovation?"

**Tool**: `catalog_search`

**Response**:
```
Found 8 documents:

1. "Organizational Innovation: A Meta-Analysis" (2018)
   Preview: This comprehensive review examines 150 studies on organizational 
   innovation, identifying key factors that drive innovative behavior...
   Concepts: innovation management, organizational behavior, meta-analysis
   
2. "Innovation Diffusion in Complex Systems" (2020)
   Preview: Explores how innovations spread through organizational networks
   using agent-based modeling...
   Concepts: diffusion of innovations, network effects, complexity theory
   
3. "Creative Destruction and Firm Survival" (2019)
   ...
```

### Step 2: Extract Key Concepts

**Query**: "Extract concepts from 'Organizational Innovation: A Meta-Analysis'"

**Tool**: `extract_concepts`

**Response**:
```markdown
# Concepts from Organizational Innovation: A Meta-Analysis

## Primary Concepts (15)
1. organizational innovation
2. innovative behavior
3. innovation management
4. organizational culture
5. creative climate
...

## Technical Terms (45)
1. innovation propensity
2. absorptive capacity
3. knowledge spillover
...

## Related Concepts (68)
1. organizational learning
2. change management
3. competitive advantage
...
```

### Step 3: Research Specific Concept

**Query**: "Find information about absorptive capacity"

**Tool**: `concept_search`

**Response**:
```
Found 12 chunks discussing "absorptive capacity":

1. [Score: 1.000] From: "Organizational Innovation: A Meta-Analysis"
   "Absorptive capacity—the ability to recognize, assimilate, and apply 
   external knowledge—emerged as the strongest predictor of innovation 
   success (r = 0.68, p < 0.001)..."
   
2. [Score: 0.950] From: "Knowledge Transfer in Multinational Firms"
   "Prior research on absorptive capacity suggests that organizations must 
   develop specific routines for identifying, interpreting, and integrating 
   new knowledge..."
```

### Step 4: Compare Across Documents

**Query**: "What do my documents say about the relationship between organizational culture and innovation?"

**Tool**: `broad_chunks_search`

**Response**:
```
Top 10 results across 8 documents:

1. "Organizational Innovation: A Meta-Analysis"
   "Our analysis reveals that organizational culture explains 34% of variance 
   in innovation outcomes, with psychological safety and risk tolerance as 
   key mediators..."
   
2. "Culture's Consequences for Innovation"
   "Hierarchical cultures suppress innovation by discouraging experimentation, 
   while clan cultures promote innovation through collaboration..."
```

### Value
- **Systematic review**: Discover all relevant papers
- **Concept mapping**: Understand the conceptual landscape
- **Cross-document synthesis**: Compare findings across studies
- **Citation discovery**: Find specific claims to cite

---

## Example 2: Strategic Planning Research

### Scenario
You're preparing a strategic plan and researching military strategy principles (Sun Tzu, Clausewitz, Boyd).

### Research Workflow

#### Query 1: Discover Strategy Documents
```
"Find documents about military strategy"
→ catalog_search
```

**Result**: 3 books found
- Sun Tzu's Art of War
- Clausewitz's On War  
- Boyd's Patterns of Conflict

#### Query 2: Extract Strategy Concepts
```
"Extract concepts from Sun Tzu's Art of War as markdown"
→ extract_concepts
```

**Result**: 126 concepts including:
- Primary: strategic positioning, deception tactics, force multiplication
- Technical: terrain analysis, morale factors, information advantage
- Related: leadership principles, resource allocation, timing

#### Query 3: Research Deception
```
"deception tactics"
→ concept_search
```

**Result**: 23 chunks across documents showing how different strategists approach deception.

#### Query 4: Compare Leadership Approaches
```
"What do these documents say about leadership in high-stakes situations?"
→ broad_chunks_search
```

**Result**: Cross-document comparison of leadership principles:
- Sun Tzu: Lead by example, adapt to circumstances
- Clausewitz: Maintain clarity of purpose under uncertainty
- Boyd: Operate inside opponent's decision cycle

#### Query 5: Deep Dive - Sun Tzu on Deception
```
catalog_search("Sun Tzu") → get source path
chunks_search("deception", source="/path/to/sun_tzu.pdf")
```

**Result**: All passages where Sun Tzu discusses deception tactics.

### Application
**Strategic Plan Section**: "Competitive Positioning"
- Use deception concepts → market positioning
- Use terrain analysis → competitive landscape
- Use force multiplication → resource leverage

### Value
- **Timeless principles**: Apply ancient wisdom to modern business
- **Multi-source synthesis**: Combine insights from multiple strategists
- **Conceptual framework**: Build strategic thinking vocabulary
- **Practical application**: Translate concepts to business context

---

## Example 3: Technical Documentation Search

### Scenario
You're a software engineer with 200+ technical PDFs (architecture docs, API specs, design patterns).

### Use Case: API Integration

#### Query 1: Find Authentication Docs
```
"authentication API documentation"
→ catalog_search
```

**Result**: 5 relevant documents
- OAuth 2.0 Implementation Guide
- API Security Best Practices
- Authentication Service Architecture
- JWT Token Standards
- Zero Trust Architecture

#### Query 2: Search Within OAuth Docs
```
catalog_search("OAuth 2.0") → get source
chunks_search("refresh token expiration", source="/path/to/oauth_guide.pdf")
```

**Result**: Specific sections about refresh token handling.

#### Query 3: Cross-Reference Security Patterns
```
"What security patterns are recommended for API authentication?"
→ broad_chunks_search
```

**Result**: Security recommendations from multiple docs:
- Token rotation strategies
- Rate limiting patterns
- Encryption requirements
- Session management

### Use Case: Debugging

#### Query 1: Find Error Handling Patterns
```
"error handling"
→ concept_search
```

**Result**: All documented error handling approaches across your docs.

#### Query 2: Specific Error Code
```
"status code 429 rate limiting"
→ broad_chunks_search
```

**Result**: Documentation sections explaining 429 errors and rate limiting strategies.

### Value
- **Fast lookups**: Find specific technical details instantly
- **Pattern discovery**: Identify consistent patterns across docs
- **Best practices**: Compare approaches across documentation
- **Onboarding**: Help new team members explore documentation

---

## Example 4: Competitive Analysis

### Scenario
You're analyzing 15 competitor whitepapers, case studies, and annual reports.

### Analysis Workflow

#### Query 1: Identify Competitor Documents
```
"What documents do I have?"
→ catalog_search
```

**Result**: List of all competitor documents with summaries.

#### Query 2: Extract Strategic Concepts
For each major competitor:
```
"Extract concepts from [Competitor A whitepaper]"
→ extract_concepts
```

**Result**: Concept maps for each competitor showing their strategic focus areas.

#### Query 3: Comparative Analysis
```
"What are companies saying about cloud migration?"
→ broad_chunks_search
```

**Result**: How different competitors position cloud services.

```
"digital transformation"
→ concept_search  
```

**Result**: Specific mentions of digital transformation across all competitors.

#### Query 4: Identify Gaps
Compare concept lists:
- Competitor A: 45 concepts about AI/ML
- Competitor B: 12 concepts about AI/ML  
- Your company: 8 concepts about AI/ML

**Insight**: Competitor A is positioning heavily on AI—potential threat or partnership opportunity?

### Deliverable: Competitive Intelligence Report

**Sections**:
1. **Concept frequency analysis**: What topics each competitor emphasizes
2. **Positioning differences**: How competitors differentiate
3. **Strategic themes**: Emerging patterns across the market
4. **Gap analysis**: Where your company differs

### Value
- **Systematic analysis**: Comprehensive view of competitive landscape
- **Trend identification**: Spot emerging themes
- **Positioning insights**: Understand competitive differentiation
- **Strategic planning**: Inform your own strategy

---

## Example 5: Learning & Education

### Scenario
You're a student with textbooks, lecture notes, and research papers (80+ documents).

### Exam Preparation

#### Query 1: Topic Overview
```
"What documents cover machine learning?"
→ catalog_search
```

**Result**: 12 relevant documents with summaries.

#### Query 2: Concept Inventory
```
"Extract concepts from 'Introduction to Machine Learning'"
→ extract_concepts
```

**Result**: Complete concept list for study guide:
- Supervised learning, unsupervised learning, reinforcement learning
- Neural networks, decision trees, SVM
- Overfitting, regularization, cross-validation

#### Query 3: Concept Deep Dive
```
"overfitting"
→ concept_search
```

**Result**: Every mention of overfitting across all documents—perfect for understanding the concept deeply.

#### Query 4: Cross-Topic Connections
```
"How is regularization used to prevent overfitting?"
→ broad_chunks_search
```

**Result**: Explanations from multiple sources showing different perspectives.

### Research Paper Writing

#### Query 1: Literature Survey
```
"neural network optimization techniques"
→ broad_chunks_search
```

**Result**: Relevant sections from multiple papers.

#### Query 2: Find Specific Studies
```
catalog_search("Adam optimizer") → identify papers
chunks_search("convergence rate", source="/path/to/paper.pdf")
```

**Result**: Specific results about convergence rates.

### Value
- **Efficient studying**: Find information across all materials quickly
- **Concept mastery**: See concepts explained from multiple angles
- **Exam prep**: Generate comprehensive study guides
- **Research**: Systematic literature review

---

## Example 6: Content Creation

### Scenario
You're a writer with research materials (50+ documents) for a book on innovation.

### Writing Workflow

#### Query 1: Chapter Planning
```
"What concepts relate to organizational innovation?"
→ Extract concepts from multiple documents
```

**Result**: Comprehensive concept map for structuring chapters.

#### Query 2: Find Supporting Examples
```
"case studies of successful innovation"
→ broad_chunks_search
```

**Result**: Real-world examples from your research materials.

#### Query 3: Quote Discovery
```
chunks_search("innovation paradox", source="/path/to/book.pdf")
```

**Result**: Specific passages to quote or reference.

#### Query 4: Verify Claims
```
"What do my sources say about innovation failure rates?"
→ broad_chunks_search
```

**Result**: Multiple sources discussing failure rates—ensure accuracy.

### Blog Post Research

#### Query 1: Topic Exploration
```
"design thinking"
→ concept_search
```

**Result**: All mentions of design thinking for comprehensive coverage.

#### Query 2: Find Statistics
```
"innovation ROI statistics"
→ broad_chunks_search
```

**Result**: Data points and statistics from your research.

### Value
- **Research efficiency**: Find relevant material quickly
- **Comprehensive coverage**: Don't miss important sources
- **Accuracy**: Verify claims against your sources
- **Citation management**: Easily find what to cite

---

## Example 7: Library Exploration with Categories

### Scenario
You want to explore your document library without knowing exactly what you're looking for.

### Step 1: Discover Available Categories

**Query**: "What categories of documents do I have?"

**Tool**: `list_categories`

**Response**:
```
Found 15 categories:

Summary Statistics:
- Total categories: 15
- Root categories: 8  
- Total documents: 127

Categories (sorted by document count):
1. Software Engineering (45 documents, 2,340 chunks)
   - Description: Software design, architecture, and development
   - Aliases: software development, programming
   - Children: Design Patterns, Testing, Architecture
   
2. Machine Learning (28 documents, 1,890 chunks)
   - Description: ML algorithms, deep learning, AI
   - Aliases: ML, artificial intelligence, AI
   
3. Business Strategy (18 documents, 1,120 chunks)
   ...
```

### Step 2: Browse a Category

**Query**: "Show me all software engineering documents"

**Tool**: `category_search`

**Response**:
```
Category: Software Engineering
Description: Software design, architecture, and development
Hierarchy: Root > Software Engineering
Aliases: software development, programming

Statistics:
- Documents: 45
- Chunks: 2,340
- Unique concepts: 890

Documents (showing 10 of 45):

1. "Clean Architecture" by Robert C. Martin
   Preview: A comprehensive guide to software architecture principles...
   Primary concepts: dependency rule, boundaries, use cases
   
2. "Design Patterns" by Gang of Four
   Preview: Catalog of reusable object-oriented software design patterns...
   Primary concepts: factory pattern, observer pattern, singleton
   
3. "Domain-Driven Design" by Eric Evans
   ...
```

### Step 3: Analyze Category Concepts

**Query**: "What concepts are discussed in software engineering documents?"

**Tool**: `list_concepts_in_category`

**Response**:
```
Category: Software Engineering
Total unique concepts: 890
Showing top 30 by document count:

1. dependency injection (appears in 32 documents, weight: 0.95)
2. design patterns (appears in 28 documents, weight: 0.92)
3. clean architecture (appears in 24 documents, weight: 0.88)
4. SOLID principles (appears in 22 documents, weight: 0.85)
5. unit testing (appears in 20 documents, weight: 0.82)
6. microservices (appears in 18 documents, weight: 0.78)
...
```

### Complete Library Exploration Workflow

```
Step 1: Get overview
  list_categories → see all subject areas

Step 2: Browse interesting category
  category_search("software engineering") → see documents

Step 3: Understand domain vocabulary
  list_concepts_in_category("software engineering") → see key concepts

Step 4: Deep dive on concept
  concept_search("dependency injection") → find passages

Step 5: Research specific document
  chunks_search("constructor injection", source="/path/to/book.pdf")
```

### Value
- **Systematic exploration**: Navigate your library by subject area
- **Discover hidden gems**: Find documents you forgot you had
- **Understand coverage**: See what topics are well-represented
- **Build domain knowledge**: Learn the vocabulary of each subject area

---

## Example 8: Concept Attribution Research

### Scenario
You're writing a paper and need to cite sources for specific concepts. You need to know which documents discuss each concept.

### Step 1: Find Sources for a Concept (Union)

**Query**: "Which books discuss dependency injection?"

**Tool**: `source_concepts`

**Response**:
```
Concept: "dependency injection"
Found in 8 documents:

1. "Clean Architecture" by Robert C. Martin (2017)
   /documents/clean_architecture.pdf
   Summary: Comprehensive guide to software architecture...
   Primary concepts: dependency rule, boundaries, clean architecture
   Categories: Software Engineering, Architecture
   
2. "Dependency Injection in .NET" by Mark Seemann (2019)
   /documents/di_dotnet.pdf
   Summary: In-depth exploration of DI patterns...
   Primary concepts: DI containers, composition root, pure DI

3. "Design Patterns" by Gang of Four (1994)
   ...
```

### Step 2: Find Sources for Multiple Concepts

**Query**: "Which documents discuss both TDD and DI?"

**Tool**: `source_concepts` (with array)

**Input**:
```json
{
  "concept": ["test driven development", "dependency injection"],
  "include_metadata": true
}
```

**Response**:
```
Searching for 2 concepts: TDD, dependency injection
Found 12 documents (union):

Sources matching both concepts (2):
1. "Clean Architecture" by Robert C. Martin
   Matches: test driven development [0], dependency injection [1]
   
2. "Growing Object-Oriented Software" by Freeman & Pryce
   Matches: test driven development [0], dependency injection [1]

Sources matching 1 concept:
3. "Test Driven Development" by Kent Beck
   Matches: test driven development [0]
   
4. "Dependency Injection in .NET" by Mark Seemann
   Matches: dependency injection [1]
...
```

### Step 3: Compare Per-Concept Sources

**Query**: "I need separate source lists for TDD vs BDD"

**Tool**: `concept_sources`

**Input**:
```json
{
  "concept": ["test driven development", "behavior driven development"],
  "include_metadata": false
}
```

**Response**:
```
Per-concept source arrays:

[0] "test driven development" (5 sources):
  - Test Driven Development by Kent Beck
  - Clean Architecture by Robert C. Martin
  - Growing Object-Oriented Software by Freeman & Pryce
  - Refactoring by Martin Fowler
  - Working Effectively with Legacy Code by Michael Feathers

[1] "behavior driven development" (3 sources):
  - BDD in Action by John Ferguson Smart
  - Specification by Example by Gojko Adzic
  - Growing Object-Oriented Software by Freeman & Pryce
```

### Source Attribution Decision Tree

```
Need to find sources for concepts?
│
├── Single concept or merged list
│   └── source_concepts (returns union with concept_indices)
│   Example: "Which books mention microservices?"
│
└── Separate lists per concept
    └── concept_sources (returns array of arrays)
    Example: "Compare sources: TDD vs BDD vs ATDD"
```

### Value
- **Accurate citations**: Know exactly which sources discuss each concept
- **Research thoroughness**: Ensure comprehensive coverage
- **Comparative analysis**: See which sources cover multiple concepts
- **Bibliography building**: Generate per-concept source lists

---

## Complete Workflow Examples

### Workflow 1: Systematic Literature Review

```
Step 1: Discover
  "What documents do I have about [topic]?"
  → catalog_search

Step 2: Map Landscape
  For each key document:
    "Extract concepts from [document]"
    → extract_concepts

Step 3: Identify Themes
  Compare concept lists across documents
  Identify common themes and unique perspectives

Step 4: Deep Research
  For each theme:
    "[theme concept]"
    → concept_search
    
Step 5: Synthesize
  "What do sources say about [specific question]?"
  → broad_chunks_search
  
Step 6: Document Findings
  Use extracted concepts and search results to structure review
```

### Workflow 2: Expert Knowledge Extraction

```
Step 1: Find Expert Sources
  "documents by [expert name]"
  → catalog_search

Step 2: Extract Expertise
  "Extract concepts from [expert's work]"
  → extract_concepts
  
Step 3: Map Expert's Framework
  Analyze concept categories and relationships
  
Step 4: Find Key Ideas
  For each major concept:
    "[concept]"
    → concept_search within expert's work
    
Step 5: Cross-Reference
  "What other authors say about [expert's key concept]?"
  → broad_chunks_search
  
Step 6: Build Mental Model
  Create concept map of expert's thinking
```

### Workflow 3: Decision Support Research

```
Step 1: Identify Decision Criteria
  "What factors influence [decision type]?"
  → broad_chunks_search
  
Step 2: Extract Decision Framework
  "Extract concepts from [methodology document]"
  → extract_concepts
  
Step 3: Gather Evidence
  For each criterion:
    "[criterion]"
    → concept_search
    
Step 4: Find Case Studies
  "case studies of [decision scenario]"
  → broad_chunks_search
  
Step 5: Compare Approaches
  chunks_search across multiple methodology documents
  
Step 6: Make Informed Decision
  Use evidence and frameworks from research
```

---

## Tips for Effective Usage

### 1. Start Broad, Then Narrow

✅ **Good**:
```
1. catalog_search("strategy") → identify documents
2. extract_concepts("Sun Tzu") → map concepts
3. concept_search("deception") → deep dive
```

❌ **Less Effective**:
```
1. broad_chunks_search("everything about strategy")
   → Too broad, overwhelming results
```

### 2. Use the Right Tool

✅ **Good**:
```
- "innovation" → concept_search (high precision)
- "What documents?" → catalog_search
- "how do organizations innovate?" → broad_chunks_search
```

❌ **Less Effective**:
```
- "innovation" → broad_chunks_search (lower precision)
- "how do organizations innovate?" → concept_search (expects concept, not question)
```

### 3. Build on Previous Results

✅ **Good**:
```
1. catalog_search → get source paths
2. chunks_search with specific source
3. Refine based on results
```

❌ **Less Effective**:
```
1. Random searches without context
2. Not using source information
```

### 4. Extract Concepts Early

✅ **Good**:
```
1. First session: extract_concepts for key documents
2. Use concept lists to guide further research
3. Concept maps inform your understanding
```

❌ **Less Effective**:
```
1. Search without understanding document concepts
2. Miss important conceptual relationships
```

---

## Real-World Success Stories

### Academic Researcher
**Before**: 2 weeks to manually review 40 papers  
**After**: 3 days with Concept-RAG, deeper insights

"Concept extraction revealed connections I would have missed. The ability to search by concept rather than keyword transformed my literature review process."

### Product Manager
**Before**: 5 hours searching competitor docs  
**After**: 1 hour, more comprehensive analysis

"I extracted concepts from 15 competitor whitepapers and immediately saw their positioning strategies. The concept comparison became the foundation of our competitive strategy."

### Technical Writer
**Before**: 30 minutes to find each specific detail  
**After**: < 1 minute per lookup

"Having 200 technical docs indexed conceptually means I can find any detail instantly. Documentation research that used to take hours now takes minutes."

---

## Next Steps

1. **Try these examples**: Adapt to your use case
2. **Experiment**: Discover what works best for your documents
3. **Share**: Tell us your success stories!

See also:
- [USAGE.md](USAGE.md) - Tool details and workflows
- [API Reference](docs/api-reference.md) - Complete tool specifications and selection guide
- [FAQ.md](FAQ.md) - Common questions

---

**Have a great example?** [Share it!](https://github.com/m2ux/concept-rag/discussions)

