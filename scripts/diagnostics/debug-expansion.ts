// Test: does "software architecture" pass the WHOLE WORD filter for "war"?

const terms = ["war"];
const conceptName = "software architecture";
const conceptWords = conceptName.split(/\s+/);

// OLD (substring): word.includes(term) || term.includes(word)
const oldFilter = terms.some(term => 
    conceptWords.some(word => word.includes(term) || term.includes(word))
);

// NEW (whole word): word === term
const newFilter = terms.some(term => 
    conceptWords.some(word => word === term)
);

console.log(`Query: "war"`);
console.log(`Concept: "software architecture"`);
console.log(`Concept words: ${JSON.stringify(conceptWords)}`);
console.log('');
console.log(`OLD filter (substring): ${oldFilter ? 'PASSES ❌' : 'BLOCKED ✅'}`);
console.log(`  "software".includes("war") = ${"software".includes("war")}`);
console.log('');
console.log(`NEW filter (whole word): ${newFilter ? 'PASSES ❌' : 'BLOCKED ✅'}`);
console.log(`  "software" === "war" = ${"software" === "war"}`);
console.log(`  "architecture" === "war" = ${"architecture" === "war"}`);
