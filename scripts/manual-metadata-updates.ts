/**
 * Manual Metadata Updates Script
 * 
 * Applies curated metadata corrections for documents where automated
 * extraction failed but the correct information is known.
 * 
 * Usage:
 *   npx tsx scripts/manual-metadata-updates.ts --dbpath ~/.concept_rag --dry-run
 *   npx tsx scripts/manual-metadata-updates.ts --dbpath ~/.concept_rag
 */

import * as lancedb from "@lancedb/lancedb";

interface MetadataUpdate {
  titlePattern: string;  // Partial match on title field
  sourcePattern?: string; // Optional partial match on source path
  updates: {
    title?: string;      // Override the title (for papers with ID-only titles)
    author?: string;
    year?: number;
    publisher?: string;
    isbn?: string;
  };
  notes?: string;
}

// Curated metadata corrections based on known book/paper information
const METADATA_UPDATES: MetadataUpdate[] = [
  // === ARXIV PAPERS ===
  {
    titlePattern: "2303.10844",
    updates: {
      title: "Analyzing the Performance of the Inter-Blockchain Communication Protocol",
      author: "Joao Otavio Chervinski, Diego Kreutz, Xiwei Xu, Jiangshan Yu",
      year: 2023,
      publisher: "arXiv",
    },
    notes: "arXiv:2303.10844 - DSN 2023",
  },
  {
    titlePattern: "2302.12125",
    updates: {
      title: "The Hidden Shortcomings of (D)AOs -- An Empirical Study of On-Chain Governance",
      author: "Rainer Feichtinger, Robin Fritsch, Yann Vonlanthen, Roger Wattenhofer",
      year: 2023,
      publisher: "arXiv",
    },
    notes: "arXiv:2302.12125",
  },
  {
    titlePattern: "2204.11193",
    updates: {
      title: "Exploring Security Practices of Smart Contract Developers",
      author: "Tanusree Sharma, Zhixuan Zhou, Andrew Miller, Yang Wang",
      year: 2022,
      publisher: "arXiv",
    },
    notes: "arXiv:2204.11193",
  },
  {
    titlePattern: "2006.15918",
    updates: {
      title: "The Interblockchain Communication Protocol: An Overview",
      author: "Christopher Goes",
      year: 2020,
      publisher: "arXiv",
    },
    notes: "arXiv:2006.15918 - IBC Protocol paper",
  },
  {
    titlePattern: "1711.03936",
    updates: {
      title: "Consensus in the Age of Blockchains",
      author: "Shehar Bano, Alberto Sonnino, Mustafa Al-Bassam, Sarah Azouvi, Patrick McCorry, Sarah Meiklejohn, George Danezis",
      year: 2017,
      publisher: "arXiv",
    },
    notes: "arXiv:1711.03936 - Blockchain consensus survey",
  },
  // === ACM PAPERS ===
  {
    titlePattern: "2993600.2993611",
    updates: {
      title: "Formal Verification of Smart Contracts",
      author: "Karthikeyan Bhargavan, Antoine Delignat-Lavaud, Cédric Fournet, et al.",
      year: 2016,
      publisher: "ACM",
    },
    notes: "ACM CCS 2016 Workshop - PLAS",
  },
  {
    titlePattern: "3696429",
    updates: {
      title: "Blockchain Cross-Chain Bridge Security: Challenges, Solutions, and Future Outlook",
      author: "Ningran Li, Minfeng Qi, Zhiyu Xu, et al.",
      year: 2025,
      publisher: "ACM",
    },
    notes: "ACM Computing Surveys",
  },
  // === CONFERENCE/WORKSHOP PAPERS ===
  {
    titlePattern: "osdi99",
    updates: {
      title: "Practical Byzantine Fault Tolerance",
      author: "Miguel Castro, Barbara Liskov",
      year: 1999,
      publisher: "USENIX",
    },
    notes: "OSDI 1999 - Seminal PBFT paper",
  },
  {
    titlePattern: "PolkaDotPaper",
    updates: {
      title: "Polkadot: Vision for a Heterogeneous Multi-Chain Framework",
      author: "Gavin Wood",
      year: 2016,
      publisher: "Polkadot",
    },
    notes: "Polkadot whitepaper",
  },
  // === BOOKS ===
  {
    titlePattern: "UML Distilled",
    updates: {
      author: "Martin Fowler",
      year: 1997,
      publisher: "Addison-Wesley",
    },
    notes: "UML Distilled - multiple editions",
  },
  {
    titlePattern: "Head First - Design Patterns",
    updates: {
      author: "Eric Freeman, Elisabeth Robson, Kathy Sierra, Bert Bates",
      year: 2004,
      publisher: "O'Reilly Media",
    },
    notes: "Head First Design Patterns",
  },
  {
    titlePattern: "Introduction to Algorithms",
    updates: {
      year: 2009,
    },
    notes: "CLRS - 3rd edition 2009, already has authors",
  },
  {
    titlePattern: "Refactoring Improving the Design",
    updates: {
      year: 1999,
      publisher: "Addison-Wesley",
    },
    notes: "Refactoring by Fowler - already has authors",
  },
  {
    titlePattern: "Test Driven Development By Example",
    updates: {
      year: 2002,
      publisher: "Addison-Wesley",
    },
    notes: "TDD by Kent Beck - already has author",
  },
  {
    titlePattern: "Applying UML and Patterns",
    updates: {
      author: "Craig Larman",
      year: 1998,
      publisher: "Prentice Hall",
    },
    notes: "OOAD with UML",
  },
  {
    titlePattern: "Transaction Processing",
    sourcePattern: "Gray",
    updates: {
      year: 1993,
    },
    notes: "Already has authors (Gray, Reuter)",
  },
  {
    titlePattern: "Introduction to Modern Cryptography",
    updates: {
      year: 2007,
      publisher: "Chapman & Hall/CRC",
    },
    notes: "Already has authors (Katz, Lindell)",
  },
  {
    titlePattern: "Writing Effective Use Cases",
    updates: {
      author: "Alistair Cockburn",
      year: 2000,
      publisher: "Addison-Wesley",
    },
    notes: "Crystal Series",
  },
  {
    titlePattern: "SQL Antipatterns",
    updates: {
      year: 2010,
      publisher: "Pragmatic Bookshelf",
    },
    notes: "Already has author (Karwin)",
  },
  {
    titlePattern: "A Discipline for Software Engineering",
    updates: {
      year: 1995,
      publisher: "Addison-Wesley",
    },
    notes: "Already has author (Humphrey)",
  },
  {
    titlePattern: "Numerical Recipes in C",
    updates: {
      author: "William H. Press, Brian P. Flannery, Saul A. Teukolsky, William T. Vetterling",
      year: 1992,
      publisher: "Cambridge University Press",
    },
    notes: "2nd edition 1992",
  },
  {
    titlePattern: "Sun Tzu - Art Of War",
    updates: {
      author: "Sun Tzu (translated by Lionel Giles)",
      year: -500,
      publisher: "Various",
    },
    notes: "Ancient Chinese military treatise",
  },
  {
    titlePattern: "Critical Thinking A Concise Guide",
    updates: {
      author: "Tracy Bowell, Gary Kemp",
      year: 2002,
      publisher: "Routledge",
    },
    notes: "3rd edition",
  },
  {
    titlePattern: "Embedded C",
    sourcePattern: "Embedded C.pdf",
    updates: {
      author: "Michael J. Pont",
      year: 2002,
      publisher: "Pearson",
    },
    notes: "Embedded C by Pont",
  },
  {
    titlePattern: "Test Driven Development for Embedded C",
    updates: {
      author: "James W. Grenning",
      year: 2011,
      publisher: "Pragmatic Bookshelf",
    },
    notes: "TDD for Embedded C",
  },
  {
    titlePattern: "Project Management Body of Knowledge",
    updates: {
      author: "Project Management Institute",
    },
    notes: "PMBOK Guide - already has year 2013",
  },
  {
    titlePattern: "Sams - Teach Yourself UML",
    updates: {
      author: "Joseph Schmuller",
      year: 2004,
      publisher: "Sams",
    },
    notes: "Teach Yourself UML in 24 Hours",
  },
  {
    titlePattern: "Abstract State Machines",
    updates: {
      author: "Egon Börger, Robert Stärk",
      year: 2003,
      publisher: "Springer",
    },
    notes: "ASM book",
  },
  {
    titlePattern: "Art of Designing Embedded Systems",
    updates: {
      year: 1999,
    },
    notes: "Already has author (Ganssle)",
  },
  {
    titlePattern: "Developing Quality Technical Information",
    updates: {
      author: "Gretchen Hargis, Michelle Carey, Ann Kilty Hernandez, et al.",
      year: 2004,
      publisher: "IBM Press",
    },
    notes: "2nd edition",
  },
  {
    titlePattern: "Engineering Design of Systems",
    updates: {
      year: 2009,
      publisher: "Wiley",
    },
    notes: "Already has author (Buede)",
  },
  {
    titlePattern: "The UML User Guide",
    updates: {
      author: "Grady Booch, James Rumbaugh, Ivar Jacobson",
      year: 1998,
      publisher: "Addison-Wesley",
    },
    notes: "Three Amigos - UML creators",
  },
  {
    titlePattern: "UML Reference Manual",
    updates: {
      author: "James Rumbaugh, Ivar Jacobson, Grady Booch",
      publisher: "Addison-Wesley",
    },
    notes: "Already has year 1999",
  },
  {
    titlePattern: "Programming Embedded Systems",
    sourcePattern: "O'Reilly",
    updates: {
      author: "Michael Barr, Anthony Massa",
      year: 2006,
      publisher: "O'Reilly Media",
      isbn: "9780596009830",
    },
    notes: "2nd edition - Programming Embedded Systems with C and GNU Development Tools",
  },
  {
    titlePattern: "Embedded C - Traps And Pitfalls",
    updates: {
      author: "Michael Barr",
      year: 2003,
    },
    notes: "CMP Books publication",
  },
  {
    titlePattern: "Concurrency Control and Recovery in Database Systems",
    updates: {
      year: 1987,
    },
    notes: "Already has author (Bernstein et al) and ISBN",
  },
  {
    titlePattern: "Continuous Delivery",
    sourcePattern: "Humble",
    updates: {
      year: 2010,
    },
    notes: "Already has authors (Farley, Humble) and ISBN",
  },
  {
    titlePattern: "Digital Designs for Money",
    updates: {
      year: 2022,
    },
    notes: "Springer publication - already has author (Aruka) and ISBN",
  },
  {
    titlePattern: "Foundations of Cryptography",
    sourcePattern: "Primer",
    updates: {
      year: 2005,
    },
    notes: "Now Publishers - already has author (Goldreich)",
  },
  {
    titlePattern: "Tutorials on the Foundations of Cryptography",
    updates: {
      year: 2017,
    },
    notes: "Springer - already has editor (Lindell)",
  },
  {
    titlePattern: "Hardware and Firmware Noise Reduction",
    updates: {
      author: "Edgar Madhavpeddi",
      year: 2019,
      publisher: "Independently Published",
    },
  },
  {
    titlePattern: "Distributed Computing 16th International Conference",
    updates: {
      year: 2002,
      publisher: "Springer",
    },
    notes: "DISC 2002 proceedings",
  },
  {
    titlePattern: "Peer-to-Peer Systems and Applications",
    updates: {
      author: "Ralf Steinmetz, Klaus Wehrle",
      year: 2005,
      publisher: "Springer",
      isbn: "9783540291923",
    },
    notes: "LNCS volume",
  },
  // === BATCH 2: User-provided metadata lookups ===
  {
    titlePattern: "0199671729 effective argument",
    updates: {
      title: "Effective Argument and Critical Thinking",
      author: "Colin Swatridge",
      year: 2014,
      publisher: "Oxford University Press",
    },
  },
  {
    titlePattern: "1-s2.0-S2096720925000132-main",
    updates: {
      title: "Towards blockchain interoperability: a comprehensive survey on cross-chain solutions",
      author: "Wenqing Li, Zhenguang Liu, Jianhai Chen, Zhe Liu, Qinming He",
      year: 2024,
      publisher: "Elsevier",
    },
  },
  {
    titlePattern: "10 Minute Guide To Project Management",
    updates: {
      author: "Jeff Davidson",
      year: 2000,
      publisher: "Prentice Hall",
    },
  },
  {
    titlePattern: "Analog Interfacing to Embedded Microprocessors",
    updates: {
      author: "Stuart Ball",
      publisher: "Newnes",
    },
    notes: "Already has year 2001",
  },
  {
    titlePattern: "Automating DevOps with GitLab",
    updates: {
      publisher: "Packt Publishing",
    },
    notes: "Already has author and year",
  },
  {
    titlePattern: "BABOK v.3.0",
    updates: {
      author: "IIBA",
      year: 2015,
      publisher: "IIBA",
    },
  },
  {
    titlePattern: "Building Microservices",
    sourcePattern: "Sam Newman",
    updates: {
      publisher: "O'Reilly Media",
    },
    notes: "Already has author and year 2021",
  },
  {
    titlePattern: "C Programming for Embedded Systems",
    updates: {
      author: "Kirk Zurell",
      publisher: "R&D Books",
    },
    notes: "Already has year 2000",
  },
  {
    titlePattern: "C Programming for Scientists and Engineers",
    updates: {
      author: "Michael Rabins",
      publisher: "CRC Press",
    },
    notes: "Already has year 2002",
  },
  {
    titlePattern: "c23icnp-wei",
    updates: {
      title: "ICNP 2023 - Wei et al.",
      author: "Wei, et al.",
      year: 2023,
      publisher: "IEEE",
    },
  },
  {
    titlePattern: "Embedded Systems Design",
    sourcePattern: "Cmp",
    updates: {
      author: "Arnold S. Berger",
    },
    notes: "Already has year 2002 and publisher CMP",
  },
  {
    titlePattern: "Real-Time Concepts For Embedded Systems",
    updates: {
      author: "Qing Li",
    },
    notes: "Already has year 2003 and publisher CMP",
  },
  {
    titlePattern: "Data Science: The Hard Parts",
    updates: {
      publisher: "O'Reilly Media",
    },
    notes: "Already has author and year 2024",
  },
  {
    titlePattern: "Design Patterns Elements of Reusable",
    updates: {
      year: 1994,
      publisher: "Addison-Wesley",
    },
    notes: "GoF book - already has authors",
  },
  {
    titlePattern: "Little Black Book of Project",
    updates: {
      author: "Michael C. Thomsett",
      publisher: "AMACOM",
    },
    notes: "Already has year 1996",
  },
  {
    titlePattern: "Efficient blockchain interoperability design",
    updates: {
      year: 2024,
      publisher: "Springer",
    },
    notes: "Already has authors",
  },
  {
    titlePattern: "Elliott Wave Theory for Short Term",
    updates: {
      year: 2003,
      publisher: "Wiley",
    },
    notes: "Already has author (Poser)",
  },
  {
    titlePattern: "Embedded C - Traps And Pitfalls",
    updates: {
      publisher: "CMP Books",
    },
    notes: "Already has author and year",
  },
  {
    titlePattern: "Embedded Controller Hardware Design",
    updates: {
      author: "Ken Arnold",
      publisher: "Newnes",
    },
    notes: "Already has year 2000",
  },
  {
    titlePattern: "Embedded Microprocessor Systems Real World",
    updates: {
      author: "Stuart Ball",
      year: 2002,
    },
    notes: "Already has publisher Newnes",
  },
  {
    titlePattern: "Executable.Object.Modeling.with.Statecharts",
    updates: {
      author: "David Harel, Martin Glinz",
      publisher: "IEEE Computer Society",
    },
    notes: "Already has year 1997",
  },
  {
    titlePattern: "Fundamentals of Smart Contracts Security",
    updates: {
      year: 2019,
      publisher: "Momentum Press",
    },
    notes: "Already has authors",
  },
  {
    titlePattern: "How to Write a Great Bus",
    updates: {
      author: "William A. Sahlman",
      publisher: "Harvard Business Review",
    },
    notes: "Already has year 1997",
  },
  {
    titlePattern: "Introduction to Software Design and Architecture",
    updates: {
      title: "Solid: The Software Design & Architecture Handbook",
      year: 2020,
      publisher: "Self-published",
    },
    notes: "Already has author (Stemmler)",
  },
  {
    titlePattern: "JSF-AV-rules",
    updates: {
      title: "JSF++ AV C++ Coding Standards",
      author: "Lockheed Martin Corporation",
      publisher: "Lockheed Martin",
    },
    notes: "Already has year 2005",
  },
  {
    titlePattern: "Love Unrequited",
    updates: {
      author: "Udi Dahan",
      publisher: "Pragmatic Bookshelf",
    },
    notes: "Already has year 2022",
  },
  {
    titlePattern: "Mechanism Design and Approximation",
    updates: {
      publisher: "Cambridge University Press",
    },
    notes: "Already has author and year",
  },
  {
    titlePattern: "Programming Embedded Systems in C and C",
    sourcePattern: "O'Reilly",
    updates: {
      author: "Michael Barr",
      year: 1999,
      publisher: "O'Reilly Media",
    },
  },
  {
    titlePattern: "O'Really - Programming Embedded Systems",
    updates: {
      title: "Programming Embedded Systems in C and C++",
      author: "Michael Barr",
      year: 1999,
      publisher: "O'Reilly Media",
    },
    notes: "O'Really is a typo of O'Reilly publisher",
  },
  {
    titlePattern: "p1739-arun",
    updates: {
      author: "Arun, et al.",
      publisher: "IEEE",
    },
  },
  {
    titlePattern: "PMP - Fundamentals of Project Management",
    updates: {
      author: "James P. Lewis",
      publisher: "AMACOM",
    },
    notes: "Already has year 1996",
  },
  {
    titlePattern: "PMP - Project Management Practitioner",
    updates: {
      author: "Dilip Soman",
      year: 2004,
    },
  },
  {
    titlePattern: "Programming Embedded System II",
    updates: {
      author: "Michael Barr",
      year: 2006,
      publisher: "O'Reilly Media",
    },
  },
  {
    titlePattern: "Project Management Body of Knowledge PMBOK",
    updates: {
      publisher: "PMI",
    },
    notes: "Already has author and year",
  },
  {
    titlePattern: "Proofs, Arguments, and Zero-Knowledge",
    updates: {
      publisher: "Self-published",
    },
    notes: "Already has author and year",
  },
  {
    titlePattern: "Situated Cognition",
    updates: {
      year: 1997,
      publisher: "Cambridge University Press",
    },
    notes: "Already has author (Clancey)",
  },
  {
    titlePattern: "Social Skill and the Theory of Fields",
    updates: {
      author: "Neil Fligstein",
      year: 2001,
      publisher: "Sociological Theory",
    },
  },
  {
    titlePattern: "State Machine Coding Styles for Synthesis",
    updates: {
      author: "Cliff Cummings",
      year: 2000,
      publisher: "Sunburst Design",
    },
  },
  {
    titlePattern: "Statecharts Quantum Programming",
    updates: {
      title: "Practical Statecharts in C/C++: Quantum Programming for Embedded Systems",
      author: "Miro Samek",
    },
    notes: "Already has year 2002 and publisher CMP Books",
  },
  {
    titlePattern: "Substrate Recipes",
    updates: {
      author: "Parity Technologies",
      year: 2020,
    },
  },
  {
    titlePattern: "Systems Engineering Models: Theory",
    updates: {
      publisher: "CRC Press",
    },
    notes: "Already has author and year",
  },
  {
    titlePattern: "Systems, Functions and Safety",
    updates: {
      year: 2023,
      publisher: "Springer",
    },
    notes: "Already has author (Bjelica)",
  },
  {
    titlePattern: "The Ferrocence Language Specification",
    updates: {
      publisher: "Ferrous Systems",
    },
    notes: "Already has author and year",
  },
  {
    titlePattern: "The Pocket Guide to Critical Thinking",
    updates: {
      author: "Richard L. Epstein",
      publisher: "Wadsworth Publishing",
    },
    notes: "Already has year 2006",
  },
  {
    titlePattern: "Interface Oriented Design",
    updates: {
      author: "Ken Pugh",
      publisher: "Pragmatic Bookshelf",
    },
    notes: "Already has year 2006",
  },
  {
    titlePattern: "steam engine of Thomas Newcomen",
    updates: {
      year: 1977,
      publisher: "Moorland Publishing",
    },
    notes: "Already has authors (Rolt, Allen)",
  },
  {
    titlePattern: "The UML and Data Modeling",
    updates: {
      author: "David C. Hay",
      year: 2011,
      publisher: "Technics Publications",
    },
  },
  {
    titlePattern: "Time series momentum",
    updates: {
      title: "Time Series Momentum",
      author: "Tobias J. Moskowitz, Yao Hua Ooi, Lasse Heje Pedersen",
      year: 2012,
      publisher: "Journal of Financial Economics",
    },
  },
  {
    titlePattern: "UML 2 for Dummies",
    updates: {
      author: "Michael Jesse Chonoles, James A. Schardt",
    },
    notes: "Already has year 2003 and publisher Wiley",
  },
  {
    titlePattern: "UML Notation Guide",
    updates: {
      year: 1997,
      publisher: "Rational Software",
    },
  },
  {
    titlePattern: "Visualizing complexity",
    updates: {
      publisher: "Birkhäuser",
    },
    notes: "Already has authors and year",
  },
];

