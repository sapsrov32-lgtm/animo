export type AnimeStatus = 'ongoing' | 'finished' | 'announced';
export type WatchStatus = 'plan' | 'now' | 'done';
export type UserRole = 'user' | 'editor' | 'admin';

export interface Genre {
  id: string;
  name_ru: string;
  slug: string;
}

export interface Anime {
  id: string;
  slug: string;
  title_ru?: string | null;
  title_en?: string | null;
  title_jp?: string | null;
  description?: string | null;
  year?: number | null;
  season?: string | null;
  status: AnimeStatus;
  format?: string | null;
  episodes?: number | null;
  poster_url?: string | null;
  banner_url?: string | null;
  anilist_id?: number | null;
  airing_day?: string | null;
  next_episode_at?: string | null;
  score?: number | null;
  studio?: string | null;
  is_published?: boolean;
  created_at?: string;
  updated_at?: string;
  genres?: Genre[];
  anime_genres?: { genres: Genre }[];
}

export interface UserAnime {
  id?: string;
  user_id: string;
  anime_id: string;
  status: WatchStatus;
  score?: number | null;
  progress: number;
  updated_at: string;
  anime?: Anime;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string | null;
  role: UserRole;
  created_at: string;
}
