# Concept Lexicon

## Executive Summary

Concepts curated from the knowledge base for the Concept-RAG project.

### Source Categories

| Category | Documents | Concepts |
|----------|-----------|----------|
| software engineering | 139 | 18,394 |
| software architecture | 48 | 8,941 |
| software testing | 13 | 2,318 |
| devops and site reliability | 9 | 1,547 |
| type systems | 4 | 678 |

---

## 1. Software Architecture

### Quality Attributes
- maintainability [4,5,13,17,19,20,26,27,29,37,38,39,42,43,51,53,55,57,63,65,97]
- abstraction [4,5,7,14,16,17,19,24,26,30,37,38,44,46,55,57,63,65,67,79,96,112]
- reliability [4,5,20,27,28,29,30,37,38,39,42,43,44,56,65,71,78,86]
- cohesion [1,4,5,8,12,27,30,53,55]
- testability [4,5,13,26,27,29,42,43,44,56,97]
- coupling [1,4,5,8,12,27,29,37,43,53,55]
- readability [4,13,17,33,107]
- reusability [4,5,8,43,53,55]
- extensibility [5,16,43]
- portability [4,5,16,20,55]

### Design Principles
- defensive programming [5,7,16,50,52,78,89]
- object-oriented design [4,5,16,54,63,65,77,82]
- naming conventions [4,5,15,101,113]
- coding standards [4,5,16,31]
- generic programming [16,33]
- liskov substitution principle [5,7,16,47,69]

---

## 2. Software Testing

### Test Types
- unit testing [1,2,3,4,5,6,7,8,10,11,13,14,15,16,17,21,22,24,28,30,31,34,35,36,45,46,47,49,50,51,52,54,59,64,65,68,69,70,72,73,75,77,82,84]
- integration testing [1,2,3,4,5,6,7,8,10,11,13,14,17,21,22,24,30,31,34,35,36,40,41,46,47,49,54,59,62,64,68,73,84,93]
- acceptance testing [1,2,3,5,7,13,17,24,31,45,47,64,72]
- regression testing [2,3,4,5,21,22,34,44,47,51,59,64,70,76,84]
- smoke testing [2,6,11,21,28]
- performance testing [2,6,22,28]
- usability testing [2,5,21,22,31,113]
- exploratory testing [2,3,8,22]
- component testing [2,3,22,41,45]
- nonfunctional testing [2,22]
- security testing [2,28]
- scalability testing [2,6,29]

### Test Practices
- test-driven development (tdd) [1,5,6,7,13,15,64]
- test-driven development [1,2,3,6,7,8,10,11,18,46,47,50,51]
- behaviour-driven development [1,15]
- behavior-driven development [2,3,15,41]
- property-based testing [1,47]
- test isolation [1,2,3,13,22,23,71,78]
- test coverage [1,2,3,6,8,9,10,18,22,23]
- test automation [2,3,5,6,7,8,13,22,69,78]
- test doubles [2,3,7,13]
- test fixtures [2,3,13,22]
- test harness [2,3,5,7,13,76]
- test data management [2,3,22]
- test automation pyramid [2]
- automated tests [1,2,3,7,10,12,18,22,41,59,62,69]
- unit tests [1,2,3,8,9,10,13,23,41,46,59,62,64]
- integration tests [1,2,3,8,9,10,13,23]
- smoke tests [2,3,22]
- component tests [2,3,22]
- characterisation test [1]
- parametrized tests [1]
- arrange-act-assert (aaa) [1,13]
- red-green-refactor [1,7]

### Test Organization
- walking skeleton [1,2,3,10]
- vertical slice [1]
- outside-in development [1]
- executable specifications [2,3,45]

---

## 3. Development Practices

### Collaboration
- pair programming [1,5,6,46,47,53]
- mob programming [1,6]
- code reviews [1,5,10,39,40]
- pull requests [1,10,40]
- collective code ownership [1,5,31]