interface UpdateOptions {
  dbpath: string;
  dryRun: boolean;
  verbose: boolean;
}

interface CatalogRecord {
  id: number;
  source?: string;
  title?: string;
  author?: string;
  year?: number;
  publisher?: string;
  isbn?: string;
}

interface AppliedUpdate {
  documentId: number;
  title: string;
  changes: { field: string; oldValue: any; newValue: any }[];
  notes?: string;
}

function parseArgs(): UpdateOptions {
  const args = process.argv.slice(2);
  const options: UpdateOptions = {
    dbpath: "./db/test",
    dryRun: false,
    verbose: false,
  };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--dbpath" && args[i + 1]) {
      options.dbpath = args[i + 1];
      i++;
    } else if (args[i] === "--dry-run") {
      options.dryRun = true;
    } else if (args[i] === "--verbose" || args[i] === "-v") {
      options.verbose = true;
    }
  }

  return options;
}

async function findAndApplyUpdates(options: UpdateOptions): Promise<AppliedUpdate[]> {
  const db = await lancedb.connect(options.dbpath);
  const catalog = await db.openTable("catalog");

  const allDocs: CatalogRecord[] = await catalog.query().limit(100000).toArray();
  const appliedUpdates: AppliedUpdate[] = [];

  for (const update of METADATA_UPDATES) {
    // Find matching documents
    const matches = allDocs.filter((doc) => {
      const titleMatch = doc.title?.toLowerCase().includes(update.titlePattern.toLowerCase());
      const sourceMatch = !update.sourcePattern || 
        doc.source?.toLowerCase().includes(update.sourcePattern.toLowerCase());
      return titleMatch && sourceMatch;
    });

    for (const doc of matches) {
      const changes: AppliedUpdate["changes"] = [];

      // Title - update if current title is just an ID or has publisher prefix
      if (update.updates.title && doc.title !== update.updates.title) {
        // Only update if current title looks like an ID or has publisher prefix
        const looksLikeId = doc.title && (
          /^\d{4}\.\d{4,5}(v\d+)?$/.test(doc.title) ||  // arXiv ID
          /^\d+\.\d+$/.test(doc.title) ||                // ACM DOI fragment
          /^\d{7,}$/.test(doc.title) ||                  // Long numeric ID
          doc.title.length < 20                          // Very short title
        );
        const hasPublisherPrefix = doc.title && (
          /^O'Reall?y\s*[-–—]/i.test(doc.title) ||       // O'Reilly/O'Really prefix
          /^JSF-AV-rules$/i.test(doc.title)              // Specific codes
        );
        if (looksLikeId || hasPublisherPrefix) {
          changes.push({
            field: "title",
            oldValue: doc.title || "",
            newValue: update.updates.title,
          });
        }
      }

      // Only apply updates for fields that are currently missing
      if (update.updates.author && (!doc.author || doc.author.trim() === "")) {
        changes.push({
          field: "author",
          oldValue: doc.author || "",
          newValue: update.updates.author,
        });
      }

      if (update.updates.year && (!doc.year || doc.year === 0)) {
        changes.push({
          field: "year",
          oldValue: doc.year || 0,
          newValue: update.updates.year,
        });
      }

      if (update.updates.publisher && (!doc.publisher || doc.publisher.trim() === "")) {
        changes.push({
          field: "publisher",
          oldValue: doc.publisher || "",
          newValue: update.updates.publisher,
        });
      }

      if (update.updates.isbn && (!doc.isbn || doc.isbn.trim() === "")) {
        changes.push({
          field: "isbn",
          oldValue: doc.isbn || "",
          newValue: update.updates.isbn,
        });
      }

      if (changes.length > 0) {
        appliedUpdates.push({
          documentId: doc.id,
          title: doc.title || "",
          changes,
          notes: update.notes,
        });

        if (!options.dryRun) {
          // Apply the update
          const values: Record<string, string | number> = {};
          for (const change of changes) {
            values[change.field] = change.newValue;
          }

          try {
            await catalog.update({
              where: `id = ${doc.id}`,
              values,
            });
          } catch (e: any) {
            console.error(`  ❌ Failed to update ${doc.id}: ${e.message}`);
          }
        }
      }
    }
  }

  return appliedUpdates;
}

