export async function nextMacroTask(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
