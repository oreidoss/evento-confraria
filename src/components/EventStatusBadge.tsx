interface EventStatusBadgeProps {
  status?: string;
}

export const EventStatusBadge = ({ status }: EventStatusBadgeProps) => {
  return (
    <span className="inline-block px-4 py-1 bg-primary/10 text-primary rounded-full text-sm">
      {status || "Em andamento"}
    </span>
  );
};