# mcp-pdbe

PDBe (Protein Data Bank in Europe, EBI) MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1476+ live data sources.

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

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/pdbe/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1476+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Pdbe data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
