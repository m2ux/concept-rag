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
- maintainability [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]
- abstraction [2,3,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]
- reliability [5,7,8,9,10,11,12,13,14,15,16,17,18,19,20]
- cohesion [2,3,4,5,6,7,8,9,10,11,12,13,14,15]
- testability [1,2,4,5,7,8,9,10,11,12,13,14,27,28]
- coupling [2,3,4,5,6,7,8,9,10,11,12,14]
- readability [5,29,16,30,31,32,26]
- reusability [2,4,9,10,11,12,14]
- extensibility [2,4,9,10,11,12,14]
- portability [5]

### Design Principles
- defensive programming [5,10,11,18,19,26]
- object-oriented design [2,5,6,9,10,12,14,21,33]
- naming conventions [5,6,30,34,35]
- coding standards [5,15,36]
- generic programming [15,26,37]
- liskov substitution principle [15,38,39,40,27]

---

## 2. Software Testing

### Test Types
- unit testing [41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61]
- integration testing [41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63]
- acceptance testing [41,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,14]
- regression testing [44,49,63]
- smoke testing [45,47,63]
- performance testing [43,44,47,63,64]
- usability testing [43,44,47,63,65]
- exploratory testing [43,47,63]
- component testing [45,47,63,64]
- nonfunctional testing [47]
- security testing [47]
- scalability testing [47]

### Test Methodologies
- test-driven development (tdd) [49,66,27,67,51,52,53,68,69,70,71]
- test-driven development [49,66,4,27,67,51,52,53,68,69,70]
- behaviour-driven development [49]
- behavior-driven development [49]
- property-based testing [49,27]
- test isolation [49,66,27]
- test coverage [49,66,27,47,54]
- test automation [45,42,47,48,55,54,50,57,63,72,73,74,75,76,77]
- test doubles [49,27]
- test fixtures [49,27]
- test harness [49,47,27]
- test data management [49,47]
- test automation pyramid [45,47,78,79,80,27]
- automated tests [45,47,81,55,79,80,82,27]
- unit tests [5,45,47,27,83]
- integration tests [45,47,27]
- smoke tests [45,47,27]
- component tests [45,47,78,80,27]
- characterisation test [27]
- parametrized tests [27]
- arrange-act-assert (aaa) [27]
- red-green-refactor [27,49,66,84,4,67,51,52,53,69,70,85]
- walking skeleton [49,66,86]
- vertical slice [49,66,87,88]
- outside-in development [49,66,34]
- executable specifications [49,66]

---

## 3. Development Practices

### Collaboration
- pair programming [49,66,84,5,68,70,85]
- mob programming [49,66,68,70]
- code reviews [49,66,68,88]
- pull requests [49,66,68,88,57]
- collective code ownership [49,66,68]

### Code Quality
- refactoring [3,6,9,21,34,38,40,45,47,49,66,51,52,57,72,85,89,90,91,92]
- static analysis [45,47,41,48,63,34,93]
- static code analysis [49,66,38,80,47,93]
- cyclomatic complexity [5,49,66,38]
- technical debt [49,66,38,47,78,80,85]
- complexity management [3,6,49,66,91]
- code readability [49,66]
- small commits [49,66,70,94]

---

## 4. Version Control & DevOps

### Version Control
- version control [3,45,41,42,47,48,49,66,57,55,63,74,75,95,96,97,98,99,50]
- distributed version control [49,66,68,70]
- branching strategies [49,66,68,70,100,101]
- branching workflows [49,66,68]
- trunk-based development [49,66,68,88,94]
- semantic versioning [45,49,66,27,47,102,78,79,80]
- versioning [3,45,47,102,80,78,74,75]

### CI/CD
- continuous integration [41,42,45,47,48,55,63,74,75,78,79,80,81,88,95,96,97,103,104]
- continuous integration (ci) [45,47,72,105]
- continuous delivery [45,47,81,55,78,79,80,105,106,107]
- continuous deployment [45,47,81,55,78,79,80,88,108,95,96,97,109,110]
- deployment pipeline [45,47,81,55,78,79,80,88,108,95,96,97,109,110,111]
- build automation [45,47,81,55,78,79,80,81,88,95,96,108,97,109,112]
- blue-green deployment [3,45,81,55,78,79,80,95,96,110]
- blue-green deployments [45,81,55,78,79,80]
- canary releases [45,81,55,78,79,80,27]
- canary releasing [45,81,55,78,79,80]
- rollback [45,81,78,79,80,81,55,95,96,97]
- configuration management [3,45,41,42,47,48,55,63,74,75,78,79,95,96,97,98,99,113,114,115]
- configuration as code [45,47,55,78,79]
- infrastructure as code [45,3,49,66,27,47,102,78,79,80,116]
- declarative infrastructure [45,47,78,117,80]
- configuration drift [45,47,78,79,117,80]
- environment provisioning [45,47,78,79,80]
- infrastructure provisioning [45,47,78,79,80]
- artifact promotion [45,47,78,79,80]
- artifact repository [45,47,78,79,80,81,88,55]
- deployment orchestration [45,3,47,78,79,80,55,70,116]
- database migration [45,47,78,79,80,94,27,102,116]

