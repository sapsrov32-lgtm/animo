'use client';

import { useState, useRef } from 'react';
import { importFromShikimori, importFromMalXml } from '@/app/actions/import-anime';

interface ImportAnimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ImportAnimeModal({ isOpen, onClose, onSuccess }: ImportAnimeModalProps) {
  const [tab, setTab] = useState<'shikimori' | 'mal'>('shikimori');
  const [shikiUsername, setShikiUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{ imported: number; total: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleShikimoriSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shikiUsername.trim()) return;

    setLoading(true);
    setError(null);
    setSuccessResult(null);

    const res = await importFromShikimori(shikiUsername.trim());
    setLoading(false);

    if (!res.success) {
      setError(res.error);
    } else {
      setSuccessResult({
        imported: res.importedCount,
        total: res.totalFound,
      });
      onSuccess();
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit: max 5 MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError('Размер файла превышает лимит 5 МБ. Выберите меньший файл.');
      return;
    }

    // Check extension
    const validExtensions = ['.xml', '.txt', '.json'];
    const hasValidExt = validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      setError('Недопустимый формат файла. Разрешены только XML-файлы экспорта (.xml)');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessResult(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const res = await importFromMalXml(text);
      setLoading(false);

      if (!res.success) {
        setError(res.error);
      } else {
        setSuccessResult({
          imported: res.importedCount,
          total: res.totalFound,
        });
        onSuccess();
      }
    };
    reader.onerror = () => {
      setLoading(false);
      setError('Не удалось прочитать файл. Попробуйте еще раз.');
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    setError(null);
    setSuccessResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-surface-container-low border border-outline-variant/30 shadow-2xl p-6 sm:p-8 flex flex-col gap-5 overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 w-52 h-52 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
              <span className="material-symbols-outlined text-[22px]">cloud_download</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-lg font-bold text-on-surface">
                Импорт аниме-списка
              </h3>
              <p className="font-body-sm text-xs text-outline">
                Перенесите ваши оценки и просмотренные серии в Анимо
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex p-1 rounded-2xl bg-surface-container border border-outline-variant/20 relative z-10">
          <button
            type="button"
            onClick={() => {
              setTab('shikimori');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl font-label-md text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'shikimori'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">person</span>
            <span>Из Shikimori (по нику)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('mal');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl font-label-md text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${
              tab === 'mal'
                ? 'bg-primary text-on-primary shadow-sm'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[17px]">upload_file</span>
            <span>Из MyAnimeList (XML)</span>
          </button>
        </div>

        {/* Success Banner */}
        {successResult && (
          <div className="p-4 rounded-2xl bg-primary-container/30 border border-primary/40 flex items-start gap-3 animate-fadeIn">
            <span className="material-symbols-outlined text-primary text-[24px] mt-0.5">
              check_circle
            </span>
            <div className="flex-1 text-sm">
              <p className="font-bold text-on-surface">Импорт успешно завершен!</p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                Импортировано <strong className="text-primary">{successResult.imported}</strong> из {successResult.total} тайтлов. Оценки, прогресс серий и статусы обновлены.
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="mt-3 px-4 py-1.5 rounded-xl bg-primary text-on-primary text-xs font-semibold shadow-sm hover:brightness-110 transition-all"
              >
                Отлично, закрыть
              </button>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 rounded-2xl bg-error-container/30 border border-error/40 flex items-start gap-3 animate-fadeIn">
            <span className="material-symbols-outlined text-error text-[22px] mt-0.5">
              error
            </span>
            <div className="flex-1 text-xs sm:text-sm text-on-surface">
              <p className="font-semibold text-error">Не удалось выполнить импорт</p>
              <p className="text-on-surface-variant mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        {!successResult && (
          <>
            {tab === 'shikimori' ? (
              <form onSubmit={handleShikimoriSubmit} className="flex flex-col gap-4 relative z-10">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="shiki-nick" className="text-xs font-medium text-on-surface-variant">
                    Никнейм на Shikimori.one
                  </label>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3.5 text-outline text-[18px]">
                      alternate_email
                    </span>
                    <input
                      id="shiki-nick"
                      type="text"
                      value={shikiUsername}
                      onChange={(e) => setShikiUsername(e.target.value)}
                      placeholder="например, luffy или morr"
                      disabled={loading}
                      className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container text-on-surface placeholder:text-outline border border-outline-variant/30 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/40 transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-outline mt-0.5 leading-relaxed">
                    Профиль на Shikimori должен быть открытым для просмотра. Пароль не требуется — синхронизация происходит через публичный API.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !shikiUsername.trim()}
                  className="w-full h-11 rounded-xl bg-primary hover:brightness-110 active:scale-95 text-on-primary font-label-md text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                      <span>Импортируем список...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">sync</span>
                      <span>Импортировать из Shikimori</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="flex flex-col gap-4 relative z-10">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-outline-variant/40 hover:border-primary/60 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-surface-container/40 hover:bg-surface-container transition-all"
                >
                  <span className="material-symbols-outlined text-4xl text-primary mb-2">
                    file_upload
                  </span>
                  <p className="font-title-card text-sm font-semibold text-on-surface">
                    Нажмите для выбора файла экспорта (.xml)
                  </p>
                  <p className="font-body-sm text-xs text-outline mt-1 max-w-xs">
                    Файл экспорта списка с MyAnimeList (скачивается в настройках профиля MAL → Export List)
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </div>

                {loading && (
                  <div className="flex items-center justify-center gap-2 text-primary text-sm py-2">
                    <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Обработка XML файла и сопоставление...</span>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
