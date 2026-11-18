import { useState } from 'react';
import { Box, ButtonBase, Chip, Paper, Skeleton, Stack, Typography } from '@mui/material';
import { CheckCircle2, ImageIcon, Tag } from 'lucide-react';
import { formatDate } from '../../../../utils/dateUtils';

function PromotionImage({ src }) {
  const [failedSrc, setFailedSrc] = useState(null);
  return (
    <Box sx={{ width: '100%', height: 95, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
      {src && failedSrc !== src ? (
        <Box component="img" src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      ) : <ImageIcon size={28} color="#86a994" />}
    </Box>
  );
}

export default function PromotionSelectionPanel({ promotions, selectedId, onSelect, loading, error }) {
  return (
    <Paper variant="outlined" sx={{ minWidth: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Label header: Các chương trình đang diễn ra */}
      <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#f8fafc' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Tag size={16} color="#15803d" />
          <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>
            Các chương trình đang diễn ra
          </Typography>
        </Stack>
        <Chip
          size="small"
          label={`${promotions.length} chương trình`}
          sx={{ height: 22, fontSize: 11, fontWeight: 600, bgcolor: '#ecfdf3', color: '#15803d', borderRadius: '4px' }}
        />
      </Box>

      {loading ? (
        <Stack direction="row" spacing={1.5} sx={{ p: 1.5, flex: 1, alignItems: 'center' }}>
          {[1, 2, 3].map((item) => <Skeleton key={item} variant="rounded" height={180} sx={{ flex: 1 }} />)}
        </Stack>
      ) : error ? (
        <Typography color="error" sx={{ p: 3 }}>{error}</Typography>
      ) : promotions.length === 0 ? (
        <Typography color="text.secondary" sx={{ p: 3, textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Chưa có khuyến mãi đang áp dụng.
        </Typography>
      ) : (
        <Box aria-label="Khuyến mãi đang áp dụng" sx={{ p: 1, display: 'grid', gridAutoFlow: 'column', gridAutoColumns: { xs: '85%', sm: 'calc((100% - 8px) / 2)', xl: 'calc((100% - 16px) / 3)' }, gap: 1, overflowX: 'auto', overflowY: 'hidden', scrollSnapType: 'x proximity', '& > button': { scrollSnapAlign: 'start' }, flex: 1, alignItems: 'stretch' }}>
          {promotions.map((promotion) => {
            const selected = selectedId === promotion.id;
            return (
              <ButtonBase key={promotion.id} onClick={() => onSelect(selected ? null : promotion)}
                aria-pressed={selected} aria-label={`Chọn khuyến mãi ${promotion.title ?? ''}`}
                sx={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', textAlign: 'left', minWidth: 0, overflow: 'hidden', borderRadius: '4px', border: '1px solid', borderColor: selected ? 'primary.main' : '#e2e8f0', bgcolor: selected ? '#f0fdf4' : 'white', boxShadow: selected ? '0 0 0 1px #15803d' : 'none', '&:hover': { borderColor: 'primary.main' }, '&.Mui-focusVisible': { outline: '2px solid #15803d', outlineOffset: 2 } }}>
                <PromotionImage src={promotion.imageUrl} />
                <Box sx={{ p: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
                  <Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography title={promotion.title ?? ''} noWrap sx={{ flex: 1, fontWeight: 600, fontSize: 13 }}>{promotion.title ?? ''}</Typography>
                      <CheckCircle2 size={17} color={selected ? '#15803d' : '#cbd5e1'} style={{ flexShrink: 0 }} />
                    </Stack>
                    <Typography noWrap variant="caption" color="text.secondary">{promotion.description ?? ''}</Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', minWidth: 0, flexWrap: 'wrap' }}>
                      {promotion.couponCode && <Chip size="small" label={promotion.couponCode} sx={{ maxWidth: '60%', height: 22, color: 'primary.dark', bgcolor: '#dcfce7', borderRadius: '4px' }} />}
                      <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 700 }}>
                        {Number(promotion.discountPercent) > 0 ? `Giảm ${promotion.discountPercent}%` : Number(promotion.discountAmount) > 0 ? `Giảm ${Number(promotion.discountAmount).toLocaleString('vi-VN')} đ` : ''}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      {promotion.endDate ? `Đến ${formatDate(promotion.endDate)}` : ''}
                    </Typography>
                  </Box>
                </Box>
              </ButtonBase>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}
