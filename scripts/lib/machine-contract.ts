interface DocumentedShape {
  [key: string]: DocumentedShape | true;
}

function splitTopLevel(value: string): string[] {
  const parts: string[] = [];
  let start = 0;
  let depth = 0;
  let quoted = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"' && value[index - 1] !== "\\") quoted = !quoted;
    if (quoted) continue;
    if (character === "{" || character === "[") depth += 1;
    if (character === "}" || character === "]") depth -= 1;
    if (character === "," && depth === 0) {
      parts.push(value.slice(start, index));
      start = index + 1;
    }
  }
  parts.push(value.slice(start));
  return parts.map((part) => part.trim()).filter(Boolean);
}

function topLevelColon(value: string): number {
  let depth = 0;
  let quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"' && value[index - 1] !== "\\") quoted = !quoted;
    if (quoted) continue;
    if (character === "{" || character === "[") depth += 1;
    if (character === "}" || character === "]") depth -= 1;
    if (character === ":" && depth === 0) return index;
  }
  return -1;
}

function parseInlineShape(value: string): DocumentedShape {
  const trimmed = value.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    throw new Error(`documented shape is not an object: ${value}`);
  }

  const shape: DocumentedShape = {};
  for (const part of splitTopLevel(trimmed.slice(1, -1))) {
    const colon = topLevelColon(part);
    const rawKey = colon === -1 ? part : part.slice(0, colon).trim();
    const key = rawKey.replace(/^['"]|['"]$/gu, "");
    if (!key || key === "…" || key === "...") continue;
    if (key.endsWith("?")) continue;
    const rawValue = colon === -1 ? "" : part.slice(colon + 1).trim();
    shape[key] = rawValue.startsWith("{") ? parseInlineShape(rawValue) : true;
  }
  return shape;
}

function shapeFromJson(value: unknown): DocumentedShape {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("documented JSON response example must be an object");
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, child]) => [
      key,
      child && typeof child === "object" && !Array.isArray(child)
        ? shapeFromJson(child)
        : true,
    ]),
  );
}

function assertShape(
  actual: unknown,
  expected: DocumentedShape,
  claim: string,
  parent = "",
): void {
  if (!actual || typeof actual !== "object" || Array.isArray(actual)) {
    throw new Error(`${claim}: live response is not an object`);
  }
  const record = actual as Record<string, unknown>;
  for (const [field, child] of Object.entries(expected)) {
    const fieldPath = parent ? `${parent}.${field}` : field;
    if (!Object.hasOwn(record, field)) {
      throw new Error(
        `${claim}: documented field "${fieldPath}" is missing from the live response`,
      );
    }
    if (child !== true) assertShape(record[field], child, claim, fieldPath);
  }
}

export function assertDocumentedInlineShape(
  markdown: string,
  claim: string,
  actual: unknown,
  occurrence = 0,
): void {
  let claimIndex = -1;
  for (let index = 0; index <= occurrence; index += 1) {
    claimIndex = markdown.indexOf(claim, claimIndex + 1);
  }
  if (claimIndex === -1) throw new Error(`missing machine claim: ${claim}`);
  const match = /`([^`\n]+)`/u.exec(markdown.slice(claimIndex + claim.length));
  if (!match) throw new Error(`missing inline object shape after: ${claim}`);
  const notation = match[1].startsWith("{") ? match[1] : `{${match[1]}}`;
  assertShape(actual, parseInlineShape(notation), claim);
}

export function assertDocumentedJsonExampleShape(
  markdown: string,
  introduction: string,
  actual: unknown,
): void {
  const introductionIndex = markdown.indexOf(introduction);
  if (introductionIndex === -1) {
    throw new Error(`missing machine example: ${introduction}`);
  }
  const match = /```json\n([\s\S]*?)\n```/u.exec(
    markdown.slice(introductionIndex + introduction.length),
  );
  if (!match) throw new Error(`missing JSON example after: ${introduction}`);
  assertShape(actual, shapeFromJson(JSON.parse(match[1])), introduction);
}
