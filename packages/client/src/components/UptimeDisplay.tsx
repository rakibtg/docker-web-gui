interface UptimeDisplayProps {
  status: string;
  className?: string;
}

export function UptimeDisplay({ status, className = "" }: UptimeDisplayProps) {
  const [upSince] = status.split(" (");

  return <span className={`${className} font-mono`}>{upSince}</span>;
}
