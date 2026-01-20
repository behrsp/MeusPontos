
import React, { useState, useRef } from 'react';
import { TOQUES, ORIXAS_GUIAS_DEFAULT } from '../constants';
import { Song } from '../types';
import { Upload, Music, Save, X, Sparkles, Users, Plus } from 'lucide-react';
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
        // Merge identified with existing, avoid duplicates
        setOrixasGuias(prev => Array.from(new Set([...prev, ...result.orixasGuias])));
      }
    }
    setIsAnalyzing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !lyrics) return;
    onSave({ title, key, lyrics, orixasGuias });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Music className="w-6 h-6 text-indigo-600" />
          {initialData ? 'Editar Música' : 'Nova Música'}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <X className="w-6 h-6 text-slate-400" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Música</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Toque</label>
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              {TOQUES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" /> Selecione Orixá ou Guia
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {ORIXAS_GUIAS_DEFAULT.map(entity => (
              <button
                key={entity}
                type="button"
                onClick={() => toggleEntity(entity)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  orixasGuias.includes(entity) 
                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                  : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300'
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
                className="px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500 border-amber-500 text-white shadow-md flex items-center gap-1"
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
              className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
            <button
              type="button"
              onClick={addCustomEntity}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-1 text-sm font-bold"
            >
              <Plus className="w-4 h-4" /> Incluir
            </button>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-semibold text-slate-700">Letra da Música</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="text-xs flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
                <Upload className="w-3 h-3" /> Abrir TXT
              </button>
              <button type="button" onClick={handleGeminiAnalysis} disabled={isAnalyzing || !lyrics} className={`text-xs flex items-center gap-1 font-medium ${isAnalyzing ? 'text-slate-400' : 'text-emerald-600 hover:text-emerald-700'}`}>
                <Sparkles className="w-3 h-3" /> Sugerir com IA
              </button>
            </div>
          </div>
          <textarea
            required
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            className="w-full h-48 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm leading-relaxed"
          />
        </div>

        <input type="file" accept=".txt" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />

        <div className="flex gap-3 pt-2">
          <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2">
            <Save className="w-5 h-5" /> Salvar Cantiga
          </button>
          <button type="button" onClick={onCancel} className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 px-6 rounded-xl transition-all">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
