
export interface Song {
  id: string;
  title: string;
  key: string;
  lyrics: string;
  orixasGuias: string[];
  createdAt: number;
  mediumName?: string;
  guiaName?: string;
  line?: 'Esquerda' | 'Direita';
}

export type SortOption = 'newest' | 'alphabetical' | 'key';
