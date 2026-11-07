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
  title_ru: string;
  title_en?: string;
  title_jp?: string;
  description: string;
  year: number;
  season?: string;
  status: AnimeStatus;
  format?: string;
  episodes?: number;
  poster_url: string;
  banner_url?: string;
  anilist_id?: number;
  airing_day?: string;
  next_episode_at?: string;
  score?: number;
  genres?: Genre[];
  studio?: string;
  is_published?: boolean;
}

export interface UserAnime {
  id?: string;
  user_id: string;
  anime_id: string;
  status: WatchStatus;
  score?: number;
  progress: number;
  updated_at: string;
  anime?: Anime;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
}
