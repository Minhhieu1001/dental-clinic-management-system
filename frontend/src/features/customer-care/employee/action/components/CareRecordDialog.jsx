import { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import toast from 'react-hot-toast';
import customerCareService from '../../../../../services/customerCare.service';
import CustommerCareModal from './CustommerCareModal';

export default function CareRecordDialog({ id, patient, mode, careData, employees, onClose, onSuccess }) {
    const [record, setRecord] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [retry, setRetry] = useState(0);
    useEffect(() => {
        let cancelled = false;
        customerCareService.getById(id).then((data) => {
            if (cancelled) return;
            if (data?.careTaskId !== id || data.patientId !== patient.id) throw new Error('Invalid record');
            setRecord(data);
        }).catch((err) => {
            if (!cancelled) setError(err.response?.data?.message ?? 'Không thể tải chi tiết chăm sóc.');
        });
        return () => { cancelled = true; };
    }, [id, patient.id, retry]);

    const remove = async () => {
        if (busy) return;
        setBusy(true);
        setError('');
        try { await customerCareService.delete(id); }
        catch (err) {
            setError(err.response?.data?.message ?? 'Không thể xóa bản ghi.');
            setBusy(false);
            return;
        }
        toast.success('Đã xóa chăm sóc khách hàng.');
        onClose();
        onSuccess();
    };

    if (record && mode !== 'delete') return <CustommerCareModal
        record={record} mode={mode} patient={patient} careData={careData} employees={employees}
        onClose={onClose} onSuccess={onSuccess} />;

    return <Dialog
        open
        onClose={busy ? undefined : (event, reason) => {
            if (reason === 'backdropClick') return;
            onClose?.();
        }}
        fullWidth
        maxWidth="xs"
        slotProps={{ paper: { sx: { borderRadius: '4px' } } }}
    >
        <DialogTitle>{mode === 'delete' ? 'Xác nhận xóa chăm sóc' : 'Chi tiết chăm sóc'}</DialogTitle>
        <DialogContent>
            {error && <Alert severity="error" action={!record && <Button onClick={() => { setError(''); setRetry((value) => value + 1); }}>Thử lại</Button>}>{error}</Alert>}
            {!record && !error && <CircularProgress size={24} />}
            {record && <Typography sx={{ overflowWrap: 'anywhere' }}>
                Xóa bản ghi chăm sóc {record.careCategory} của {record.patientName}? Thao tác này không thể hoàn tác và không thu hồi email đã gửi.
            </Typography>}
        </DialogContent>
        <DialogActions>
            <Button onClick={onClose} disabled={busy}>Hủy</Button>
            {record && <Button color="error" variant="contained" disabled={busy} onClick={remove}>{busy ? 'Đang xóa...' : 'Xác nhận xóa'}</Button>}
        </DialogActions>
    </Dialog>;
}