### Code Quality
- refactoring [1,2,3,4,5,7,14,17,19,31,32,33,34,47,49,50,51,55,56,59,69]
- static analysis [2,3,5,60,78,89]
- static code analysis [2,3,15,28]
- cyclomatic complexity [1,4,15,27,53,69]
- technical debt [1,4,9,12,27,29,53]
- complexity management [1,4]
- code readability [1]
- small commits [1]

### Version Control
- version control [1,2,3,4,9,10,11,22,23,51]
- distributed version control [2,3,10,40]
- branching strategies [2,3,9,12,40]
- branching workflows [1,2,3,51]
- trunk-based development [1,2,3,8,9,10,11,12,33,50]
- semantic versioning [1,2,3,9,10,11,50,72]
- versioning [1,24,41]

---

## 4. DevOps & Site Reliability

### Continuous Integration/Delivery
- continuous integration [1,2,3,4,5,6,7,8,9,10,11,19,23,27,32,33,51]
- continuous integration (ci) [1,2,3,10,18,22,74]
- continuous delivery [1,2,3,8,9,10,11,23,41,53,85]
- continuous deployment [1,2,3,9,10,11,23]
- deployment pipeline [1,2,3,8,9,10,11,18,23,27,33,58,73]
- build automation [1,2,3,8,9,10,13,23,67]

### Deployment Strategies
- blue-green deployment [2,8,9,10,18]
- blue-green deployments [2,8,12]
- canary releases [1,2,12]
- canary releasing [2,3,8]
- rollback [2,3,4]

### Configuration & Infrastructure
- configuration management [2,3,4,8,22,23,24,28,29,40,65,67]
- configuration as code [2,3,10,23]
- infrastructure as code [2,3,6,8,10,11,23,104]
- declarative infrastructure [2,3]
- configuration drift [2,3]
- environment provisioning [2,3,23]
- infrastructure provisioning [2,3,18,74]

### Artifacts & Releases
- artifact promotion [2,3]
- artifact repository [2,3]
- deployment orchestration [2,3]
- database migration [2,3,11,68,88]

### Practices
- devops culture [2,6,40]
- continuous improvement [2,3,6,7,8]
- risk management [2,3,22,30,61,67,71,75,76,77,80,81,84,96,97,110]
- change management [2,3,22,30,53,54]
- dependency management [2,3,23,88]
- value stream mapping [2,3,8]
- cycle time [2,3]

### Monitoring
- monitoring and logging [2,3,11,23,61]
- latency [1,2,9,10,18,23,67,85]
- throughput [1,2,8,9,10,11,30,41,115]

---

## 5. Design Patterns & Architecture

### Architectural Patterns
- separation of concerns [1,4,26,27,29,32]
- decomposition [1,4,29,34,53]
- componentization [2,3,8,9,12]
- cross-cutting concerns [1]
- ports and adapters (hexagonal) architecture [1,2,12]
- strangler pattern [1,2]

### Design Patterns
- dependency injection [1,2,3,7,8,10,11,13,15,26,54,66,110]
- constructor injection [1,7,13,82]
- dependency inversion principle [1,7,26,54]
- repository pattern [1,7,26,54,82]
- decorator pattern [1,54]
- circuit breaker pattern [1,2,8,11,12,15]
- command-query responsibility segregation (cqrs) [1,11,41]
- command-query separation (cqs) [1]

### Domain Modeling
- domain model [1,14,29,41,57,67,75,77,81]
- value object [1,14]
- data transfer object (dto) [1,47]
- encapsulation [1,4,5,14,26,46,47]
- immutability [1,4,14,37,38,39]

### API Design
- postel's law [1]
- parse-don't-validate [1]
- guard clause [1]
- conway's law [1,15,46,59]

---

## 6. Type Systems & Type Safety

### Type Patterns
- type-driven design [33,49]
- newtype pattern [33,49]
- pattern matching [17,33,49,50]
- generics and parametric polymorphism [33,49]

