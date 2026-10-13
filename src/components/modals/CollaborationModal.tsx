import React, { useState } from 'react';
import { useNotebookStore } from '../../store/notebookStore';
import {
  Users,
  Copy,
  Check,
  LogOut,
  Sparkles,
  Wifi,
  WifiOff,
  UserPlus,
  ShieldCheck,
  X,
  Share2,
} from 'lucide-react';

export const CollaborationModal: React.FC = () => {
  const {
    collaborationModalOpen,
    setCollaborationModalOpen,
    collaboration,
    startCollaborationRoom,
    joinCollaborationRoom,
    leaveCollaborationRoom,
  } = useNotebookStore();

  const [inputRoomCode, setInputRoomCode] = useState('');
  const [userName, setUserName] = useState(collaboration.myName || 'Öğrenci');
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!collaborationModalOpen) return null;

  const handleCopyCode = () => {
    if (!collaboration.roomId) return;
    navigator.clipboard.writeText(collaboration.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateRoom = () => {
    const code = startCollaborationRoom(undefined, userName);
    setStatusMessage(`Oda Oluşturuldu: ${code} 🎉`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRoomCode.trim()) return;
    joinCollaborationRoom(inputRoomCode.trim(), userName);
    setStatusMessage(`Odaya bağlanıldı: ${inputRoomCode.toUpperCase()} ✨`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-925/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Canlı Birlikte Çizim
                {collaboration.isConnected && (
                  <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Canlı
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Arkadaşlarınla aynı defterde eşzamanlı not tut
              </p>
            </div>
          </div>
          <button
            onClick={() => setCollaborationModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* User Display Name */}
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Kullanıcı Adınız
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Adınızı girin..."
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {collaboration.isConnected ? (
            /* Active Connected Session View */
            <div className="space-y-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">Oda Kodu:</span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {collaboration.isHost ? '👑 Kurucu (Host)' : '👤 Katılımcı'}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5">
                  <span className="font-mono text-xl font-bold tracking-wider text-indigo-400">
                    {collaboration.roomId}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow transition-all"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Kopyalandı' : 'Kodu Kopyala'}</span>
                  </button>
                </div>
              </div>

              {/* Connected Peers List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Odadaki Katılımcılar ({collaboration.peers.length + 1})
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {/* Current User */}
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shadow"
                        style={{ backgroundColor: collaboration.myColor }}
                      />
                      <span className="text-xs font-medium text-slate-200">
                        {collaboration.myName} (Siz)
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Bağlı
                    </span>
                  </div>

                  {/* Remote Peers */}
                  {collaboration.peers.map((peer) => (
                    <div
                      key={peer.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-800/40 border border-slate-800"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shadow"
                          style={{ backgroundColor: peer.color }}
                        />
                        <span className="text-xs font-medium text-slate-200">{peer.name}</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Canlı
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leave Room Button */}
              <button
                onClick={() => leaveCollaborationRoom()}
                className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <LogOut size={15} />
                <span>Oturumdan Ayrıl</span>
              </button>
            </div>
          ) : (
            /* Join or Create Room Options */
            <div className="space-y-4">
              {/* Option A: Create New Room */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Sparkles size={14} className="text-amber-400" />
                  <span>Yeni Canlı Oda Başlat</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rastgele 6 haneli oda kodu oluşturur. Kodu arkadaşına göndererek aynı deftere bağlanmasını sağla.
                </p>
                <button
                  onClick={handleCreateRoom}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={15} />
                  <span>Yeni Oda Oluştur</span>
                </button>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="w-full h-px bg-slate-800" />
                <span className="absolute bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                  VEYA
                </span>
              </div>

              {/* Option B: Join Existing Room with Code */}
              <form onSubmit={handleJoinRoom} className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <UserPlus size={14} className="text-indigo-400" />
                  <span>Mevcut Odaya Katıl</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value)}
                    placeholder="Örn: NOTE-4829"
                    className="flex-1 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3.5 py-2 text-sm font-mono uppercase text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputRoomCode.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 disabled:opacity-40 border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Bağlan
                  </button>
                </div>
              </form>

              {/* P2P Feature Highlights Info */}
              <div className="bg-slate-925 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-slate-400 leading-normal">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Doğrudan Cihazdan Cihaza (P2P):</strong> Çizimleriniz sunucuya kaydedilmez, doğrudan tarayıcılar arasında şifreli kanalla anlık olarak aktarılır.
                </span>
              </div>
            </div>
          )}

          {statusMessage && (
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs text-center font-medium animate-in fade-in">
              {statusMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
