# Batch Cleanup: ALL 33 ADRs

**Task:** Remove invalid sources from ALL ADRs systematically

## Standard References Section Format

**For Inherited ADRs (0001-0005, 0033):**
```markdown
## References

### Git Commit
- Commit: 082c38e2429a8c9074a9a176dd0b1defc84a5ae2
- Date: November 19, 2024
- Project: lance-mcp (upstream)

### Related Decisions
- [ADR-XXXX](adrXXXX-title.md)

---

**Confidence Level:** MEDIUM (Inherited)
**Attribution:**
- Inherited from upstream lance-mcp (adiom-data team)
- Evidence: Git clone commit 082c38e2
```

**For Documented ADRs (with planning):**
```markdown
## References

### Planning Documents
- [Doc Title](.engineering/artifacts/planning/YYYY-MM-DD-folder/file.md)

### Git Commit (if applicable)
- Commit: [hash]
- Date: [date]
- Message: "[message]"

### Related Decisions
- [ADR-XXXX](adrXXXX-title.md)

---

**Confidence Level:** HIGH
**Attribution:**
- Planning docs: [folder name]
- Metrics from: [planning file, lines X-Y]
```

## Executing Cleanup

Working through all 33 ADRs now...

