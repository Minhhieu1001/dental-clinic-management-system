import { useRef, useState } from 'react';
import { Undo2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatService } from '../../../services/chat.service';

export default function ChatMessageContent({ message, canRecall = false, onRecalled }) {
  const [recalling, setRecalling] = useState(false);
  const busyRef = useRef(false);

  const handleRecall = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setRecalling(true);
    try {
      const updated = await chatService.recallMessage(message.id);
      onRecalled?.(updated);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể thu hồi tin nhắn. Vui lòng thử lại.');
    } finally {
      busyRef.current = false;
      setRecalling(false);
    }
  };

  if (!message.content?.trim()) {
    return <p className="italic opacity-70">Tin nhắn đã thu hồi</p>;
  }

  return (
    <div className="relative">
      {canRecall && (
        <button
          type="button"
          onClick={handleRecall}
          disabled={recalling}
          title="Thu hồi tin nhắn"
          aria-label="Thu hồi tin nhắn"
          className="absolute right-full top-1/2 -translate-y-1/2 mr-5 rounded-full bg-white p-1.5 text-slate-500 shadow-sm hover:text-red-600 opacity-100 sm:opacity-0 sm:group-hover/message:opacity-100 focus:opacity-100 disabled:opacity-50"
        >
          {recalling ? <Loader2 size={16} className="animate-spin" /> : <Undo2 size={16} />}
        </button>
      )}

      {message.messageType === 'IMAGE' && /^https?:\/\//i.test(message.content) ? (
        <a href={message.content} target="_blank" rel="noopener noreferrer" title="Xem ảnh đầy đủ">
          <img
            src={message.content}
            alt="Hình ảnh trong cuộc trò chuyện"
            loading="lazy"
            className="max-h-72 max-w-full rounded-lg object-contain"
          />
        </a>
      ) : message.messageType === 'STICKER' && /^https?:\/\//i.test(message.content) ? (
        <div className="p-1 select-none flex items-center justify-center">
          <img
            src={message.content}
            alt="Sticker Nha Khoa"
            loading="lazy"
            className="w-24 h-24 sm:w-28 sm:h-28 object-contain transition-transform hover:scale-105 duration-200"
          />
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
      )}
    </div>
  );
}
