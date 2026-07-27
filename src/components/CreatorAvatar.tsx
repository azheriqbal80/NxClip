import { 
  Avatar, 
  AvatarImage, 
  AvatarFallback 
} from "./ui/avatar";
import { cn } from "../lib/utils";

interface CreatorAvatarProps {
  src?: string | null;
  email?: string | null;
  className?: string;
  size?: "default" | "sm" | "lg";
}

export function CreatorAvatar({ src, email, className, size = "default" }: CreatorAvatarProps) {
  const fallbackSeed = email || "default";
  const fallbackUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${fallbackSeed}`;

  return (
    <Avatar size={size} className={cn("border border-border/50", className)}>
      <AvatarImage 
        src={src || fallbackUrl} 
        className="object-cover"
        referrerPolicy="no-referrer"
      />
      <AvatarFallback className="bg-muted text-[10px] font-bold">
        {fallbackSeed.charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}
