# mcp-pdbe

PDBe (Protein Data Bank in Europe, EBI) MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `get_summary` | PDBe (Protein Data Bank in Europe, EBI): get a PDB entry summary — title, experimental method, release date, source organism, and entity counts (polypeptide/ligand/water/...). Keyless. The EBI counterpart to RCSB PDB. Pass a 4-char PDB id like "1cbs". |
| `get_molecules` | PDBe (EBI): list the molecules/entities in a PDB structure — proteins, nucleic acids, and ligands, each with entity_id, molecule_type, name, and chain length. Keyless. Pass a 4-char PDB id like "1cbs". |
| `uniprot_mappings` | PDBe (EBI): SIFTS cross-database mapping of a PDB structure to UniProt — for each UniProt accession, the matching chains and residue range. Curated cross-database mappings unique to EBI. Keyless. Pass a 4-char PDB id like "1cbs". |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "pdbe": {
      "url": "https://gateway.pipeworx.io/pdbe/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Pdbe data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
