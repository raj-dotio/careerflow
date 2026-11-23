import { useState } from 'react';
import {
  User,
  GraduationCap,
  Zap,
  Bot,
  Sparkles,
  Award,
  Code2,
} from 'lucide-react';

export type AvatarPreset = 'graduate' | 'pro' | 'coder' | 'ai' | 'scholar';

export interface UserAvatarProps {
  user?: {
    name?: string | null;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    avatarIcon?: string | null;
  } | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBadge?: boolean;
}

const SIZE_MAP = {
  sm: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4',
    badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-2 h-2',
    border: 'border-2',
  },
  md: {
    container: 'w-9 h-9',
    icon: 'w-4.5 h-4.5',
    badge: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-2 h-2',
    border: 'border-2',
  },
  lg: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5',
    badge: 'w-4 h-4 -bottom-0.5 -right-0.5',
    badgeIcon: 'w-2.5 h-2.5',
    border: 'border-2',
  },
  xl: {
    container: 'w-14 h-14',
    icon: 'w-7 h-7',
    badge: 'w-5 h-5 -bottom-1 -right-1',
    badgeIcon: 'w-3 h-3',
    border: 'border-3',
  },
};

export default function UserAvatar({
  user,
  size = 'lg',
  className = '',
  showBadge = true,
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const sizeConfig = SIZE_MAP[size];
  const preset = (user?.avatarIcon as AvatarPreset) || 'graduate';

  // If user has a valid photoURL and it hasn't failed to load
  if (user?.photoURL && !imageError) {
    return (
      <div className={`relative shrink-0 ${sizeConfig.container} ${className}`}>
        <img
          src={user.photoURL}
          alt={user.name || user.displayName || 'User Profile'}
          onError={() => setImageError(true)}
          className={`w-full h-full rounded-full ${sizeConfig.border} border-[#18181b] object-cover shadow-[2px_2px_0px_#18181b]`}
        />
        {showBadge && (
          <span
            className={`absolute ${sizeConfig.badge} rounded-full bg-[#e11d48] border-[1.5px] border-[#18181b] flex items-center justify-center text-white shadow-[1px_1px_0px_#18181b]`}
            title="Active Student"
          >
            <GraduationCap className={sizeConfig.badgeIcon} />
          </span>
        )}
      </div>
    );
  }

  // Preset Configurations with vibrant sketch styling
  const renderPresetContent = () => {
    switch (preset) {
      case 'pro':
        return {
          bg: 'bg-gradient-to-br from-[#f4f4f5] via-[#e4e4e7] to-[#d4d4d8]',
          mainIcon: <User className={`${sizeConfig.icon} text-[#18181b]`} strokeWidth={2.4} />,
          badgeBg: 'bg-[#18181b]',
          badgeIcon: <Award className={sizeConfig.badgeIcon} />,
          title: 'Professional',
        };
      case 'coder':
        return {
          bg: 'bg-gradient-to-br from-[#ecfdf5] via-[#d1fae5] to-[#a7f3d0]',
          mainIcon: <Code2 className={`${sizeConfig.icon} text-[#065f46]`} strokeWidth={2.4} />,
          badgeBg: 'bg-[#059669]',
          badgeIcon: <Zap className={sizeConfig.badgeIcon} />,
          title: 'Code Specialist',
        };
      case 'ai':
        return {
          bg: 'bg-gradient-to-br from-[#eff6ff] via-[#dbeafe] to-[#bfdbfe]',
          mainIcon: <Bot className={`${sizeConfig.icon} text-[#1e40af]`} strokeWidth={2.4} />,
          badgeBg: 'bg-[#2563eb]',
          badgeIcon: <Sparkles className={sizeConfig.badgeIcon} />,
          title: 'AI Innovator',
        };
      case 'scholar':
        return {
          bg: 'bg-gradient-to-br from-[#fef3c7] via-[#fde68a] to-[#fcd34d]',
          mainIcon: <GraduationCap className={`${sizeConfig.icon} text-[#92400e]`} strokeWidth={2.4} />,
          badgeBg: 'bg-[#b45309]',
          badgeIcon: <Sparkles className={sizeConfig.badgeIcon} />,
          title: 'Campus Scholar',
        };
      case 'graduate':
      default:
        return {
          bg: 'bg-gradient-to-br from-[#fff1f2] via-[#ffe4e6] to-[#fecdd3]',
          mainIcon: <User className={`${sizeConfig.icon} text-[#18181b]`} strokeWidth={2.4} />,
          badgeBg: 'bg-[#e11d48]',
          badgeIcon: <GraduationCap className={sizeConfig.badgeIcon} />,
          title: 'Placement Candidate',
        };
    }
  };

  const { bg, mainIcon, badgeBg, badgeIcon, title } = renderPresetContent();

  return (
    <div
      className={`relative shrink-0 ${sizeConfig.container} ${className}`}
      title={user?.name ? `${user.name} (${title})` : title}
    >
      <div
        className={`w-full h-full rounded-full ${sizeConfig.border} border-[#18181b] ${bg} flex items-center justify-center shadow-[2px_2px_0px_#18181b] overflow-hidden transition-transform duration-200 group-hover:scale-105`}
      >
        {mainIcon}
      </div>

      {showBadge && (
        <span
          className={`absolute ${sizeConfig.badge} rounded-full ${badgeBg} border-[1.5px] border-[#18181b] flex items-center justify-center text-white shadow-[1px_1px_0px_#18181b]`}
        >
          {badgeIcon}
        </span>
      )}
    </div>
  );
}
