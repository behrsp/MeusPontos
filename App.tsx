
import React, { useState, useEffect, useMemo } from 'react';
import { Song, SortOption } from './types';
import { STORAGE_KEY, TOQUES } from './constants';
import { SongForm } from './components/SongForm';
import { 
  Plus, Search, Music, Trash2, Edit3, ArrowLeft, ChevronRight, 
  Filter, Mic2, LayoutDashboard, X, Activity, Users, AlertTriangle, User, Split
} from 'lucide-react';

const App: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  
  // Estado para o Modal de Confirmação Customizado
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Inicialização do Storage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setSongs(parsed);
        }
      } catch (e) {
        console.error("Erro ao carregar banco de dados local", e);
      }
    }
  }, []);

  // Persistência Automática
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs));
  }, [songs]);

  const filteredSongs = useMemo(() => {
    let result = [...songs].filter(s => 
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lyrics.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.mediumName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.guiaName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.orixasGuias?.some(og => og.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    switch (sortBy) {
      case 'alphabetical': result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'key': result.sort((a, b) => a.key.localeCompare(b.key)); break;
      case 'newest': default: result.sort((a, b) => b.createdAt - a.createdAt);
    }
    return result;
  }, [songs, searchQuery, sortBy]);

  const stats = useMemo(() => {
    const toqueCounts: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};
    
    songs.forEach(song => {
      toqueCounts[song.key] = (toqueCounts[song.key] || 0) + 1;
      song.orixasGuias?.forEach(entity => {
        entityCounts[entity] = (entityCounts[entity] || 0) + 1;
      });
    });

    const topEntities = Object.entries(entityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);

    return { toqueCounts, topEntities, total: songs.length };
  }, [songs]);

  const handleAddSong = (songData: Omit<Song, 'id' | 'createdAt'>) => {
    const newSong: Song = { 
      ...songData, 
      id: window.crypto?.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15), 
      createdAt: Date.now() 
    };
    setSongs(prev => [newSong, ...prev]);
    setIsAdding(false);
    setSelectedSongId(newSong.id);
  };

  const handleUpdateSong = (songData: Omit<Song, 'id' | 'createdAt'>) => {
    if (!selectedSongId) return;
    setSongs(prev => prev.map(s => s.id === selectedSongId ? { ...s, ...songData } : s));
    setIsEditing(false);
  };

  const executeDeletion = (id: string) => {
    setSongs(prev => {
      const updated = prev.filter(s => s.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    if (selectedSongId === id) setSelectedSongId(null);
    setConfirmModal({ ...confirmModal, isOpen: false });
  };

  const handleDeleteSong = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const songToDelete = songs.find(s => s.id === id);
    if (!songToDelete) return;

    setConfirmModal({
      isOpen: true,
      title: 'Excluir Ponto',
      message: `Tem certeza que deseja excluir "${songToDelete.title}"? Esta ação não pode ser desfeita.`,
      onConfirm: () => executeDeletion(id)
    });
  };

  const handleClearLibrary = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Limpar Biblioteca',
      message: 'Isso excluirá TODOS os pontos permanentemente. Deseja continuar?',
      onConfirm: () => {
        setSongs([]);
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
        setSelectedSongId(null);
        setConfirmModal({ ...confirmModal, isOpen: false });
      }
    });
  };

  const activeSong = songs.find(s => s.id === selectedSongId);

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col md:flex-row font-sans">
      <aside className={`w-full md:w-96 flex-shrink-0 bg-white border-r border-stone-200 flex flex-col ${selectedSongId && 'hidden md:flex'}`}>
        <div className="p-6 border-b border-stone-100 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
              <Mic2 className="w-7 h-7" /> Pontos
            </h1>
            <div className="flex gap-1">
              <button 
                onClick={handleClearLibrary} 
                className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Limpar Biblioteca"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button onClick={() => setShowDashboard(true)} className="p-2 text-stone-500 hover:bg-stone-100 rounded-lg transition-all" title="Dashboard">
                <LayoutDashboard className="w-5 h-5" />
              </button>
              <button onClick={() => setIsAdding(true)} className="bg-amber-800 hover:bg-amber-900 text-white p-2 rounded-lg transition-colors shadow-lg shadow-amber-900/10" title="Novo Ponto">
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="Procurar pontos, médiuns, guias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-stone-400 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3" />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="bg-transparent border-none outline-none focus:ring-0 cursor-pointer text-amber-800 font-bold">
                <option value="newest">Recentes</option>
                <option value="alphabetical">A-Z</option>
                <option value="key">Toque</option>
              </select>
            </div>
            <span>{filteredSongs.length} PONTOS</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredSongs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-stone-300 px-6 text-center">
              <Music className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm italic">Nenhum ponto por aqui.</p>
            </div>
          ) : (
            filteredSongs.map(song => (
              <div
                key={song.id}
                onClick={() => setSelectedSongId(song.id)}
                className={`p-4 cursor-pointer border-b border-stone-50 flex items-center justify-between group transition-all hover:bg-stone-50 ${selectedSongId === song.id ? 'bg-amber-50 border-l-4 border-l-amber-800' : ''}`}
              >
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className={`font-semibold text-sm truncate ${selectedSongId === song.id ? 'text-amber-950' : 'text-stone-800'}`}>{song.title}</h3>
                  <div className="flex gap-2 mt-1 items-center overflow-hidden">
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded-md font-bold shrink-0">{song.key}</span>
                    <div className="flex gap-1 overflow-hidden">
                      {song.orixasGuias?.length > 0 ? (
                        <span className="text-[9px] text-stone-500 font-bold truncate shrink">
                          {song.orixasGuias.join(', ')}
                        </span>
                      ) : (song.guiaName || song.mediumName) ? (
                        <span className="text-[9px] text-stone-400 font-medium truncate italic shrink">
                          {song.guiaName || song.mediumName}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handleDeleteSong(song.id, e)}
                    className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-md md:opacity-0 group-hover:opacity-100 transition-all"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className={`w-4 h-4 text-stone-300 ${selectedSongId === song.id ? 'text-amber-800' : ''}`} />
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col bg-white md:bg-stone-50 overflow-hidden relative">
        {activeSong ? (
          <div className="h-full flex flex-col animate-in fade-in duration-300">
            <header className="bg-white border-b border-stone-200 p-4 md:p-6 flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedSongId(null)} className="md:hidden p-2 hover:bg-stone-100 rounded-full"><ArrowLeft className="w-5 h-5" /></button>
                <div>
                  <h2 className="text-xl font-bold text-stone-900">{activeSong.title}</h2>
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3">
                    <span className="text-amber-800 font-bold text-xs uppercase flex items-center gap-1"><Activity className="w-3 h-3" /> {activeSong.key}</span>
                    
                    {activeSong.line && (
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${activeSong.line === 'Esquerda' ? 'bg-stone-900 text-white' : 'bg-amber-100 text-amber-900'}`}>
                        Linha: {activeSong.line}
                      </span>
                    )}

                    {activeSong.orixasGuias?.map(og => (
                      <span key={og} className="text-stone-400 text-xs font-medium flex items-center gap-1 border-l border-stone-200 pl-3 first:border-none first:pl-0">
                        <Users className="w-3 h-3" /> {og}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="p-2.5 text-stone-500 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition-all border border-stone-100"
                  title="Editar"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleDeleteSong(activeSong.id)} 
                  className="p-2.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-stone-100"
                  title="Excluir"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </header>
            
            <div className="flex-1 overflow-y-auto bg-white p-6 md:p-12">
              {(activeSong.mediumName || activeSong.guiaName) && (
                <div className="max-w-3xl mx-auto mb-10 p-6 bg-stone-50 rounded-2xl border border-stone-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-800 rounded-xl flex items-center justify-center text-white shadow-lg">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Informações de Axé</p>
                      <h4 className="text-stone-800 font-bold">
                        {activeSong.guiaName || 'Guia não especificado'}
                      </h4>
                      <p className="text-stone-500 text-sm">
                        Médium: {activeSong.mediumName || 'Não informado'}
                      </p>
                    </div>
                  </div>
                  {activeSong.line && (
                    <div className={`px-4 py-2 rounded-xl text-center border-2 ${activeSong.line === 'Esquerda' ? 'bg-stone-900 border-stone-800 text-white' : 'bg-white border-amber-800 text-amber-900'}`}>
                      <p className="text-[9px] font-black uppercase tracking-tighter leading-none opacity-60">Linha de Trabalho</p>
                      <p className="font-black text-lg">{activeSong.line}</p>
                    </div>
                  )}
                </div>
              )}

              <pre className="max-w-3xl mx-auto whitespace-pre-wrap font-serif text-lg leading-relaxed text-stone-800 tracking-wide selection:bg-amber-100">{activeSong.lyrics}</pre>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-stone-50">
            <div className="w-20 h-20 bg-white shadow-xl rounded-3xl flex items-center justify-center mb-6 text-amber-800 animate-pulse"><Music className="w-10 h-10" /></div>
            <h2 className="text-2xl font-bold text-stone-800">Seu Arquivo de Axé</h2>
            <p className="text-stone-500 max-w-xs mt-2 text-sm">Gerencie seus pontos e ritos. Selecione um ponto na lateral para visualizar.</p>
            <button 
              onClick={() => setIsAdding(true)} 
              className="mt-8 flex items-center gap-2 bg-amber-800 text-white px-8 py-3 rounded-2xl font-bold hover:bg-amber-900 transition-all shadow-xl shadow-amber-900/10"
            >
              <Plus className="w-5 h-5" />
              Adicionar Novo Ponto
            </button>
          </div>
        )}
      </main>

      {/* MODAL DE CONFIRMAÇÃO CUSTOMIZADO */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-stone-900 mb-2">{confirmModal.title}</h3>
              <p className="text-stone-600 text-sm">{confirmModal.message}</p>
            </div>
            <div className="flex gap-0 border-t border-stone-100">
              <button 
                onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                className="flex-1 py-4 text-sm font-bold text-stone-500 hover:bg-stone-50 transition-colors border-r border-stone-100"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="flex-1 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {showDashboard && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col p-8 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-stone-800 flex items-center gap-3">
                <LayoutDashboard className="w-8 h-8 text-amber-800" /> Painel de Axé
              </h2>
              <button onClick={() => setShowDashboard(false)} className="p-3 bg-stone-100 hover:bg-stone-200 rounded-2xl transition-colors"><X className="w-6 h-6 text-stone-600" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-amber-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-amber-900/10">
                <p className="text-amber-100 text-sm font-bold uppercase tracking-wider">Total de Pontos</p>
                <p className="text-5xl font-black mt-2">{stats.total}</p>
                <Music className="w-12 h-12 absolute bottom-4 right-4 opacity-10" />
              </div>
              <div className="bg-emerald-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-emerald-900/10">
                <p className="text-emerald-100 text-sm font-bold uppercase tracking-wider">Ritmos</p>
                <p className="text-5xl font-black mt-2">{Object.keys(stats.toqueCounts).length}</p>
                <Activity className="w-12 h-12 absolute bottom-4 right-4 opacity-10" />
              </div>
              <div className="bg-orange-600 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-orange-900/10">
                <p className="text-orange-100 text-sm font-bold uppercase tracking-wider">Orixás/Guias</p>
                <p className="text-5xl font-black mt-2">{stats.topEntities.length}</p>
                <Users className="w-12 h-12 absolute bottom-4 right-4 opacity-10" />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-2"><Activity className="w-5 h-5 text-amber-800" /> Pontos por Toque</h3>
                <div className="space-y-4">
                  {TOQUES.map(toque => {
                    const count = stats.toqueCounts[toque] || 0;
                    const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                    return (
                      <div key={toque} className="space-y-1">
                        <div className="flex justify-between text-sm font-bold text-stone-700">
                          <span>{toque}</span>
                          <span>{count}</span>
                        </div>
                        <div className="h-3 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-700 transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100">
                <h3 className="font-bold text-stone-800 mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-amber-800" /> Presença de Entidades</h3>
                <div className="flex flex-wrap gap-2">
                  {stats.topEntities.length > 0 ? (
                    stats.topEntities.map(([name, count]) => (
                      <div key={name} className="bg-white border border-stone-200 px-4 py-2 rounded-2xl shadow-sm flex items-center gap-2 hover:border-amber-200 transition-colors">
                        <span className="font-bold text-stone-800">{name}</span>
                        <span className="bg-amber-50 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">{count}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-stone-400 italic text-sm py-12 text-center w-full">Nenhum Orixá ou Guia cadastrado ainda.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isAdding || isEditing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="animate-in zoom-in-95 duration-200 w-full max-w-2xl">
            <SongForm 
              onSave={isAdding ? handleAddSong : handleUpdateSong}
              onCancel={() => { setIsAdding(false); setIsEditing(false); }}
              initialData={isEditing ? activeSong : undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