### DevOps Culture
- devops culture [45,47,78,79,80,55,70]
- continuous improvement [41,42,45,47,48,55,63,75,76,77,78,79,98,99,113,114,115,118,119]
- risk management [41,42,45,47,48,55,63,75,76,77,78,79,98,99,113,114,115,118,119,120,121,122]
- change management [41,42,45,47,48,55,63,72,75,76,77,78,79,98,99,113,114,115,118,119]
- dependency management [3,49,66,10,21,34,45,47,78,79,80,86,91]
- value stream mapping [45,64,81,123]
- cycle time [45,47,64,81,65,123]

---

## 5. Architecture Patterns

### Structural Patterns
- separation of concerns [2,3,4,5,7,8,9,10,11,12,14,15,34,124]
- decomposition [3,4,7,8,9,10,11,12,42,45,47,48,55,63,72,75,76,86,91,102,113]
- componentization [2,3,4,7,8,9,10,11,12]
- cross-cutting concerns [3,6,34,38,91]
- ports and adapters (hexagonal) architecture [49,66,45,7,8,38,9,10,18,19,86]
- strangler pattern [3,4,45,49,66,21]
- dependency injection [2,4,5,6,9,11,21,27,49,66,125]
- constructor injection [49,66,34]
- dependency inversion principle [34,49,66]
- repository pattern [3,4,6,10,21,27,34,126]
- decorator pattern [4,6,9,21,27,34]
- circuit breaker pattern [4,7,8,18,19,21]

### Data Patterns
- command-query responsibility segregation (cqrs) [4,7,8,18,19]
- command-query separation (cqs) [4,7,8]
- domain model [3,4,6,9,21,27,49,66,126]
- value object [49,66,21,126]
- data transfer object (dto) [4,7,8,34]
- encapsulation [2,3,4,5,6,7,8,9,10,11,12,14,15,21,34]
- immutability [49,66,126]
- postel's law [49,66,34]
- parse-don't-validate [49,66]
- guard clause [49,66]
- conway's law [3,45,21,45,47,55,78,79,80,86]

---

## 6. Type Systems & Functional Patterns

### Type-Driven Design
- type-driven design [2,49,66,34,27]
- newtype pattern [37,26]
- pattern matching [37,26,94]
- generics and parametric polymorphism [37,26]
- error handling with result [37,26]
- custom error types [37,26]
- option type [37]
- closures [37,26]
- iterators and iterator adapters [37]

---

## 7. Reliability & Resilience

### Fault Tolerance
- fault tolerance [7,8,9,10,11,12,18,19,127,128,129,130,131,132,133,134]
- availability [7,8,9,10,11,12,18,19,127,128,129,130,131,132,133,134,135,136,137,138,139]
- idempotence [7,8,128,132,140,138]
- exponential backoff with jitter [128,132,140]

### Performance
- performance optimization [66,4,29,45,34,18,19,67,10,86]
- scalability [3,4,7,8,9,10,11,12,18,19,127,128,132,136,138,139,141,142,143,144,145]
- caching [7,8,9,10,11,12,18,19,27,128,132,136,138,141,146,147,148,149]
- data locality [128,130,131,132]
- bloom filters [128,130,131]
- concurrency [5,128,129,130,131,132,133,134,136,137,145,150]
- consistency [7,8,128,129,130,131,132,133,134,137,145,151,152,153]
- authentication and authorization [116,49,66,45,47,34,141,143,154,155]

---

## 8. Feature Management & Observability

### Feature Management
- feature flags [3,45,47,78,79,80,81,88,55,156,81,95,96,97,108,109,110]
- a/b testing [45,47,81,55,78,79]

### Monitoring
- monitoring and logging [3,45,41,42,47,48,55,63,70,75,76,77,78,79,98,99,116,113,114,115,118,157]
- latency [7,8,9,10,127,128,132,136,138,141,143]
- throughput [7,8,9,10,127,128,132,136,138,141,145]

---

## 9. Operational Practices

### Testing Operations
- automated acceptance testing [45,81,55,78,79]
- test orchestration [45,81,55,78,79,80,27]
- cloud computing [45,47,55,78,79,80,81,88,95,96,97,108,109,116,158]
- virtualization [45,47,55,78,79,80,116]