function printResults(updates: AppliedUpdate[], dryRun: boolean): void {
  if (updates.length === 0) {
    console.log("\n✅ No documents need manual metadata updates");
    console.log("   (Either all metadata is present or no matching documents found)");
    return;
  }

  const action = dryRun ? "Would update" : "Updated";
  console.log(`\n${action} ${updates.length} documents:\n`);

  for (const update of updates) {
    console.log(`📄 ${update.title.substring(0, 60)}`);
    for (const change of update.changes) {
      const oldVal = change.oldValue === "" || change.oldValue === 0 ? "(empty)" : change.oldValue;
      console.log(`   ${change.field}: ${oldVal} → "${change.newValue}"`);
    }
    if (update.notes) {
      console.log(`   📝 ${update.notes}`);
    }
    console.log("");
  }

  // Summary by field
  const fieldCounts: Record<string, number> = {};
  for (const update of updates) {
    for (const change of update.changes) {
      fieldCounts[change.field] = (fieldCounts[change.field] || 0) + 1;
    }
  }

  console.log("Summary:");
  for (const [field, count] of Object.entries(fieldCounts).sort()) {
    console.log(`  ${field}: ${count} updates`);
  }
}

async function main(): Promise<void> {
  const options = parseArgs();

  console.log("=== Manual Metadata Updates ===");
  console.log(`Database: ${options.dbpath}`);
  console.log(`Mode: ${options.dryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Curated updates: ${METADATA_UPDATES.length} rules defined`);
  console.log("");

  try {
    const updates = await findAndApplyUpdates(options);
    printResults(updates, options.dryRun);

    if (options.dryRun && updates.length > 0) {
      console.log("\n💡 Run without --dry-run to apply these updates");
    }

    if (!options.dryRun && updates.length > 0) {
      console.log(`\n✅ Applied ${updates.length} manual metadata corrections`);
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error("Unknown error:", error);
    }
    process.exit(1);
  }
}

main();