### Error Handling
- error handling with result [33,49]
- custom error types [49,75]

### Functional Concepts
- closures [33,49,50]
- iterators and iterator adapters [49,50]

---

## 7. Reliability & Performance

### Reliability Patterns
- fault tolerance [2,17,27,28,34,35,36,54,56]
- availability [2,17,27,28,34,35,36,54,56,57,85]
- idempotence [2,35,54]
- exponential backoff with jitter [1,11,18,35]

### Performance
- performance optimization [1,8,17,18,67,85]
- scalability [1,2,8,9,11,17,27,29,35,37,38,39,42,43]
- caching [1,17,35,36,75,84]
- data locality [35,36]
- bloom filters [17,35,48]
- concurrency [17,35,36,48,49,50,52,71,83,85,92,102]
- consistency [17,35,37,38,39,48,56,57,78]

### Authentication
- authentication and authorization [1,6,8,9,18,59,60,106]

---

## 8. Development Features

### Feature Management
- feature flags [1,31]
- a/b testing [1,31]

### Build & Test Infrastructure
- automated acceptance testing [2,3]
- test orchestration [2,3]
- cloud computing [2,3,18,23]
- virtualization [2,23]

---

## Document Sources

1. Code That Fits in Your Head (Mark Seemann, 2021)
2. Continuous Delivery (Humble & Farley)
3. Continuous Delivery (Farley & Humble)
4. Code Complete (Steve McConnell, 1993)
5. Software Development, Design, and Coding (John F Dooley & Vera A Kazakova, 2024)
6. CI/CD Unleashed (Tommy Clark, 2025)
7. Test Driven Development for Embedded C
8. The DevOps Handbook (Gene Kim)
9. Building Microservices (Sam Newman)
10. Grokking Continuous Delivery (Christie Wilson, 2022)
11. Microservices Flexible Software Architecture (Eberhard Wolff, 2016)
12. Building Microservices (Sam Newman, 2015)
13. The Art of Unit Testing, 2nd Edition (Roy Osherove, 2013)
14. Domain-Driven Design (Eric Evans, 2003)
15. Introduction to Software Design and Architecture with TypeScript (Khalil Stemmler)
16. JSF AV rules
17. Beautiful Code (Andy Oram, Greg Wilson, et al.)
18. CI/CD Design Patterns (Garima Bajpai et al., 2024)
19. Refactoring (Martin Fowler, Kent Beck)
20. Software Requirements, 3rd Edition (Karl Wiegers, Joy Beatty, 2013)
21. Effective Software Testing (Elfriede Dustin, 2002)
22. Handbuch Automotive SPICE 4 (Alexander Levin et al., 2024)
23. Infrastructure as Code (Kief Morris, 2016)
24. The UML User Guide (Addison Wesley)
25. Clean Architecture (Robert C Martin, 2017)
26. Clean Architecture (Robert C Martin, 2017)
27. Fundamentals of Software Architecture (Mark Richards, Neal Ford, 2020)
28. Site Reliability Engineering (Betsy Beyer et al., 2016)
29. Software Architecture: The Hard Parts (Neal Ford et al., 2021)
30. Systems Analysis and Design (Scott R Tilley, Harry J Rosenblatt, 2016)
31. User Stories Applied (Mike Cohn, 2004)
32. Just Enough Software Architecture (George Fairbanks, 2010)
33. Software Architecture for Developers (Simon Brown, 2022)
34. The Rust Programming Language, 2nd Edition (Steve Klabnik, Carol Nichols, 2022)
35. AntiPatterns (Malveau et al., 2001)
36. Distributed Systems for Practitioners (Dimos Raptis, 2020)
37. Distributed Systems with Node.js (Thomas Hunter II, 2021)
38. SQL Antipatterns (Bill Karwin, Jacquelyn Carter)
39. Designing Data-Intensive Applications (Martin Kleppmann, 2015)
40. Designing Data-Intensive Applications (Martin Kleppmann, 2017)
41. DevOps Unleashed with Git and GitHub (Yuki Hattori, 2024)
42. Microservices Patterns (Chris Richardson, 2018)
43. Software Architecture: The Hard Parts (Neal Ford et al., 2021)
44. Software Architecture: The Hard Parts (Neal Ford et al., 2021)
45. Software Requirements Engineering, 2nd Edition
46. The Clean Coder (Robert C Martin, 2011)
47. The Pragmatic Programmer (Andrew Hunt, David Thomas, 2019)
48. The Pragmatic Programmers - Interface Oriented Design
49. Command-Line Rust (Ken Youens-Clark, 2022)
50. Database System Concepts ISE (Abraham Silberschatz et al., 2019)
51. Programming Rust (Jim Blandy, 2020)
52. The Pragmatic Programmer (Andy Hunt, David Thomas)
53. Embedded C - Traps And Pitfalls
54. Fundamentals of Software Architecture (Neal Ford, Mark Richards, 2020)
55. Head First - Design Patterns
56. Head First Software Architecture (Gandhi, Richards, Ford, 2024)
57. Refactoring at Scale (Maude Lemaire, 2020)
58. Refactoring to Rust (Lily Mara, Joel Holmes, 2024)
59. Zero to Production in Rust (Luca Palmieri, 2024)
60. UML - Understanding The UML
61. UML Reference Manual (Addison Wesley)
62. Database Internals (Alex Petrov, 2019)
63. Design It! (Michael Keeling, 2017)
64. Machine Learning Production Systems (Robert Crowe et al., 2024)
65. The Engineering Design of Systems (Dennis M Buede, William D Miller)
66. The Software Engineer's Guidebook (Gergely Orosz, 2024)
67. UML 2 for Dummies
68. arc42 by Example (Gernot Starke et al., 2023)
69. Building Secure and Reliable Systems (Heather Adkins, 2020)
70. Database Reliability Engineering (Laine Campbell, Charity Majors, 2017)
71. Design Patterns: Elements of Reusable Object-Oriented Software (Gang of Four)
72. Learning Domain-Driven Design (Vladik Khononov, 2021)
73. Refactoring for Software Design Smells (Samarthyam et al., 2015)
74. Agile Model-Based Systems Engineering Cookbook (Dr Bruce Powel Douglass, 2022)
75. Building Decentralized Trust (Victoria L Lemieux, Chen Feng, 2021)
76. CMP Books - Embedded Systems Design
77. Distributed Computing, 16th International Conference
78. Enterprise Integration Patterns (Frank Leymann, Dieter Roller, 1999)
79. Fundamentals of Smart Contracts Security (Richard Ma et al.)
80. Mastering GitHub Actions (Eric Chapman, 2024)
81. Prentice Hall - Applying UML and Patterns, 2nd Ed
82. Project Management Body of Knowledge PMBOK Guide, 5th Ed
83. Rust Programming by Example (Guillaume Gomez, 2018)
84. Continuous Integration and Continuous Delivery (Henry van Merode, 2023)
85. Database Systems: The Complete Book (Hector Garcia-Molina et al., 2008)
86. Mastering TypeScript, 4th Edition (Nathan Rozentals, 2021)
87. Network Programming with Rust (Abhishek Chanda, 2018)
88. Node.js Design Patterns (Mario Casciaro, Artie Ng, 2014)
89. Sams - Teach Yourself UML in 24 Hours, 3rd Ed
90. Systems, Functions and Safety (Milan Z Bjelica)
91. The Art of Software Security Assessment (Mark Dowd et al., 2006)
92. Transaction Processing (Jim Gray, Andreas Reuter)
93. A Discipline for Software Engineering (Watts S Humphrey)
94. UML Distilled, 3rd Ed (Addison Wesley, 2003)
95. Automating DevOps with GitLab CI/CD Pipelines (Christopher Cowell et al., 2023)
96. BABOK v3.0 (IIBA, 2015)
97. Concurrency Control and Recovery in Database Systems (Philip A Bernstein et al.)
98. Cracking the Coding Interview (Gayle Laakmann McDowell, 2015)
99. Learning GitHub Actions (Brent Laster, 2023)
100. Mastering Blockchain, 2nd Edition (Imran Bashir, 2018)
101. Needs, Requirements, Verification, Validation Lifecycle (INCOSE, 2022)
102. Observability Engineering (Charity Majors et al., 2022)
103. Programming Rust, 3rd Ed (Jim Blandy et al., 2025)
104. Requirements Engineering (Axel van Lamsweerde, 2009)
105. RESTful Web APIs (Richardson, Amundsen, Ruby, 2013)
106. Rust for Blockchain Application Development (Akhil Sharma, 2024)
107. Rust for Rustaceans (Jon Gjengset, 2021)
108. Systems Engineering: Fifty Lessons Learned (Howard Eisner, 2021)
109. The C4 Model (Simon Brown, 2022)
110. Understanding Distributed Systems (Roberto Vitillo, 2021)
111. UML Tutorial - Finite State Machines
112. Agile Model-Based Systems Engineering Cookbook (Dr Bruce Powel Douglass, 2021)
113. Asynchronous Programming in Rust (Carl Fredrik Samson, 2024)
114. Atomic Transactions (Lynch, Merritt, Weihl)
115. Building Blockchain Apps (Michael Juntao Yuan, 2019)
116. Ethereum for Architects and Developers (Debajani Mohanty, 2018)
117. Functional Safety From Scratch (Peter Clarke, 2023)
118. Measure What Matters (John Doerr, 2018)
119. Node.js Web Development (David Herron, 2016)
120. Prentice Hall - Applying UML and Patterns
121. Solidity Programming Essentials, 2nd Ed (Ritesh Modi, 2022)
122. Systems Engineering: System Design Principles (Dahai Liu, 2016)
123. Systems Performance (Brendan Gregg, 2020)
124. The Art of Designing Embedded Systems (Jack G Ganssle, 2008)
125. Visual Models for Software Requirements (Joy Beatty, Anthony Chen, 2012)
126. Writing Effective Use Cases (Addison Wesley)
127. The UML and Data Modeling
128. A Philosophy of Software Design (John Ousterhout, 2019)
129. Applying Design for Six Sigma (Eric Maass, Patricia D McNair, 2009)
130. Data Modeling Essentials, 3rd Edition (Graeme C Simsion, 2004)
131. Database Modeling and Design (H V Jagadish et al., 2011)
132. Embedded C
133. Embedded Controller Hardware Design
134. Embedded Microprocessor Systems: Real World Design
135. Essential TypeScript 5, 3rd Edition (Adam Freeman, 2023)
136. Abstract State Machines (Springer, 2003)
137. Peer-to-Peer Systems and Applications
138. Programming TypeScript (Boris Cherny, 2019)
139. Rust in Action (T S McNamara, 2020)
140. Safety Critical Systems Handbook (David J Smith, 2010)
141. Software Telemetry (Jamie Riedesel, 2021)
142. Solidity Programming Essentials (Ritesh Modi, 2018)
143. Systems Engineering Models (Adedeji B Badiru, 2019)
144. Systems Engineering and Artificial Intelligence (2021)
145. Test Driven Development by Example (Kent Beck)
146. The Rust Performance Book
147. UML Notation Guide
148. UML Tutorial - Complex Transitions
149. Utilizing Vector Databases to Enhance RAG Models
150. Learning SQL (Alan Beaulieu, 2020)
151. Mastering Blockchain (Imran Bashir, 2020)
152. Mastering Blockchain (Imran Bashir, 2023)
