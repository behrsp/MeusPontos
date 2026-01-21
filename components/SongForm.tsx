
import React, { useState, useRef } from 'react';
import { TOQUES, ORIXAS_GUIAS_DEFAULT } from '../constants';
import { Song } from '../types';
import { Upload, Music, Save, X, Sparkles, Users, Plus, User, Split } from 'lucide-react';
import { analyzeLyrics } from '../services/geminiService';

interface SongFormProps {
  onSave: (song: Omit<Song, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  initialData?: Song;
}

export const SongForm: React.FC<SongFormProps> = ({ onSave, onCancel, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [key, setKey] = useState(initialData?.key || 'Ijexá');
  const [lyrics, setLyrics] = useState(initialData?.lyrics || '');
  const [orixasGuias, setOrixasGuias] = useState<string[]>(initialData?.orixasGuias || []);
  const [mediumName, setMediumName] = useState(initialData?.mediumName || '');
  const [guiaName, setGuiaName] = useState(initialData?.guiaName || '');
  const [line, setLine] = useState<'Esquerda' | 'Direita' | undefined>(initialData?.line);
  const [customEntity, setCustomEntity] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setLyrics(content);
      if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ""));
    };
    reader.readAsText(file);
  };

  const toggleEntity = (entity: string) => {
    setOrixasGuias(prev => 
      prev.includes(entity) ? prev.filter(e => e !== entity) : [...prev, entity]
    );
  };

  const addCustomEntity = () => {
    if (customEntity.trim() && !orixasGuias.includes(customEntity.trim())) {
      setOrixasGuias(prev => [...prev, customEntity.trim()]);
      setCustomEntity('');
    }
  };

  const handleGeminiAnalysis = async () => {
    if (!lyrics) return;
    setIsAnalyzing(true);
    const result = await analyzeLyrics(lyrics);
    if (result) {
      if (result.suggestedToque && TOQUES.includes(result.suggestedToque)) {
        setKey(result.suggestedToque);
      }
      if (result.orixasGuias) {
        setOrixasGuias(prev => Array.from(new Set([...prev, ...result.orixasGuias])));
      }
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !lyrics) return;
    onSave({ title, key, lyrics, orixasGuias, mediumName, guiaName, line });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl border border-stone-100 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
          <Music className="w-6 h-6 text-amber-800" />
          {initialData ? 'Editar Ponto' : 'Novo Ponto'}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-stone-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção Principal */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-stone-700 mb-1">Nome do Ponto</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-700 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-stone-700 mb-1">Toque</label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-700 outline-none bg-white font-medium"
            >
              {TOQUES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        {/* Seção do Médium */}
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 space-y-4">
          <h3 className="text-sm font-bold text-stone-800 flex items-center gap-2 uppercase tracking-wider">
            <User className="w-4 h-4 text-amber-800" /> Informações do Médium
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Nome do Médium</label>
              <input
                type="text"
                value={mediumName}
                onChange={(e) => setMediumName(e.target.value)}
                placeholder="Ex: Médium João"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-700 outline-none text-sm bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-1 uppercase">Nome do Guia</label>
              <input
                type="text"
                value={guiaName}
                onChange={(e) => setGuiaName(e.target.value)}
                placeholder="Ex: Caboclo Mata Virgem"
                className="w-full px-3 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-700 outline-none text-sm bg-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-stone-500 mb-2 uppercase flex items-center gap-1">
              <Split className="w-3 h-3" /> Linha de Trabalho
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLine('Esquerda')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all border ${
                  line === 'Esquerda' 
                  ? 'bg-stone-900 border-stone-900 text-white shadow-md' 
                  : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'
                }`}
              >
                Esquerda
              </button>
              <button
                type="button"
                onClick={() => setLine('Direita')}
                className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all border ${
                  line === 'Direita' 
                  ? 'bg-amber-800 border-amber-800 text-white shadow-md' 
                  : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300'
                }`}
              >
                Direita
              </button>
              {line && (
                <button
                  type="button"
                  onClick={() => setLine(undefined)}
                  className="p-2 text-stone-400 hover:text-red-500 transition-colors"
                  title="Remover seleção"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Orixás e Guias */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-800" /> Selecione Orixá ou Guia
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {ORIXAS_GUIAS_DEFAULT.map(entity => (
              <button
                key={entity}
                type="button"
                onClick={() => toggleEntity(entity)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  orixasGuias.includes(entity) 
                  ? 'bg-amber-800 border-amber-800 text-white shadow-md' 
                  : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300'
                }`}
              >
                {entity}
              </button>
            ))}
            {orixasGuias.filter(e => !ORIXAS_GUIAS_DEFAULT.includes(e)).map(entity => (
              <button
                key={entity}
                type="button"
                onClick={() => toggleEntity(entity)}
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-700 border-orange-700 text-white shadow-md flex items-center gap-1"
              >
                {entity} <X className="w-3 h-3" />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customEntity}
              onChange={(e) => setCustomEntity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomEntity())}
              placeholder="Outro guia... (Ex: Caboclo 7 Flechas)"
              className="flex-1 px-4 py-2 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-700 outline-none text-sm"
            />
            <button
              type="button"
              onClick={addCustomEntity}
              className="px-4 py-2 bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200 transition-all flex items-center gap-1 text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Incluir
            </button>
          </div>
        </div>

        {/* Letra */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-semibold text-stone-700">Letra do Ponto</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs flex items-center gap-1 text-amber-800 hover:text-amber-900 font-medium">
                <Upload className="w-3 h-3" /> Abrir TXT
              </button>
              <button type="button" onClick={handleGeminiAnalysis} disabled={isAnalyzing || !lyrics} className={`text-xs flex items-center gap-1 font-medium ${isAnalyzing ? 'text-stone-400' : 'text-emerald-700 hover:text-emerald-800'}`}>
                <Sparkles className="w-3 h-3" /> Sugerir com IA
              </button>
            </div>
          </div>
          <textarea
            required
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="w-full h-48 px-4 py-3 rounded-lg border border-stone-200 focus:ring-2 focus:ring-amber-700 outline-none font-mono text-sm leading-relaxed"
          />
        </div>

        <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 bg-amber-800 hover:bg-amber-900 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Salvar Ponto
          </button>
          <button type="button" onClick={onCancel} className="bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold py-3 px-6 rounded-xl transition-all">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
