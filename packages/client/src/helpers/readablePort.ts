export function formatDockerPort(portMapping?: string): string {
  if (!portMapping) {
    return "n/a";
  }

  const arrowMatch = portMapping.match(/^.*:(\d+)->(\d+)\/tcp$/);
  if (arrowMatch) {
    const [, hostPort, containerPort] = arrowMatch;
    return `${hostPort}:${containerPort}`;
  }

  const directPortMatch = portMapping.match(/^(\d+)\/tcp$/);
  if (directPortMatch) {
    return directPortMatch[1];
  }

  return "n/a"; // fallback in case of unexpected format
}
