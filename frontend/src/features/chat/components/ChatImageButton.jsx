import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../../services/media.service';
import { chatService } from '../../../services/chat.service';

export default function ChatImageButton({ roomId, senderType, senderId, disabled, onSent }) {
  const inputRef = useRef(null);
  const activeRef = useRef(true);
  useEffect(() => {
    activeRef.current = true;
    return () => { activeRef.current = false; };
  }, []);
  const busyRef = useRef(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [sending, setSending] = useState(false);
  const uploadedUrl = useRef(null);

  useEffect(() => {
    if (!preview) return;
    return () => URL.revokeObjectURL(preview);
  }, [preview]);

  const selectFile = (event) => {
    const selected = event.target.files?.[0];
    event.target.value = '';
    if (!selected) return;
    if (!selected.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh.');
      return;
    }
    uploadedUrl.current = null;
    setPreview(URL.createObjectURL(selected));
    setFile(selected);
  };

  const sendImage = async () => {
    if (!file || !roomId || busyRef.current) return;
    busyRef.current = true;
    setSending(true);
    try {
      // Keep the uploaded URL if sending fails so retrying does not upload twice.
      if (!uploadedUrl.current) {
        const url = await uploadImage(file);
        if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
          throw new Error('Máy chủ chưa trả về đường dẫn hình ảnh hợp lệ.');
        }
        uploadedUrl.current = url;
      }
      const message = await chatService.sendMessage({
        roomId,
        senderType,
        ...(senderType === 'PATIENT' ? { senderPatientId: senderId } : { senderEmployeeId: senderId }),
        messageType: 'IMAGE',
        content: uploadedUrl.current,
      });
      if (activeRef.current) onSent(message);
      setFile(null);
      setPreview('');
      uploadedUrl.current = null;
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể gửi ảnh. Vui lòng thử lại.');
    } finally {
      busyRef.current = false;
      setSending(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={selectFile} />
      <button type="button" title="Gửi hình ảnh" aria-label="Gửi hình ảnh"
        disabled={disabled || !roomId || sending}
        onClick={() => inputRef.current?.click()}
        className="p-2 text-teal-700 hover:bg-teal-50 rounded-lg disabled:opacity-40">
        <ImagePlus size={18} />
      </button>
      {file && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Xem trước hình ảnh">
          <div className="bg-white rounded-2xl p-4 w-full max-w-md space-y-3">
            <div className="flex items-center justify-between text-slate-800">
              <span className="font-semibold">Gửi hình ảnh</span>
              <button type="button" disabled={sending} onClick={() => { setFile(null); setPreview(''); }} aria-label="Hủy gửi ảnh"><X size={20} /></button>
            </div>
            <img src={preview} alt="Ảnh chuẩn bị gửi" className="max-h-80 w-full object-contain rounded-lg" />

            <button type="button" disabled={sending} onClick={sendImage}
              className="w-full rounded-lg bg-teal-700 text-white px-4 py-2 flex items-center justify-center gap-2 disabled:opacity-60">
              {sending && <Loader2 size={16} className="animate-spin" />}
              {sending ? 'Đang gửi ảnh...' : 'Gửi ảnh'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
