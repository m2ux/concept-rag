# Concept Lexicon

## Executive Summary

Concepts curated from the knowledge base for the Concept-RAG project, organized by source category. Each concept is placed under the category from which it was derived, with source references linking to the numbered source list at the end of this document.
# Source Categories
## 1. Software Engineering

- maintainability [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]
- abstraction [27,3,28,29,5,6,30,8,31,12,15,32,17,33,20,34,35,36,37]
- reliability [5,8,9,38,7,11,39,18,19,20,40,12,41,16]
- cohesion [27,42,3,5,6,43,11,44,20,41,45,46]
- testability [1,2,4,5,7,11,18,19,20,21,47,48]
- coupling [27,42,3,5,6,43,49,11,18,19,20]
- readability [50,3,5,51,11,6,48,52]
- reusability [53,3,5,6,7,15,8,38]
- extensibility [27,2,3,5,7,15,11,51]
- portability [5,10,15,20]
- defensive programming [5,54,15,20,55,21,56,57]
- object-oriented design [5,15,58,20,7,59,20,60]
- naming conventions [5,51,13,15,20,61]
- coding standards [5,15,62,4,20]
- generic programming [15,63,26]
- liskov substitution principle [15,20,21,48,64]
- scalability [42,65,66,67,8,9,44,7,68,18,19,20,46,69,70,41,37,71]
- fault tolerance [28,72,73,74,38,8,9,75,11,18,19,20,69,76,77]
- availability [78,73,74,8,9,11,75,43,18,19,20,41,77]
- concurrency [79,80,30,74,81,8,9,82,83,84,69,85,86]
- consistency [79,80,30,74,87,8,9,88,89,90,82,18,19,20,69,91,41,77,86]
- idempotence [92,93,30,74,8,9,82,18,19,20]
- exponential backoff with jitter [82,8,9]
- performance optimization [95,65,93,94,53,5,55,96,97,98,21,99,46,26,77]
- caching [3,55,8,9,99,41]
- data locality [80,30,74,8,9,100,18,19,20]
- bloom filters [30,74,8,9,82,88]
- authentication and authorization [55,93,74,96,18,19,101,21,69,102,64,57]

---

## 2. Software Architecture

- separation of concerns [28,4,7,11,13,18,19,20,103,12]
- decomposition [29,4,13,61,55,104,20,41,46]
- componentization [42,65,67,104,55,96,18,19,20]
- cross-cutting concerns [55,104,20]
- ports and adapters (hexagonal) architecture [4,13,55,18,19,20,103]
- strangler pattern [42,4,55,104,96,69]
- dependency injection [2,4,12,13,55,21]
- constructor injection [55,21]
- dependency inversion principle [4,55,21,64]
- repository pattern [55,7,21]
- decorator pattern [55,7,12,13,64]
- circuit breaker pattern [42,3,55,105,82,43,96,18,19]
- command-query responsibility segregation (cqrs) [4,55,96,105,18,19,20]
- command-query separation (cqs) [4,55,96,18,19,20]
- domain model [42,3,55,28,29,31,43,105,106]
- value object [55,31,105,17,106]
- data transfer object (dto) [55,64]
- encapsulation [27,28,29,4,7,13,55,12,14,41,86]
- immutability [80,30,74,81,8,9,88,89,90,87,107,96,18,108,69,86]
- postel's law [55,64]
- parse-don't-validate [55,48]
- guard clause [55,48,26]
- conway's law [74,55,96,104,18,64,41,109,110,86]
- checklists [55]
- git [55,111,11,20]
- branching workflows [65,55,111,112]
- test orchestration [55,48,21]

---

## 3. Software Testing

