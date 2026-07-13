const gate = process.argv[2] ?? "Requested";

console.error(
  `NOT IMPLEMENTED: ${gate} is not an active release gate yet. Add real assertions before enabling it.`,
);
process.exitCode = 1;