---

## Document Sources

References in square brackets map to source numbers below.

1. UML Tutorial - Finite State Machines
2. A Philosophy of Software Design (John Ousterhout)
3. Building Microservices (Sam Newman)
4. Code That Fits in Your Head (Mark Seemann)
5. Code Complete (Steve McConnell)
6. Domain-Driven Design (Eric Evans)
7. Fundamentals of Software Architecture (Mark Richards, Neal Ford)
8. Head First Software Architecture (Gandhi, Richards, Ford)
9. Software Architecture: The Hard Parts (Neal Ford, Mark Richards et al.)
10. Software Development, Design, and Coding (John F. Dooley, Vera A. Kazakova)
11. SQL Antipatterns (Bill Karwin)
12. Systems Analysis and Design (Scott R. Tilley, Harry J. Rosenblatt)
13. Database Systems: The Complete Book (Garcia-Molina, Ullman, Widom)
14. The Pragmatic Programmers - Interface Oriented Design
15. JSF-AV rules
16. Refactoring to Rust (Joel Holmes, Lily Mara)
17. The Engineering Design of Systems (Dennis M. Buede, William D. Miller)
18. Designing Data-Intensive Applications (Martin Kleppmann)
19. Software Requirements (Karl Wiegers, Joy Beatty)
20. UML 2 for Dummies
21. Learning Domain-Driven Design (Vladik Khononov)
22. Just Enough Software Architecture (George Fairbanks)
23. Network Programming with Rust (Abhishek Chanda)
24. Data Modeling Essentials (Graeme C. Simsion, Graham C. Witt)
25. The UML User Guide
26. The Rust Programming Language (Steve Klabnik, Carol Nichols)
27. Test Driven Development for Embedded C
28. Effective Software Testing (Elfriede Dustin)
29. Command-Line Rust (Ken Youens-Clark)
30. Software Development, Design, and Coding (John F. Dooley)
31. The C4 Model for Visualising Software Architecture (Simon Brown)
32. User Stories Applied (Mike Cohn)
33. UML Reference Manual
34. Introduction to Software Design and Architecture with TypeScript (Khalil Stemmler)
35. Mastering GitHub Actions (Eric Chapman)
36. Embedded C
37. Programming Rust (Jim Blandy)
38. Refactoring for Software Design Smells (Samarthyam, Sharma, Suryanarayana)
39. Clean Architecture (Robert C. Martin)
40. AntiPatterns (Malveau, Brown, McCormick)
41. A Discipline for Software Engineering (Watts S. Humphrey)
42. Software Requirements Engineering, 2nd Edition
43. Handbuch Automotive SPICE 4.0
44. Site Reliability Engineering (Google)
45. Continuous Delivery (Humble, Farley)
46. Distributed Systems with Node.js (Thomas Hunter II)
47. Effective Software Testing (Elfriede Dustin)
48. Embedded C - Traps And Pitfalls
49. Code That Fits in Your Head (Mark Seemann)
50. Rust Programming by Example (Guillaume Gomez)
51. The Art of Unit Testing (Roy Osherove)
52. The Clean Coder (Robert C. Martin)
53. The DevOps Handbook (Gene Kim)
54. The Pragmatic Programmer (Andrew Hunt, David Thomas)
55. Grokking Continuous Delivery (Christie Wilson)
56. Building Decentralized Trust
57. Cracking the Coding Interview (Gayle Laakmann McDowell)
58. Microservices Patterns (Chris Richardson)
59. Systems, Functions and Safety (Milan Z. Bjelica)
60. CI/CD Design Patterns (Garima Bajpai et al.)
61. CI/CD Unleashed (Tommy Clark)
62. Mastering TypeScript (Nathan Rozentals)
63. Continuous Integration (CI) and Continuous Delivery (CD) (Henry van Merode)
64. The Software Engineer's Guidebook (Gergely Orosz)
65. Software for Use (Larry L. Constantine, Lucy A.D. Lockwood)
66. Test Driven Development by Example (Kent Beck)
67. Domain-Driven Design (Eric Evans)
68. Refactoring (Martin Fowler, Kent Beck)
69. Applying Design for Six Sigma (Eric Maass, Patricia D. McNair)
70. Building Secure and Reliable Systems (Heather Adkins)
71. Software Architecture for Developers (Simon Brown)
72. Fundamentals of Smart Contracts Security
73. Cmp Books - Embedded Systems Design
74. The Art of Designing Embedded Systems (Jack G. Ganssle)
75. Project Management Body of Knowledge (PMBOK)
76. Requirements Engineering (Axel van Lamsweerde)
77. Safety Critical Systems Handbook
78. Infrastructure as Code (Kief Morris)
79. Microservices: Flexible Software Architecture (Eberhard Wolff)
80. Design It! (Michael Keeling)
81. The DevOps Handbook (Gene Kim)
82. Utilizing Vector Databases to Enhance RAG Models
83. Database Reliability Engineering (Laine Campbell, Charity Majors)
84. Beautiful Code (Andy Oram, Greg Wilson)
85. The Software Engineer's Guidebook (Gergely Orosz)
86. Refactoring at Scale (Maude Lemaire)
87. Continuous Delivery (Humble, Farley)
88. DevOps Unleashed with Git and GitHub (Yuki Hattori, Isabel Drost-Fromm)
89. Addison Wesley - UML Distilled, 3rd Ed
90. Agile Model-Based Systems Engineering Cookbook
91. Arc42 by Example (Gernot Starke et al.)
92. Mastering GitHub Actions (Eric Chapman)
93. The Art of Software Security Assessment
94. Zero to Production in Rust (Luca Palmieri)
95. Automating DevOps with GitLab CI/CD Pipelines
96. Learning GitHub Actions (Brent Laster)
97. Machine Learning Production Systems (Robert Crowe et al.)
98. BABOK v.3.0
99. Dictionary Of Financial And Business Terms
100. Observability Engineering (Charity Majors et al.)
101. Measure What Matters (John Doerr)
102. Database Reliability Engineering (Laine Campbell, Charity Majors)
103. Database Systems: The Complete Book
104. Needs, Requirements, Verification, Validation Lifecycle
105. Functional Safety From Scratch (Peter Clarke)
106. Systems Engineering: Fifty Lessons Learned (Howard Eisner)
107. Systems Engineering: System Design Principles and Models (Dahai Liu)
108. Mastering GitHub Actions (Eric Chapman)
109. Solidity Programming Essentials (Ritesh Modi)
110. Building Blockchain Apps (Michael Juntao Yuan)
111. Head First - Design Patterns
112. Node.js Design Patterns (Mario Casciaro, Artie Ng)
113. Security Engineering (Ross Anderson)
114. Systems Engineering and Artificial Intelligence
115. (ebook pdf) - Project Management
116. Database Reliability Engineering (Laine Campbell, Charity Majors)
117. Agile Model-Based Systems Engineering Cookbook
118. Elliott Wave Techniques Simplified
119. The Trader's Classroom Collection
120. Fundamentals of Smart Contracts Security
121. Ethereum for Architects and Developers (Debajani Mohanty)
122. Mastering Blockchain (Imran Bashir)
123. Essential TypeScript 5 (Adam Freeman)
124. Node.js Web Development (David Herron)
125. Prentice Hall - Applying UML and Patterns
126. Microservices Patterns (Chris Richardson)
127. Enterprise Integration Patterns (Frank Leymann, Dieter Roller)
128. Designing Data-Intensive Applications (Martin Kleppmann)
129. Distributed Computing (DISC Conference)
130. Database Internals (Alex Petrov)
131. Database System Concepts (Silberschatz, Korth, Sudarshan)
132. Distributed Systems for Practitioners (Dimos Raptis)
133. Rust in Action (T.S. McNamara)
134. Transaction Processing (Jim Gray, Andreas Reuter)
135. Atomic Transactions (Lynch, Merritt, Weihl)
136. Understanding Distributed Systems (Roberto Vitillo)
137. RESTful Web APIs (Richardson, Amundsen, Ruby)
138. Software Architecture: The Hard Parts (Neal Ford et al.)
139. Systems Performance (Brendan Gregg)
140. Concurrency Control and Recovery in Database Systems
141. Software Telemetry (Jamie Riedesel)
142. Database Modeling and Design (Jagadish et al.)
143. Mastering Blockchain - Second Edition (Imran Bashir)
144. Rust for Blockchain Application Development (Akhil Sharma)
145. Peer-to-Peer Systems and Applications
146. Asynchronous Programming in Rust (Carl Fredrik Samson)
147. Harvard Business Review - How to Write a Great Business Plan
148. Cryptography: Algorithms, Protocols, and Standards (Zoubir Z. Mammeri)
149. Agentic Design Patterns (Antonio Gulli)
150. Learning SQL (Alan Beaulieu)
151. Rust for Rustaceans (Jon Gjengset)
152. The Rust Performance Book
153. Notes on the Synthesis of Form (Christopher Alexander)
154. Building Secure and Reliable Systems (Heather Adkins)
155. Node.js Web Development (David Herron)
156. Data Science: The Hard Parts (Daniel Vaughan)
157. Observability Engineering (Charity Majors et al.)
158. Solidity Programming Essentials (Ritesh Modi)