- unit testing [28,50,2,4,5,7,11,13,96,43,18,19,20,21,47,113,48,114,77]
- integration testing [28,2,66,65,5,11,96,43,18,19,20,21,113,53,41,77]
- acceptance testing [28,50,3,55,74,5,94,20,41,115,103,12]
- regression testing [5,74,47,113,41]
- smoke testing [67,5,74,47]
- performance testing [74,47,113]
- usability testing [74,55,94,47,103,115,116]
- exploratory testing [74,113,117,41]
- component testing [42,67,5,74,55,96,105,20,21]
- nonfunctional testing [74,55,21]
- security testing [80,74,55,21,57]
- scalability testing [74,55,20]
- test-driven development (tdd) [95,72,4,55,96,62,98,21,114,77]
- test-driven development [3,55,5,31,29,48,21]
- behaviour-driven development [55,48]
- behavior-driven development [55,64]
- property-based testing [55,48,26]
- test isolation [55,48,21]
- test coverage [66,55,74,5,47,113,21]
- test automation [52,74,66,65,94,113,20,55,118]
- test doubles [55,48,21]
- test fixtures [74,55,21,48]
- test harness [42,67,74,55,96,105,20,21]
- test data management [42,74,55,96,20,21]
- test automation pyramid [55,74,96,112,109]
- automated tests [55,74,96,112,18]
- unit tests [42,74,55,96,21]
- integration tests [42,74,55,105,96]
- smoke tests [74,55]
- component tests [42,74,55,96]
- characterisation test [74,55,21,48]
- parametrized tests [55,48]
- arrange-act-assert (aaa) [55,21]
- red-green-refactor [55,21]
- walking skeleton [55,48,21,26]
- vertical slice [55,48,109]
- outside-in development [55,74,96,112,21]
- executable specifications [74,55,31,29,119,36]
- refactoring [120,121,66,3,4,5,55,31,29,62,17,122,114,21,48,26,123]
- static analysis [124,65,66,74,55,104,57]
- static code analysis [74,55,7,11,18]
- cyclomatic complexity [42,72,4,55,104,96,118]
- technical debt [42,3,55,74,96,104,109,64]
- complexity management [55,74,96,112,104,109,26]
- code readability [55,74,96,112,104,109]
- small commits [42,74,55,96,112,111,119,109]
- pair programming [67,55,74,96,104,109,62,125]
- mob programming [67,55,111]
- code reviews [67,55,111,62,125]
- pull requests [67,55,111,62,125,37]
- collective code ownership [55,74,96,112,109]

---

## 4. DevOps and Site Reliability

- continuous integration [28,50,2,66,65,72,10,5,74,55,94,104,43,96,126,112,62,114,21,48,109,123,127,77]
- continuous integration (ci) [128,42,65,67,5,72,10,74,55,104,82,43,96,105,126,112,62,20,114,21,123,77]
- continuous delivery [28,50,66,65,72,3,42,74,55,129,7,43,96,105,126,112,62,109,123,77]
- continuous deployment [42,67,74,55,43,96,105,112,104]
- deployment pipeline [42,74,55,72,3,5,74,129,96,105,112,114,21]
- build automation [128,42,74,55,96,112,119,130,77]
- blue-green deployment [42,74,55,43,96,126,112,102]
- blue-green deployments [42,74,55,43,126,21]
- canary releases [42,74,55,129,43,96,105,112]
- canary releasing [42,74,55,43,112]
- rollback [67,5,74,55,111,130]
- configuration management [28,29,5,74,55,131,104,43,116,126,132,133,62,36,41,134,135,136,46]
- configuration as code [42,42,72,74,55,129,104,43,96,126,109,77]
- infrastructure as code [55,42,74,129,111,130,100,41]
- declarative infrastructure [74,55,130]
- configuration drift [74,55,130]
- environment provisioning [74,55]
- artifact promotion [42,65,66,74,55,129,104,112]
- artifact repository [74,55,112,62,130]
- deployment orchestration [74,55,82,137,43]
- database migration [74,55,138,130,43,126,70]
- devops culture [42,42,74,55,96,130,43,41]
- continuous improvement [95,28,50,139,72,74,55,140,141,94,104,20,62,109]
- risk management [139,142,72,50,143,55,144,104,133,131,145,62,36,41,146,147,142,148,149,150,46]
- change management [27,139,72,28,50,74,55,144,104,151,131,143,62,36,46]
- dependency management [120,42,67,74,55,96,152,112,17]
- value stream mapping [55,141,109]
- cycle time [42,72,3,5,55,74,47,17,127]
- version control [28,50,74,55,94,104,43,116,62,36,41,46]
- distributed version control [74,55,130]
- branching strategies [55,111]
- trunk-based development [42,67,55,96,153,112]
- semantic versioning [55,42,96,105]
- versioning [28,29,55,7,11,43,96,126,18,19,101]
- feature flags [42,65,55,129,43,96,112]
- a/b testing [55,74,141,109]
- monitoring and logging [74,55,141,109,126]
- latency [42,42,55,74,96,105,82,100]
- throughput [128,42,42,72,55,74,96,105,82,126,112,43,102,62,70,77]
- automated acceptance testing [74,55,21]
- cloud computing [128,80,74,8,9,88,100,154,155]
- virtualization [74,55,130]

