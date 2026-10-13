import React, { useState, useEffect } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import { Lock, Unlock, KeyRound, X, Check, ShieldAlert } from 'lucide-react';

interface NotebookLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId: string | null;
  mode: 'unlock' | 'set-pin' | 'remove-pin';
  onSuccess?: () => void;
}

export const NotebookLockModal: React.FC<NotebookLockModalProps> = ({
  isOpen,
  onClose,
  notebookId,
  mode,
  onSuccess,
}) => {
  const { notebooks, setNotebookPin, unlockNotebookSession, isNotebookSessionUnlocked } =
    useNotebookStore();

  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const targetNotebook = notebooks.find((n) => n.id === notebookId);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setErrorMessage(null);
      setShake(false);
    }
  }, [isOpen, notebookId, mode]);

  if (!isOpen || !targetNotebook) return null;

  const triggerShake = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setPin('');
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);

      if (nextPin.length === 4) {
        handleSubmit(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleSubmit = (inputPin: string) => {
    if (mode === 'unlock') {
      if (inputPin === targetNotebook.pinCode) {
        unlockNotebookSession(targetNotebook.id);
        onSuccess?.();
        onClose();
      } else {
        triggerShake('Hatalı PIN kodu! Lütfen tekrar deneyin.');
      }
    } else if (mode === 'set-pin') {
      if (step === 'enter') {
        setConfirmPin(inputPin);
        setPin('');
        setStep('confirm');
      } else {
        if (inputPin === confirmPin) {
          setNotebookPin(targetNotebook.id, inputPin);
          onSuccess?.();
          onClose();
        } else {
          triggerShake('PIN kodları eşleşmedi. Baştan deneyin.');
          setStep('enter');
          setConfirmPin('');
        }
      }
    } else if (mode === 'remove-pin') {
      if (inputPin === targetNotebook.pinCode) {
        setNotebookPin(targetNotebook.id, null);
        onSuccess?.();
        onClose();
      } else {
        triggerShake('Hatalı PIN kodu!');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-none">
      <div
        className={`w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center relative ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {/* Lock Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mb-3 shadow-inner">
          {mode === 'unlock' ? (
            <Lock size={26} />
          ) : mode === 'set-pin' ? (
            <KeyRound size={26} />
          ) : (
            <Unlock size={26} />
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-bold text-slate-100 text-center">
          {mode === 'unlock'
            ? 'Defter Kilitli'
            : mode === 'set-pin'
            ? step === 'enter'
              ? 'Yeni PIN Kodu Belirle'
              : 'PIN Kodunu Onayla'
            : 'Defter Kilidini Kaldır'}
        </h3>

        <p className="text-xs text-slate-400 text-center mt-1 mb-5">
          {mode === 'unlock'
            ? `"${targetNotebook.title}" defterini açmak için 4 haneli PIN kodunu girin.`
            : mode === 'set-pin'
            ? step === 'enter'
              ? 'Bu defteri gizlemek için 4 haneli bir şifre oluşturun.'
              : 'Oluşturduğunuz 4 haneli PIN kodunu tekrar girin.'
            : 'Kilidi kaldırmak için mevcut PIN kodunuzu doğrulayın.'}
        </p>

        {/* 4 PIN Dots Indicator */}
        <div className="flex items-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < pin.length;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  isFilled
                    ? 'bg-indigo-500 scale-110 shadow-md shadow-indigo-500/50'
                    : 'bg-slate-800 border-2 border-slate-700'
                }`}
              />
            );
          })}
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="text-xs text-rose-400 font-medium mb-3 flex items-center gap-1.5 animate-pulse">
            <ShieldAlert size={13} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Keypad Grid (1-9, Clear, 0, Backspace) */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-indigo-600 active:scale-95 text-slate-100 font-semibold text-lg flex items-center justify-center transition-all border border-slate-750"
            >
              {digit}
            </button>
          ))}

          <button
            onClick={() => setPin('')}
            className="h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center transition-all"
          >
            Temizle
          </button>

          <button
            onClick={() => handleDigit('0')}
            className="h-12 rounded-2xl bg-slate-800/80 hover:bg-slate-750 active:bg-indigo-600 active:scale-95 text-slate-100 font-semibold text-lg flex items-center justify-center transition-all border border-slate-750"
          >
            0
          </button>

          <button
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold flex items-center justify-center transition-all"
          >
            Sil
          </button>
        </div>
      </div>
    </div>
  );
};
