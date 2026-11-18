export function guvenliHedef(
  sonraki: unknown,
  varsayilan = "/gruplar",
): string {
  if (typeof sonraki !== "string") return varsayilan;
  if (!sonraki.startsWith("/")) return varsayilan;
  if (sonraki.startsWith("//") || sonraki.startsWith("/\\")) return varsayilan;
  return sonraki;
}