---

## 5. Type Systems

- type-driven design [55,156,13,48]
- newtype pattern [63,26]
- pattern matching [63,26,157]
- generics and parametric polymorphism [63,158,26]
- error handling with result [63]
- custom error types [63,26]
- option type [63,85]
- closures [3,54,159,63,84,17,85,86,26]
- iterators and iterator adapters [63,160,17,85,26]
- memory safety [63,158,17,85,86,26]
- zero-cost abstractions [63,158,17,85,86,26]
- move semantics [161,63,158,17,85,162,26]
- lifetimes [63,158,17,85,162,26]
- borrowing [63,158,17,162,26]
- ownership [63,17,162]

---

## Document Sources

The numbered references correspond to the source documents from which concepts were derived.

1. UML Tutorial - Finite State Machines
2. Arc42 by Example: Software Architecture Documentation — Starke, Simons, Zörner, Müller (2023)
3. Beautiful Code: Leading Programmers Explain How They Think — Oram, Wilson, Bentley, Kernighan
4. Clean Architecture: A Craftsman's Guide to Software — Robert C. Martin (2017)
5. Code Complete — Steve McConnell (1993)
6. Database Systems: The Complete Book — Garcia-Molina, Ullman, Widom (2008)
7. Design Patterns: Elements of Reusable Object-Oriented — Gamma, Helm, Johnson, Vlissides (2016)
8. Designing Data-Intensive Applications — Martin Kleppmann (2015)
9. Designing Data-Intensive Applications — Martin Kleppmann (2017)
10. Embedded C - Traps And Pitfalls
11. Fundamentals of Software Architecture — Richards, Ford (2020)
12. Head First - Design Patterns
13. Head First Software Architecture — Gandhi, Richards, Ford (2024)
14. Introduction to Software Design and Architecture with TypeScript — Khalil Stemmler
15. JSF-AV rules
16. Refactoring: Improving the Design of Existing Code — Fowler, Beck
17. Refactoring to Rust — Holmes, Mara (2024)
18. Software Architecture: The Hard Parts — Ford, Richards, Sadalage, Dehghani (2021)
19. Software Architecture: The Hard Parts — Ford, Richards, Sadalage, Dehghani (2021 epub)
20. Software Development, Design, and Coding — Dooley, Kazakova (2024)
21. Test Driven Development for Embedded C
22. The Art of Unit Testing — Roy Osherove (2013)
23. The Engineering Design of Systems — Buede, Miller
24. The Rust Programming Language, 2nd Edition — Klabnik, Nichols (2022)
25. Software Requirements (3rd Edition) — Wiegers, Beatty (2013)
26. The Pragmatic Programmer: Your Journey to Mastery — Hunt, Thomas (2019)
27. Understanding The UML (ebook - pdf)
28. The UML User Guide — Addison Wesley
29. UML Reference Manual — Addison Wesley
30. Database Internals — Alex Petrov (2019)
31. Domain-Driven Design — Eric Evans (2003)
32. Network Programming with Rust — Abhishek Chanda (2018)
33. Sams - Teach Yourself UML in 24 Hours (2004)
34. Software Requirements Engineering, 2nd Edition — Thayer, Dorfman
35. SQL Antipatterns — Bill Karwin
36. Visual Models for Software Requirements — Beatty, Chen (2012)
37. Zero to Production in Rust — Luca Palmieri (2024)
38. Distributed Computing: 16th International Conference
39. Enterprise Integration Patterns — Leymann, Roller (1999)
40. Systems, Functions and Safety — Milan Z. Bjelica
41. The Pragmatic Programmers - Interface Oriented Design (2006)
42. Building Microservices — Sam Newman
43. Microservices: Flexible Software Architecture — Eberhard Wolff (2016)
44. Fundamentals of Software Architecture: A Comprehensive Guide — Ford, Richards (2020)
45. Systems Analysis and Design — Tilley, Rosenblatt (2016)
46. Site Reliability Engineering — Beyer, Jones, Petoff (2016)
47. Effective Software Testing — Elfriede Dustin (2002)
48. Code That Fits in Your Head — Mark Seemann (2021)
49. Code That Fits in Your Head — Mark Seemann (2021)
50. A Discipline for Software Engineering — Watts S. Humphrey
51. Command-Line Rust — Ken Youens-Clark (2022)
52. hungarian (embedded coding standards)
53. Writing Effective Use Cases — Addison Wesley
54. Embedded C
55. Continuous Delivery — Humble, Farley
56. The Art of Designing Embedded Systems — Jack G. Ganssle (2008)
57. The Art of Software Security Assessment — Dowd, McDonald, Schuh (2006)
58. Cracking the Coding Interview — Gayle Laakmann McDowell (2015)
59. Prentice Hall, Applying UML and Patterns, 2Ed
60. UML 2 for Dummies
61. The C4 Model for Visualising Software Architecture — Simon Brown (2022)
62. The Clean Coder — Robert C. Martin (2011)
63. Programming Rust — Jim Blandy (2020)
64. Software Architecture for Developers — Simon Brown (2022)
65. CI/CD Design Patterns — Bajpai, Schildmeijer, Mishra (2024)
66. CI/CD Unleashed — Tommy Clark (2025)
67. Cmp Books - Embedded Systems Design
68. Machine Learning Production Systems — Crowe, Hapke, Caveness, Zhu (2024)
69. Understanding Distributed Systems — Roberto Vitillo (2021)
70. Database Reliability Engineering — Campbell, Majors (2017)
71. The Software Engineer's Guidebook — Gergely Orosz (2024)
72. Building Secure and Reliable Systems — Heather Adkins (2020)
73. Just Enough Software Architecture — George Fairbanks (2010)
74. Continuous Delivery — Farley, Humble (DevOps edition)
75. Learning Domain-Driven Design — Vladik Khononov (2021)
76. Systems Performance — Brendan Gregg (2020)
77. The Pragmatic Programmer — Hunt, Thomas (2nd edition)
78. Applying Design for Six Sigma — Maass, McNair (2009)
79. Atomic Transactions in Concurrent and Distributed Systems — Lynch, Merritt, Weihl
80. Concurrency Control and Recovery in Database Systems — Bernstein, Hadzilacos, Goodman
81. Database System Concepts ISE — Silberschatz, Korth, Sudarshan (2019)
82. Distributed Systems with Node.js — Thomas Hunter II (2021)
83. Distributed Systems for Practitioners — Dimos Raptis (2020)
84. Asynchronous Programming in Rust — Carl Fredrik Samson (2024)
85. Rust for Rustaceans — Jon Gjengset (2021)
86. Transaction Processing: Concepts and Techniques — Gray, Reuter
87. Maths & Stats - Abstract State Machines (2003)
88. Mastering Blockchain — Imran Bashir (2018)
89. Mastering Blockchain (3rd edition) — Imran Bashir (2020)
90. Mastering Blockchain (4th edition) — Imran Bashir (2023)
91. Software for Use — Constantine, Lockwood (1999)
92. Automating DevOps with GitLab CI/CD Pipelines — Cowell, Lotz, Timberlake (2023)
93. Grokking Continuous Delivery — Christie Wilson (2022)
94. User Stories Applied — Mike Cohn (2004)
95. Applying Design for Six Sigma — Maass, McNair (2009)
96. Microservices Patterns — Chris Richardson (2018)
97. Mastering TypeScript — Nathan Rozentals (2021)
98. Test Driven Development by Example — Kent Beck
99. Infrastructure as Code — Kief Morris (2016)
100. Systems Engineering and Artificial Intelligence — Lawless, Mittu (2021)
101. RESTful Web APIs — Richardson, Amundsen, Ruby (2013)
102. Observability Engineering — Majors, Fong-Jones, Miranda (2022)
103. Needs, Requirements, Verification, Validation Lifecycle — INCOSE (2022)
104. Refactoring at Scale — Maude Lemaire (2020)
105. Microservices Patterns — Chris Richardson (2018)
106. Microservices Patterns — Chris Richardson (2018)
107. Rust in Action (MEAP) — T.S. McNamara (2020)
108. Software Architecture: The Hard Parts (Engineering edition)
109. The DevOps Handbook — Gene Kim
110. Measure What Matters — John Doerr (2018)
111. DevOps Unleashed with Git and GitHub — Hattori, Drost-Fromm (2024)
112. Grokking Continuous Delivery — Christie Wilson (2022)
113. Effective Software Testing — Elfriede Dustin (2002)
114. Test Driven Development for Embedded C
115. Systems Engineering: System Design Principles and Models — Dahai Liu (2016)
116. The Engineering Design of Systems — Buede, Miller
117. The Pragmatic Programmer (Russian edition)
118. Systems, Functions and Safety — Milan Z. Bjelica
119. Software Requirements Engineering — Thayer, Dorfman
120. UML Distilled, 3rd Ed — Addison Wesley (2003)
121. AntiPatterns — Malveau, Brown, McCormick (2001)
122. Refactoring for Software Design Smells — Samarthyam, Sharma, Suryanarayana (2015)
123. Design It! — Michael Keeling (2017)
124. Building Blockchain Apps — Michael Juntao Yuan (2019)
125. Handbuch Automotive SPICE 4.0 — Levin, Benning, Lehmann (2024)
126. Mastering GitHub Actions — Eric Chapman (2024)
127. Continuous Integration (CI) and Continuous Delivery (CD) — Henry van Merode (2023)
128. Automating DevOps with GitLab CI/CD Pipelines — Cowell, Lotz, Timberlake (2023)
129. Continuous Delivery — Humble, Farley (original edition)
130. Infrastructure as Code — Kief Morris (2016)
131. Functional Safety From Scratch — Peter Clarke (2023)
132. Safety Critical Systems Handbook — David J. Smith (2010)
133. Systems Engineering Models — Badiru
134. Systems Engineering: Fifty Lessons Learned — Howard Eisner (2021)
135. Requirements Engineering — Axel van Lamsweerde (2009)
136. Rust Programming by Example — Guillaume Gomez (2018)
137. Learning GitHub Actions — Brent Laster (2023)
138. Learning SQL — Alan Beaulieu (2020)
139. BABOK v.3.0 — IIBA (2015)
140. PMBOK Guide, 5th Ed
141. The DevOps Handbook — Gene Kim
142. The Trader's Classroom Collection
143. Fundamentals of Smart Contracts Security — Ma, Gorzny, Zulkoski (2018)
144. Security Engineering — it-ebooks (2017)
145. Dictionary Of Financial And Business Terms
146. Elliott Wave Techniques Simplified — Bennett A. McDowell (2015)
147. The Elliott Wave Writings — Frost, Russell (2017)
148. Project Management Practitioner's Handbook
149. 10 Minute Guide To Project Management
150. The Little Black Book of Project Management
151. Database Reliability Engineering — Campbell, Majors (2017)
152. Essential TypeScript 5 — Adam Freeman (2023)
153. Continuous Integration (CI) and Continuous Delivery (CD) — Henry van Merode (2023)
154. Utilizing Vector Databases to Enhance RAG Models
155. Peer-to-Peer Systems and Applications — Steinmetz, Wehrle
156. Node.js Design Patterns — Casciaro, Ng (2014)
157. Rust Programming by Example — Guillaume Gomez (2018)
158. Programming Rust Fast, Safe Systems Development, 3rd Ed — Blandy, Orendorff, Tindall (2025)
159. Node.js Web Development — David Herron (2016)
160. Rust in Action (MEAP) — T.S. McNamara (2020)
161. Cryptography: Algorithms, Protocols, and Standards — Zoubir Z. Mammeri (2024)
162. The Rust Performance Book
