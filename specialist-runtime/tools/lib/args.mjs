// Strict command-line parsing for the build-time tools. Every option takes a
// value ("--name value" or "--name=value"). Unknown options, positionals,
// repeated options and missing values are refused. There are no boolean
// flags, so there is no bypass switch.

export class UsageError extends Error {
  constructor(message) {
    super(message);
    this.name = "UsageError";
  }
}

/**
 * @param {string[]} argv
 * @param {{ required: string[], optional?: string[] }} spec Option names without "--".
 * @returns {Record<string, string>}
 */
export function parseStrictArgs(argv, { required, optional = [] }) {
  const allowed = new Set([...required, ...optional]);
  const out = Object.create(null);
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new UsageError(`unexpected argument: ${arg}`);
    let name = arg.slice(2);
    let value;
    const eq = name.indexOf("=");
    if (eq !== -1) {
      value = name.slice(eq + 1);
      name = name.slice(0, eq);
    } else {
      value = argv[++i];
      if (value === undefined || value.startsWith("--")) throw new UsageError(`--${name} needs a value`);
    }
    if (!allowed.has(name)) throw new UsageError(`unknown option: --${name}`);
    if (name in out) throw new UsageError(`--${name} given more than once`);
    if (value.length === 0) throw new UsageError(`--${name} must not be empty`);
    out[name] = value;
  }
  for (const name of required) if (!(name in out)) throw new UsageError(`missing required option --${name}`);
  return out;
}
