interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * PDBe (Protein Data Bank in Europe, EBI) MCP.
 *
 * Wraps the keyless EBI PDBe REST API. PDBe = experimentally-determined
 * macromolecular structures with rich EBI annotations. The EBI counterpart
 * to RCSB PDB, with curated SIFTS cross-database mappings.
 */


const BASE = 'https://www.ebi.ac.uk/pdbe/api';
const UA = 'pipeworx/1.0 (+https://pipeworx.io)';

const tools: McpToolExport['tools'] = [
  {
    name: 'get_summary',
    description:
      'PDBe (Protein Data Bank in Europe, EBI): get a PDB entry summary — title, experimental method, release date, source organism, and entity counts (polypeptide/ligand/water/...). Keyless. The EBI counterpart to RCSB PDB. Pass a 4-char PDB id like "1cbs".',
    inputSchema: {
      type: 'object',
      properties: {
        pdb_id: { type: 'string', description: 'A 4-char PDB id, e.g. "1cbs".' },
      },
      required: ['pdb_id'],
    },
  },
  {
    name: 'get_molecules',
    description:
      'PDBe (EBI): list the molecules/entities in a PDB structure — proteins, nucleic acids, and ligands, each with entity_id, molecule_type, name, and chain length. Keyless. Pass a 4-char PDB id like "1cbs".',
    inputSchema: {
      type: 'object',
      properties: {
        pdb_id: { type: 'string', description: 'A 4-char PDB id, e.g. "1cbs".' },
      },
      required: ['pdb_id'],
    },
  },
  {
    name: 'uniprot_mappings',
    description:
      'PDBe (EBI): SIFTS cross-database mapping of a PDB structure to UniProt — for each UniProt accession, the matching chains and residue range. Curated cross-database mappings unique to EBI. Keyless. Pass a 4-char PDB id like "1cbs".',
    inputSchema: {
      type: 'object',
      properties: {
        pdb_id: { type: 'string', description: 'A 4-char PDB id, e.g. "1cbs".' },
      },
      required: ['pdb_id'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  try {
    switch (name) {
      case 'get_summary':
        return await getSummary(reqId(args));
      case 'get_molecules':
        return await getMolecules(reqId(args));
      case 'uniprot_mappings':
        return await uniprotMappings(reqId(args));
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

async function getSummary(id: string): Promise<unknown> {
  const data = await pdbeGet(`/pdb/entry/summary/${encodeURIComponent(id)}`);
  const arr = pickById(data, id);
  const entry = Array.isArray(arr) ? arr[0] : undefined;
  if (!entry || typeof entry !== 'object') return { error: 'PDB entry not found', pdb_id: id };
  const e = entry as Record<string, unknown>;
  return {
    pdb_id: id,
    title: e.title,
    experimental_method: e.experimental_method,
    release_date: e.release_date,
    organism: e.organism_scientific_name,
    entities: e.number_of_entities,
  };
}

async function getMolecules(id: string): Promise<unknown> {
  const data = await pdbeGet(`/pdb/entry/molecules/${encodeURIComponent(id)}`);
  const arr = pickById(data, id);
  if (!Array.isArray(arr)) return { error: 'PDB entry not found', pdb_id: id };
  const molecules = arr.map((m) => {
    const mol = (m && typeof m === 'object' ? m : {}) as Record<string, unknown>;
    const nameArr = mol.molecule_name;
    const nameStr = Array.isArray(nameArr) ? nameArr.join(', ') : typeof nameArr === 'string' ? nameArr : undefined;
    return {
      entity_id: mol.entity_id,
      type: mol.molecule_type,
      name: nameStr,
      length: mol.length,
    };
  });
  return { pdb_id: id, count: molecules.length, molecules };
}

async function uniprotMappings(id: string): Promise<unknown> {
  const data = await pdbeGet(`/mappings/uniprot/${encodeURIComponent(id)}`);
  const byId = pickById(data, id);
  const container = byId && typeof byId === 'object' ? (byId as Record<string, unknown>) : undefined;
  const uniprot = container && typeof container.UniProt === 'object' && container.UniProt !== null
    ? (container.UniProt as Record<string, unknown>)
    : undefined;
  if (!uniprot) return { pdb_id: id, uniprot: [] };

  const entries = Object.entries(uniprot).map(([accession, val]) => {
    const v = (val && typeof val === 'object' ? val : {}) as Record<string, unknown>;
    const mappings = Array.isArray(v.mappings) ? (v.mappings as Record<string, unknown>[]) : [];
    const chainSet = new Set<unknown>();
    let minStart: number | undefined;
    let maxEnd: number | undefined;
    for (const map of mappings) {
      const m = (map && typeof map === 'object' ? map : {}) as Record<string, unknown>;
      if (m.chain_id !== undefined && m.chain_id !== null) chainSet.add(m.chain_id);
      const s = typeof m.unp_start === 'number' ? m.unp_start : undefined;
      const en = typeof m.unp_end === 'number' ? m.unp_end : undefined;
      if (s !== undefined) minStart = minStart === undefined ? s : Math.min(minStart, s);
      if (en !== undefined) maxEnd = maxEnd === undefined ? en : Math.max(maxEnd, en);
    }
    const residueRange = minStart !== undefined && maxEnd !== undefined ? `${minStart}-${maxEnd}` : undefined;
    return {
      accession,
      name: v.name,
      identifier: v.identifier,
      chains: [...chainSet],
      residue_range: residueRange,
    };
  });

  return { pdb_id: id, uniprot: entries };
}

function pickById(data: unknown, id: string): unknown {
  if (!data || typeof data !== 'object') return undefined;
  return (data as Record<string, unknown>)[id];
}

async function pdbeGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (res.status === 404) return {};
  if (!res.ok) throw new Error(`PDBe: ${res.status} ${await res.text().then((t) => t.slice(0, 200))}`);
  return res.json();
}

function reqId(args: Record<string, unknown>): string {
  const v = args.pdb_id;
  if (typeof v !== 'string' || !v.trim()) {
    throw new Error('Required argument "pdb_id" is missing. Pass a 4-char PDB id like "1cbs".');
  }
  return v.trim().toLowerCase();
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
