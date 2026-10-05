import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function getInitials(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return initials || "?";
}

type UserAvatarProps = {
  name: string;
  avatarUrl: string | null;
  className?: string;
};

export function UserAvatar({ name, avatarUrl, className }: UserAvatarProps) {
  return (
    <Avatar className={className}>
      {avatarUrl && (
        <AvatarImage src={avatarUrl} alt="" referrerPolicy="no-referrer" />
      )}
      <AvatarFallback className="bg-primary/10 font-medium text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
