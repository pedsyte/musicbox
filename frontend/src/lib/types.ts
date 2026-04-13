export interface Track {
  id: string
  slug: string
  title: string
  artist: string
  duration_seconds: number
  cover_path: string | null
  has_lyrics: boolean
  description?: string | null
  lyrics?: string | null
  waveform_peaks?: number[] | null
  play_count: number
  download_count: number
  original_format: string
  uploaded_at: string
  genres: Genre[]
  tags: Tag[]
  is_favorite: boolean
  position?: number
}

export interface Genre {
  id: number
  name: string
  slug: string
  track_count?: number
}

export interface TagCategory {
  id: number
  name: string
  slug: string
  icon: string | null
  tags: Tag[]
}

export interface Tag {
  id: number
  name: string
  slug: string
  category_id: number
  category_name?: string
  category_slug?: string
  category_icon?: string | null
  track_count?: number
}

export interface Comment {
  id: number
  text: string
  username: string
  user_id: string
  created_at: string
}

export interface Playlist {
  id: string
  name: string
  description: string | null
  is_public: boolean
  username?: string
  is_owner?: boolean
  track_count?: number
  total_duration?: number
  covers?: (string | null)[]
  preview_tracks?: { title: string; artist: string }[]
  tracks?: Track[]
  created_at: string
}

export interface User {
  id: string
  username: string
  is_admin: boolean
  theme: 'dark' | 'light'
  show_waveform: boolean
  avatar: string | null
}

export interface AuthResponse {
  token: string
  user: User
}

export interface TracksResponse {
  tracks: Track[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface AdminStats {
  tracks: number
  users: number
  genres: number
  total_plays: number
  total_genres: number
  playlists: number
}

export type RepeatMode = 'off' | 'all' | 'one'
export type SortOption = 'newest' | 'oldest' | 'popular' | 'title' | 'artist' | 'duration'
