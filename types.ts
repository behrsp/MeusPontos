
export interface Song {
  id: string;
  title: string;
  key: string;
  lyrics: string;
  orixasGuias: string[];
  createdAt: number;
}

export type SortOption = 'newest' | 'alphabetical' | 'key';
