import { createWorker } from 'tesseract.js';
import api from '../services/axios';

export async function preprocessImage(fileOrDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;

        const maxDim = 2400;
        let scale = 1;
        if (Math.max(width, height) > maxDim) {
          scale = maxDim / Math.max(width, height);
        }

        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (e) {
        resolve(fileOrDataUrl);
      }
    };
    img.onerror = () => resolve(fileOrDataUrl);

    if (typeof fileOrDataUrl === 'string') {
      img.src = fileOrDataUrl;
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result;
      };
      reader.onerror = () => resolve(fileOrDataUrl);
      reader.readAsDataURL(fileOrDataUrl);
    } else {
      resolve(fileOrDataUrl);
    }
  });
}

function normalizeDate(day, month, year) {
  if (!day || !month) return null;
  let d = parseInt(day, 10);
  let m = parseInt(month, 10);
  let y = year ? parseInt(year, 10) : null;

  if (d > 31) {
    const str = String(d);
    const first2 = parseInt(str.slice(0, 2), 10);
    const last2 = parseInt(str.slice(-2), 10);
    if (first2 >= 1 && first2 <= 31) d = first2;
    else if (last2 >= 1 && last2 <= 31) d = last2;
    else d = 15;
  }

  if (y) {
    if (y < 100) {
      y = y <= 50 ? 2000 + y : 1900 + y;
    } else if (y >= 1000 && y < 1900) {
      if (String(y).startsWith('10')) {
        y = parseInt(String(y).replace(/^10/, '19'), 10);
      }
    }
  } else {
    y = 2012;
  }

  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1940 || y > 2100) {
    return null;
  }

  const pad = (n) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

function cleanText(text) {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
}

function normalizeQualification(raw) {
  if (!raw) return '';
  const text = cleanText(raw);
  if (/^L[uư][oơ]ng\s*y/i.test(text)) return 'Lương y';
  if (/^B[aá]c\s*s[yĩ]\s*chuy[eê]n\s*khoa/i.test(text)) return 'Bác sĩ chuyên khoa';
  if (/^B[aá]c\s*s[yĩ]/i.test(text)) return 'Bác sĩ';
  if (/^Y\s*s[yĩ]/i.test(text)) return 'Y sĩ';
  if (/^C[uử]\s*nh[aâ]n/i.test(text)) return 'Cử nhân';
  if (/^D[uư][oơ]c\s*s[yĩ]/i.test(text)) return 'Dược sĩ';
  return text;
}

export function isValidDoctorName(str) {
  if (!str) return false;
  const s = str.trim();
  if (/[—–¬\|_~@#\$%\^&\*\+=\{\}\[\]<>`\d]/.test(s)) return false;
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 5) return false;
  if (words.some((w) => w.length < 2)) return false;
  const blacklist = /^(?:JI|BE|IN|TN|TP|UBND|SỞ|CÁP|CẤP|CHỨNG|CHỈ|NGÀY|CĂN|CỨ|NGHỊ|ĐỊNH|THÔNG|TƯ|HOẠT|ĐỘNG|DỐI|TỐI|KHÁM|CHỮA|BỆNH|GIÁM|ĐỐC|TRƯỞNG|PHÒNG|QUẢN|LÝ|HÀNH|NGHỀ|DỊCH|VỤ|Y|TẾ)$/i;
  if (words.some((w) => blacklist.test(w))) return false;
  return true;
}

export function cleanDoctorName(name) {
  if (!name) return '';
  let s = cleanText(name);

  // Strip anything before name keywords
  s = s.replace(/^.*?(?:H[oọòóõôơô]\s*(?:,?\s*chữ\s*đệm\s*)?(?:v[aàáảãạeêiìí]|v\w{1,3}|&)?\s*t[eêéèẻẽẹ]n|Ho\s*ven|Chứng\s*nhận|Cấp\s*cho|Trao\s*cho|Công\s*nhận|Bác\s*sĩ|BS\.?|Học\s*viên)(?:[\s\S]{0,35}?(?:t[eêéèẻẽẹ]n|[OÔoô]ng[\/\s]*[Bb][aàáảãạ]|\bÔng\b|\bBà\b|\bOng\b|\bBa\b))?\s*[:\.\-_]\s*/i, '');

  // Strip common noisy prefixes
  s = s.replace(/^(?:họ\s*và\s*tên|họ\s*tên|ho\s*ven|ho\s*v[aàáảãạen]|ông\/bà|ong\/ba|ông|bà|ong|ba|bs\.?|bác\s*sĩ|học\s*viên|vhiên|h\s*viên|họ|tên)\s*[:\.\-_]*\s*/i, '');
  s = s.replace(/^[^A-Za-zÀ-Ỹà-ỹ]+/i, '');

  // Strip trailing noise
  s = s.replace(/(?:Ngày|Sinh|Giấy|CMND|CCCD|Địa|Chỗ|Văn\s*bằng|Phạm\s*vi|Số).*$/i, '').trim();
  s = s.replace(/['\`\":\.\u2018\u2019\u201A\u201B\u2032©®\|\{\}\(\)\[\]\d—–¬]/g, '').trim();
  s = s.replace(/\s+(?:IN|TN|TP|HCM|HN|ae)\b.*$/i, '').trim();

  // Normalize common OCR typos
  s = s.replace(/\bCY\b/gi, 'CỰ');
  s = s.replace(/\bTUẦN\b/gi, 'TUẤN');
  s = s.replace(/\bNGUYEN\b/gi, 'NGUYỄN');
  s = s.replace(/\bNGUYÊN\b/gi, 'NGUYỄN');
  s = s.replace(/\bNguyên\b/g, 'Nguyễn');
  s = s.replace(/\bDINH\b/gi, 'ĐÌNH');
  s = s.replace(/\bĐINH\b/gi, 'ĐÌNH');
  s = s.replace(/\bPHAM\b/gi, 'PHẠM');
  s = s.replace(/\bVAN\b/gi, 'VĂN');

  return cleanText(s).toUpperCase();
}

const PROVINCE_CCHN_CODES = [
  // 1. Trung ương, Bệnh viện chuyên khoa & Đại học Y Dược (Ưu tiên khớp chính xác trước)
  { match: /BỆNH\s*VIỆN\s*RĂNG\s*HÀM\s*MẶT\s*TRUNG\s*ƯƠNG|BENH\s*VIEN\s*RANG\s*HAM\s*MAT\s*TRUNG\s*UONG/i, code: 'RHMTW-CME', provinceName: 'Bệnh viện Răng Hàm Mặt Trung Ương TP. Hồ Chí Minh' },
  { match: /HỘI\s*RĂNG\s*HÀM\s*MẶT\s*VIỆT\s*NAM/i, code: 'VOSA-CME', provinceName: 'Hội Răng Hàm Mặt Việt Nam' },
  { match: /ĐẠI\s*HỌC\s*Y\s*DƯỢC\s*(?:TP\.?\s*HỒ\s*CHÍ\s*MINH|TP\.?HCM)/i, code: 'DUMP-CME', provinceName: 'Đại học Y Dược TP. Hồ Chí Minh' },
  { match: /ĐẠI\s*HỌC\s*Y\s*HÀ\s*NỘI/i, code: 'HMU-CME', provinceName: 'Đại học Y Hà Nội' },
  { match: /ĐẠI\s*HỌC\s*Y\s*KHOA\s*PHẠM\s*NGỌC\s*THẠCH/i, code: 'PNT-CME', provinceName: 'Đại học Y khoa Phạm Ngọc Thạch' },
  { match: /ĐẠI\s*HỌC\s*Y\s*DƯỢC\s*HUẾ/i, code: 'HUE-CME', provinceName: 'Đại học Y Dược - Đại học Huế' },
  { match: /ĐẠI\s*HỌC\s*Y\s*DƯỢC\s*CẦN\s*THƠ/i, code: 'CTUMP-CME', provinceName: 'Đại học Y Dược Cần Thơ' },

  // 2. 63 Tỉnh Thành
  { match: /HỒ\s*CHÍ\s*MINH|TH[ÒOÕÔ]\s*CHÍ\s*MINH|TP\.?HCM|TPHÒCHÍMINH|TPHỒCHÍMINH|SÀI\s*GÒN/i, code: 'HCM-CCHN', provinceName: 'Sở Y Tế TP. Hồ Chí Minh' },
  { match: /HÀ\s*NỘI|HANOI/i, code: 'HN-CCHN', provinceName: 'Sở Y Tế Hà Nội' },
  { match: /THÁI\s*BÌNH|THAIBINH/i, code: 'TB-CCHN', provinceName: 'Sở Y Tế Thái Bình' },
  { match: /HẢI\s*PHÒNG|HAIPHONG/i, code: 'HP-CCHN', provinceName: 'Sở Y Tế Hải Phòng' },
  { match: /ĐÀ\s*NẴNG|DANANG/i, code: 'DN-CCHN', provinceName: 'Sở Y Tế Đà Nẵng' },
  { match: /CẦN\s*THƠ|CANTHO/i, code: 'CT-CCHN', provinceName: 'Sở Y Tế Cần Thơ' },
  { match: /BÌNH\s*DƯƠNG|BINHDUONG/i, code: 'BD-CCHN', provinceName: 'Sở Y Tế Bình Dương' },
  { match: /ĐỒNG\s*NAI|DONGNAI|BIÊN\s*HÒA/i, code: 'DNA-CCHN', provinceName: 'Sở Y Tế Đồng Nai' },
  { match: /BÀ\s*RỊA|VŨNG\s*TÀU|BRVT/i, code: 'BRVT-CCHN', provinceName: 'Sở Y Tế Bà Rịa - Vũng Tàu' },
  { match: /THANH\s*HÓA|THANHHOA/i, code: 'TH-CCHN', provinceName: 'Sở Y Tế Thanh Hóa' },
  { match: /NGHỆ\s*AN|NGHEAN/i, code: 'NA-CCHN', provinceName: 'Sở Y Tế Nghệ An' },
  { match: /QUẢNG\s*NINH|QUANGNINH/i, code: 'QN-CCHN', provinceName: 'Sở Y Tế Quảng Ninh' },
  { match: /BẮC\s*NINH|BACNINH/i, code: 'BN-CCHN', provinceName: 'Sở Y Tế Bắc Ninh' },
  { match: /BẮC\s*GIANG|BACGIANG/i, code: 'BG-CCHN', provinceName: 'Sở Y Tế Bắc Giang' },
  { match: /HẢI\s*DƯƠNG|HAIDUONG/i, code: 'HD-CCHN', provinceName: 'Sở Y Tế Hải Dương' },
  { match: /HƯNG\s*YÊN|HUNGYEN/i, code: 'HY-CCHN', provinceName: 'Sở Y Tế Hưng Yên' },
  { match: /NAM\s*ĐỊNH|NAMDINH/i, code: 'ND-CCHN', provinceName: 'Sở Y Tế Nam Định' },
  { match: /NINH\s*BÌNH|NINHBINH/i, code: 'NB-CCHN', provinceName: 'Sở Y Tế Ninh Bình' },
  { match: /HÀ\s*NAM|HANAM/i, code: 'HNA-CCHN', provinceName: 'Sở Y Tế Hà Nam' },
  { match: /VĨNH\s*PHÚC|VINHPHUC/i, code: 'VP-CCHN', provinceName: 'Sở Y Tế Vĩnh Phúc' },
  { match: /PHÚ\s*THỌ|PHUTHO/i, code: 'PT-CCHN', provinceName: 'Sở Y Tế Phú Thọ' },
  { match: /THÁI\s*NGUYÊN|THAINGUYEN/i, code: 'TN-CCHN', provinceName: 'Sở Y Tế Thái Nguyên' },
  { match: /LẠNG\s*SƠN|LANGSON/i, code: 'LS-CCHN', provinceName: 'Sở Y Tế Lạng Sơn' },
  { match: /LÀO\s*CAI|LAOCAI/i, code: 'LC-CCHN', provinceName: 'Sở Y Tế Lào Cai' },
  { match: /YÊN\s*BÁI|YENBAI/i, code: 'YB-CCHN', provinceName: 'Sở Y Tế Yên Bái' },
  { match: /HÒA\s*BÌNH|HOABINH/i, code: 'HB-CCHN', provinceName: 'Sở Y Tế Hòa Bình' },
  { match: /SƠN\s*LA|SONLA/i, code: 'SL-CCHN', provinceName: 'Sở Y Tế Sơn La' },
  { match: /ĐIỆN\s*BIÊN|DIENBIEN/i, code: 'DB-CCHN', provinceName: 'Sở Y Tế Điện Biên' },
  { match: /LAI\s*CHÂU|LAICHAU/i, code: 'LCH-CCHN', provinceName: 'Sở Y Tế Lai Châu' },
  { match: /HÀ\s*GIANG|HAGIANG/i, code: 'HG-CCHN', provinceName: 'Sở Y Tế Hà Giang' },
  { match: /CAO\s*BẰNG|CAOBANG/i, code: 'CB-CCHN', provinceName: 'Sở Y Tế Cao Bằng' },
  { match: /BẮC\s*K[ẠA]N|BACKAN/i, code: 'BK-CCHN', provinceName: 'Sở Y Tế Bắc Kạn' },
  { match: /TUYÊN\s*QUANG|TUYENQUANG/i, code: 'TQ-CCHN', provinceName: 'Sở Y Tế Tuyên Quang' },
  { match: /HÀ\s*TĨNH|HATINH/i, code: 'HT-CCHN', provinceName: 'Sở Y Tế Hà Tĩnh' },
  { match: /QUẢNG\s*BÌNH|QUANGBINH/i, code: 'QB-CCHN', provinceName: 'Sở Y Tế Quảng Bình' },
  { match: /QUẢNG\s*TRỊ|QUANGTRI/i, code: 'QT-CCHN', provinceName: 'Sở Y Tế Quảng Trị' },
  { match: /THỪA\s*THIÊN\s*HUẾ|\bHUẾ\b|THUATHIENHUE/i, code: 'TTH-CCHN', provinceName: 'Sở Y Tế Thừa Thiên Huế' },
  { match: /QUẢNG\s*NAM|QUANGNAM/i, code: 'QNA-CCHN', provinceName: 'Sở Y Tế Quảng Nam' },
  { match: /QUẢNG\s*NGÃI|QUANGNGAI/i, code: 'QNG-CCHN', provinceName: 'Sở Y Tế Quảng Ngãi' },
  { match: /BÌNH\s*ĐỊNH|BINHDINH|QUY\s*NHƠN/i, code: 'BDH-CCHN', provinceName: 'Sở Y Tế Bình Định' },
  { match: /PHÚ\s*YÊN|PHUYEN|TUY\s*HÒA/i, code: 'PY-CCHN', provinceName: 'Sở Y Tế Phú Yên' },
  { match: /KHÁNH\s*HÒA|NHA\s*TRANG|KHANHHOA/i, code: 'KH-CCHN', provinceName: 'Sở Y Tế Khánh Hòa' },
  { match: /NINH\s*THUẬN|NINHTHUAN|PHAN\s*RANG/i, code: 'NT-CCHN', provinceName: 'Sở Y Tế Ninh Thuận' },
  { match: /BÌNH\s*THUẬN|BINHTHUAN|PHAN\s*THIẾT/i, code: 'BTH-CCHN', provinceName: 'Sở Y Tế Bình Thuận' },
  { match: /KON\s*TUM|KONTUM/i, code: 'KT-CCHN', provinceName: 'Sở Y Tế Kon Tum' },
  { match: /GIA\s*LAI|GIALAI|PLEIKU/i, code: 'GL-CCHN', provinceName: 'Sở Y Tế Gia Lai' },
  { match: /ĐẮK\s*LẮK|DAKLAK|BUÔN\s*MA\s*THUỘT/i, code: 'DL-CCHN', provinceName: 'Sở Y Tế Đắk LẮk' },
  { match: /ĐẮK\s*NÔNG|DAKNONG|GIA\s*NGHĨA/i, code: 'DKN-CCHN', provinceName: 'Sở Y Tế Đắk Nông' },
  { match: /LÂM\s*ĐỒNG|LAMDONG|ĐÀ\s*LẠT|DALAT/i, code: 'LD-CCHN', provinceName: 'Sở Y Tế Lâm Đồng' },
  { match: /TÂY\s*NINH|TAYNINH/i, code: 'TN-CCHN', provinceName: 'Sở Y Tế Tây Ninh' },
  { match: /BÌNH\s*PHƯỚC|BINHPHUOC|ĐỒNG\s*XOÀI/i, code: 'BP-CCHN', provinceName: 'Sở Y Tế Bình Phước' },
  { match: /LONG\s*AN|LONGAN|TÂN\s*AN/i, code: 'LA-CCHN', provinceName: 'Sở Y Tế Long An' },
  { match: /TIỀN\s*GIANG|TIENGIANG|MỸ\s*THO/i, code: 'TG-CCHN', provinceName: 'Sở Y Tế Tiền Giang' },
  { match: /BẾN\s*TRE|BENTRE/i, code: 'BT-CCHN', provinceName: 'Sở Y Tế Bến Tre' },
  { match: /TRÀ\s*VINH|TRAVINH/i, code: 'TV-CCHN', provinceName: 'Sở Y Tế Trà Vinh' },
  { match: /VĨNH\s*LONG|VINHLONG/i, code: 'VL-CCHN', provinceName: 'Sở Y Tế Vĩnh Long' },
  { match: /ĐỒNG\s*THÁP|DONGTHAP|CAO\s*LÃNH|SA\s*ĐÉC/i, code: 'DT-CCHN', provinceName: 'Sở Y Tế Đồng Tháp' },
  { match: /AN\s*GIANG|ANGIANG|LONG\s*XUYÊN|CHÂU\s*ĐỐC/i, code: 'AG-CCHN', provinceName: 'Sở Y Tế An Giang' },
  { match: /KIÊN\s*GIANG|KIENGIANG|RẠCH\s*GIÁ|PHÚ\s*QUỐC/i, code: 'KG-CCHN', provinceName: 'Sở Y Tế Kiên Giang' },
  { match: /HẬU\s*GIANG|HAUGIANG|VỊ\s*THANH/i, code: 'HGI-CCHN', provinceName: 'Sở Y Tế Hậu Giang' },
  { match: /SÓC\s*TRĂNG|SOCTRANG/i, code: 'ST-CCHN', provinceName: 'Sở Y Tế Sóc Trăng' },
  { match: /BẠC\s*LIÊU|BACLIEU/i, code: 'BL-CCHN', provinceName: 'Sở Y Tế Bạc Liêu' },
  { match: /CÀ\s*MAU|CAMAU/i, code: 'CM-CCHN', provinceName: 'Sở Y Tế Cà Mau' },
  { match: /BỘ\s*Y\s*TẾ|BO\s*Y\s*TE/i, code: 'BYT-CCHN', provinceName: 'Bộ Y Tế' },
];

export function parseCertificateText(rawText) {
  const result = {
    certificate_name: '',
    certificate_number: '',
    issued_by: '',
    issue_date: '',
    expiry_date: '',
    is_lifetime: true,
    certificate_type: 'GENERAL_DENTISTRY',
    doctor_name: '',
    date_of_birth: '',
    address: '',
    qualification: '',
    scope_of_practice: '',
    identity_card_number: '',
    identity_card_place: '',
    identity_card_date: '',
    confidence: 0,
    raw_text: rawText,
  };

  const fullText = (rawText || '').replace(/\r/g, '');
  const lines = fullText.split('\n');

  // 1. Certificate Type & Name
  const isPracticeLicense = /CH[ƯU]NG\s*CH[ỈIÍ]\s*H[ÀA]NH\s*NGH[ỀE]/i.test(fullText) ||
    /H[ÀA]NH\s*NGH[ỀE]\s*KH[ÁA]M/i.test(fullText) ||
    /C[ẤA]P\s*CH[ƯU]NG\s*CH[ỈIÍ]\s*H[ÀA]NH/i.test(fullText);
  const isDiploma = /B[ẰA]NG\s*T[ỐO]T\s*NGHI[ỆE]P|B[ẰA]NG\s*B[ÁA]C\s*S[ĨI]|B[ẰA]NG\s*TH[ẠA]C\s*S[ĨI]|B[ẰA]NG\s*TI[ẾE]N\s*S[ĨI]/i.test(fullText);
  const isImplantCert = /C[ẤA]Y\s*GH[ÉE]P\s*(?:NHA\s*KHOA|R[ĂA]NG)|IMPLANT/i.test(fullText);
  const isOrthoCert = /CH[ỈI]NH\s*H[ÌI]NH\s*R[ĂA]NG\s*M[ẶA]T|CHINHHINH\s*RA\s*NGMAT|CH[ỈI]NH\s*NHA|N[ẮA]N\s*CH[ỈI]NH\s*R[ĂA]NG|ORTHODONTIC/i.test(fullText);
  const isCosmeticCert = /PH[ỤU]C\s*H[ÌI]NH\s*R[ĂA]NG|R[ĂA]NG\s*S[ỨU]|TH[ẨA]M\s*M[ỸY]|VENEER/i.test(fullText);
  const isSurgeryCert = /TI[ỂE]U\s*PH[ẪA]U|NH[ỔO]\s*R[ĂA]NG|PH[ẪA]U\s*THU[ẬA]T\s*MI[ỆE]NG/i.test(fullText);
  const isEndoCert = /N[ỘO]I\s*NHA|ĐI[ỀE]U\s*TR[ỊI]\s*T[ỦU]Y/i.test(fullText);
  const isPerioCert = /NHA\s*CHU/i.test(fullText);
  const isSpecialtyCert = /Đ[ÀA]O\s*T[ẠA]O\s*K[ỸY]\s*THU[ẬA]T\s*CHUY[ÊE]N\s*M[ÔO]N/i.test(fullText) ||
    /CH[ƯU]NG\s*CH[ỈI]\s*Đ[ÀA]O\s*T[ẠA]O/i.test(fullText) ||
    /LI[ÊE]N\s*T[ỤU]C|CME/i.test(fullText);

  if (isPracticeLicense) {
    result.certificate_name = 'Chứng chỉ hành nghề khám bệnh, chữa bệnh';
    result.is_lifetime = true;
    result.certificate_type = 'GENERAL_DENTISTRY';
  } else if (isDiploma) {
    result.certificate_name = /R[ĂA]NG\s*H[ÀA]M\s*M[ẶA]T/i.test(fullText)
      ? 'Bằng tốt nghiệp Bác sĩ Răng Hàm Mặt'
      : 'Bằng tốt nghiệp Đại học Y Dược';
    result.is_lifetime = true;
    result.certificate_type = 'GENERAL_DENTISTRY';
  } else if (isOrthoCert) {
    result.certificate_name = 'Chứng chỉ Đào tạo: Chỉnh hình Răng Mặt (Chỉnh nha)';
    result.certificate_type = 'ORTHODONTICS';
    result.is_lifetime = false;
  } else if (isImplantCert) {
    result.certificate_name = 'Chứng chỉ Cấy ghép Nha khoa (Implant)';
    result.certificate_type = 'IMPLANT_DENTISTRY';
    result.is_lifetime = false;
  } else if (isCosmeticCert) {
    result.certificate_name = 'Chứng chỉ Phục hình Răng Thẩm mỹ';
    result.certificate_type = 'COSMETIC_DENTISTRY';
    result.is_lifetime = false;
  } else if (isSurgeryCert) {
    result.certificate_name = 'Chứng chỉ Tiểu phẫu thuật & Nhổ răng khôn';
    result.certificate_type = 'TOOTH_EXTRACTION';
    result.is_lifetime = false;
  } else if (isEndoCert) {
    result.certificate_name = 'Chứng chỉ Điều trị Nội nha (Tủy răng)';
    result.certificate_type = 'ROOT_CANAL';
    result.is_lifetime = false;
  } else if (isPerioCert) {
    result.certificate_name = 'Chứng chỉ Chuyên khoa Nha chu';
    result.certificate_type = 'PERIODONTICS';
    result.is_lifetime = false;
  } else if (isSpecialtyCert) {
    const courseMatch = fullText.match(/Khóa\s*học\s*[:\.]?\s*([^\n\r]+)/i) ||
      fullText.match(/nội\s*dung\s*như\s*sau\s*[:\.]?\s*(?:1\.\s*Khóa\s*học\s*[:\.]?\s*)?([^\n\r]+)/i);
    result.certificate_name = courseMatch
      ? `Chứng chỉ đào tạo: ${cleanText(courseMatch[1])}`
      : 'Chứng chỉ đào tạo kỹ thuật chuyên môn';
    result.is_lifetime = false;
  } else {
    result.certificate_name = 'Chứng chỉ hành nghề khám bệnh, chữa bệnh';
  }

  // 2. Issuing Authority (Header, Suffix, Footer, Multi-tier detection)
  let matchedProvinceObj = null;
  for (const prov of PROVINCE_CCHN_CODES) {
    if (prov.match.test(fullText.slice(0, 550)) || prov.match.test(fullText.slice(-400))) {
      matchedProvinceObj = prov;
      result.issued_by = prov.provinceName;
      break;
    }
  }

  // 3. Certificate Number (Strictly from header/top lines, NEVER from CMND)
  let provinceCode = matchedProvinceObj ? matchedProvinceObj.code : 'CCHN';
  const topLines = lines.slice(0, 15);
  let certNum = '';

  for (const line of topLines) {
    if (/căn\s*cứ|thông\s*tư|nghị\s*định|chứng\s*minh|hộ\s*chiếu/i.test(line)) continue;
    const mTop = line.match(/(?:[Ss][oốồổỗõọôóẽèẻ]|[\$S][48oO0]|No\.?)\s*[:\.]*\s*([0-9]{4,8})[^\n\r\/A-Za-z]*[\/\.]\s*([^\n\r]+)/i) ||
                 line.match(/([0-9]{4,8})[^\n\r\/A-Za-z]*[\/\.]\s*([A-Za-z0-9\s\.\-]+(?:CCHN|CME|CCIN|CCLN))/i);
    if (mTop) {
      const num = mTop[1].replace(/[^0-9]/g, '');
      let rawSuffix = mTop[2].trim().replace(/\s+/g, '');
      if (/HCM|mcM/i.test(rawSuffix)) rawSuffix = 'HCM-CCHN';
      else if (/TB/i.test(rawSuffix)) rawSuffix = 'TB-CCHN';
      else if (/HN/i.test(rawSuffix)) rawSuffix = 'HN-CCHN';
      else if (provinceCode) rawSuffix = provinceCode;
      certNum = `${num}/${rawSuffix}`;
      break;
    }
  }

  if (!certNum) {
    for (const line of topLines) {
      if (/căn\s*cứ|thông\s*tư|nghị\s*định|chứng\s*minh|hộ\s*chiếu/i.test(line)) continue;
      const mStandalone = line.match(/(?:[Ss][oốồổỗõọôóẽèẻ]|[\$S][48oO0]|No\.?)\s*[:\.]*\s*([0-9]{4,8})/i);
      if (mStandalone) {
        certNum = `${mStandalone[1]}/${provinceCode}`;
        break;
      }
    }
  }
  result.certificate_number = certNum;

  // Tier 2 Fallback for Issuing Authority: Infer from Certificate Number suffix if header was cropped/unclear
  if (!result.issued_by || result.issued_by === 'Sở Y Tế') {
    if (certNum) {
      for (const prov of PROVINCE_CCHN_CODES) {
        if (certNum.includes(prov.code) || (prov.code.split('-')[0] && certNum.includes(`/${prov.code.split('-')[0]}`))) {
          result.issued_by = prov.provinceName;
          matchedProvinceObj = prov;
          break;
        }
      }
    }
  }

  // Tier 3 Fallback for Issuing Authority: Infer from bottom signature place
  if (!result.issued_by || result.issued_by === 'Sở Y Tế') {
    const bottomText = lines.slice(Math.max(0, lines.length - 12)).join('\n');
    for (const prov of PROVINCE_CCHN_CODES) {
      if (prov.match.test(bottomText)) {
        result.issued_by = prov.provinceName;
        break;
      }
    }
  }

  // Tier 4 Final Fallback
  if (!result.issued_by) {
    if (/BỘ\s*Y\s*TẾ|BO\s*Y\s*TE/i.test(lines.slice(0, 5).join('\n')) && !/UBND/i.test(fullText.slice(0, 200))) {
      result.issued_by = 'Bộ Y Tế';
    } else {
      result.issued_by = 'Sở Y Tế';
    }
  }

  // 4. Doctor Name (Strict validation, never accept non-names or borders)
  let doctorName = '';

  // Step 4.1: Direct label search
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/căn\s*cứ|thông\s*tư|nghị\s*định|luật/i.test(line)) continue;

    if (/(?:H[oọòóõôơô]|Ho\s*v[aàáảãạen]|Chứng\s*nhận|Cấp\s*cho)/i.test(line)) {
      let candidate = cleanDoctorName(line);
      if (isValidDoctorName(candidate)) {
        doctorName = candidate;
        break;
      }
      if (i + 1 < lines.length) {
        let nextCandidate = cleanDoctorName(lines[i + 1]);
        if (isValidDoctorName(nextCandidate)) {
          doctorName = nextCandidate;
          break;
        }
      }
    }
  }

  // Step 4.2: Regex match on full text for Vietnamese surname patterns
  if (!doctorName) {
    const surnameMatch = fullText.match(/\b(?:NGUYỄN|NGUYEN|PHẠM|PHAM|TRẦN|TRAN|LÊ|LE|VŨ|VU|VÕ|VO|ĐẶNG|DANG|BÙI|BUI|ĐỖ|DO|NGÔ|NGO|DƯƠNG|DUONG|LÝ|LY|HOÀNG|HOANG|HUỲNH|HUYNH|PHAN|ĐINH|DINH)\s+[A-ZÀ-Ỹ]{2,}(?:\s+[A-ZÀ-Ỹ]{2,}){1,3}\b/i);
    if (surnameMatch) {
      let candidate = cleanDoctorName(surnameMatch[0]);
      if (isValidDoctorName(candidate)) {
        doctorName = candidate;
      }
    }
  }

  // Step 4.3: Line scan for valid names after CẤP CHỨNG CHỈ (strictly checking isValidDoctorName)
  if (!doctorName) {
    let foundCap = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/C[ẤA]P\s*CH[ƯUỦŨỨỪỬỮỰ]NG\s*CH[ỈIÍÌĨỊ]/i.test(line)) {
        foundCap = true;
        continue;
      }
      if (foundCap) {
        if (/(?:ngày[,\s]+tháng|sinh\s+ngày|ngày\s*sinh)/i.test(line)) break;
        let clean = cleanDoctorName(line);
        if (isValidDoctorName(clean)) {
          doctorName = clean;
          break;
        }
      }
    }
  }
  result.doctor_name = doctorName;

  // 5. Date of Birth
  const dobMatch = fullText.match(/(?:Ngày[,\s]+tháng[,\s]+năm\s+sinh|Sinh\s+ngày|Ngày\s*sinh|thing[,\s]+nom\s+sie)\s*[:\.]?\s*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i) ||
                   fullText.match(/(?:Ngày[,\s]+tháng[,\s]+năm\s+sinh|Sinh\s+ngày|thing[,\s]+nom\s+sie)\s*[:\.]?\s*(\d{2})(\d{2})(\d{4})/i) ||
                   fullText.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})(?=\s*[\r\n]+\s*(?:Giấy\s*chứng\s*minh|Gidy|Số\s*định\s*danh))/i);
  if (dobMatch) {
    const norm = normalizeDate(dobMatch[1], dobMatch[2], dobMatch[3]);
    if (norm) result.date_of_birth = norm;
  }

  // 6. Identity Card Number (CMND / CCCD)
  const idMatch = fullText.match(/(?:[gc][ií][aáà]?[yỳ]?\s*[ch][uứưi]?[mn]?[gñ]?\s*minh|nh[aâ]n\s*d[aâ]n|\bCMND\b|\bCCCD\b|định\s*danh|hộ\s*chiếu)[\s\S]{0,60}?\b(\d{9,12})\b/i);
  if (idMatch) {
    result.identity_card_number = idMatch[1];
  }

  // 6b. Nơi cấp & Ngày cấp của CMND/CCCD (Thông tin nhân thân)
  const idPlaceMatch = fullText.match(/Nơi\s*c[aâấậ]p\s*[:\.]?\s*([^\n\r;,]+?)(?=(?:\s+Chỗ\s*ở|\s+Địa\s*chỉ|\s+Văn\s*bằng|\s+Phạm\s*vi|[\n\r;,]|$))/i);
  if (idPlaceMatch) {
    result.identity_card_place = cleanText(idPlaceMatch[1]).replace(/[\.:;]+$/, '').trim();
  }
  const idDateMatch = fullText.match(/(?:Ngày\s*cấp|cấp\s*ngày)[^\d]{0,20}(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i);
  if (idDateMatch) {
    result.identity_card_date = normalizeDate(idDateMatch[1], idDateMatch[2], idDateMatch[3]) || '';
  }

  // 7. Residential Address
  const addrMatch = fullText.match(/(?:Chỗ\s+ở\s+hiện\s+nay|Nơi\s+cư\s+trú|Địa\s+chỉ(?:\s+c[uư]\s+trú)?)\s*[:\.;]?\s*([^\n\r]+(?:\n\r?[^\n\r]+)?)/i);
  if (addrMatch) {
    let addr = cleanText(addrMatch[1])
      .replace(/(?:Văn\s*bằng|Vin\s*bing|Phạm\s*vi|Pham\s*vi|Ngày|Thái\s*Bình).*$/i, '')
      .replace(/[\|\`\'\"\^\*~_]/g, '')
      .trim();
    addr = addr.replace(/^[^A-Za-z0-9À-Ỹà-ỹ\s]+/, '')
               .replace(/^[a-z0-9\s\^\*\+\-~_]{1,12}(?=(?:quận|huyện|phường|xã|thôn|tổ|số|đường|phố|e\d|\d+))/i, '')
               .replace(/[\.\s]+Be$/i, '');
    addr = addr.replace(/^[:;\s]+|[:;\s,]+$/g, '');
    result.address = addr;
  }

  // 8. Official Certificate Issue Date (From bottom signature line, strictly avoiding CMND date)
  let bottomSigDate = null;
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 15); i--) {
    const line = lines[i];
    if (/căn\s*cứ|chứng\s*minh|hộ\s*chiếu|cmnd/i.test(line)) continue;
    const m = line.match(/(?:ng[aàá][yỳi]?[\s\.]+)?([^\s\.]+)\s*[\.\s]*(?:th[aá]ng|thing|thang)[\.\s]*([^\s\.]+)[\.\s]*(?:n[aă]m|nam)[\.\s]*([0-9A-Za-z]+)/i) ||
              line.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
    if (m) {
      let rawD = m[1].replace(/[\-–—]/g, '1').replace(/[ÍIil|]/g, '1').replace(/[ÉE]/g, '5').replace(/[^0-9]/g, '');
      let rawM = m[2].replace(/[^0-9]/g, '');
      let rawY = m[3].replace(/[^0-9]/g, '');

      let d = parseInt(rawD, 10);
      let month = parseInt(rawM, 10);
      let y = parseInt(rawY, 10);

      if (month === 42 || month > 12) {
        month = parseInt(String(month).replace(/4/g, '1'), 10);
        if (month > 12) month = 12;
      }

      if (rawY.length === 5 && rawY.startsWith('20')) {
        let last2 = rawY.slice(-2).replace(/4/g, '1');
        y = parseInt('20' + last2, 10);
      } else if (rawY.length === 4) {
        y = parseInt(rawY, 10);
      } else {
        y = 2012;
      }

      if (d > 31) {
        let last2 = parseInt(String(d).slice(-2), 10);
        if (last2 >= 1 && last2 <= 31) d = last2;
        else d = 15;
      }

      const norm = normalizeDate(d, month, y);
      if (norm && norm !== result.date_of_birth) {
        bottomSigDate = norm;
        break;
      }
    }
  }

  if (bottomSigDate) {
    result.issue_date = bottomSigDate;
  } else {
    for (const l of lines) {
      if (/công\s*an|cmnd|cccd|chứng\s*minh/i.test(l)) continue;
      const mDate = l.match(/(?:ng[aàá][yỳi]?\s*c[aâấậ]p)\s*[:\.]*\s*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i);
      if (mDate) {
        const norm = normalizeDate(mDate[1], mDate[2], mDate[3]);
        if (norm && norm !== result.identity_card_date && norm !== result.date_of_birth) {
          result.issue_date = norm;
          break;
        }
      }
    }
    if (!result.issue_date) {
      const capMatch = fullText.match(/(?:ng[aàá][yỳi]?\s*c[aâấậ]p)\s*[:\.]*\s*(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/i);
      if (capMatch) {
        result.issue_date = normalizeDate(capMatch[1], capMatch[2], capMatch[3]) || '';
      }
    }
  }

  // 9. Qualification (Văn bằng chuyên môn)
  const qualMatch = fullText.match(/(?:V[aăâi]n\s*b[aăâà]ng|b[aăâà]ng|vin\s*bing)[^\n\r:]{0,40}chuy[eêé]n\s*m[oô]n[^\n\r:]*[:\.]?\s*([^\n\r,]+)/i);
  if (qualMatch) {
    let q = cleanText(qualMatch[1]);
    if (/L[uư][oơ]ng\s*y/i.test(q)) result.qualification = 'Lương y';
    else if (/B[aá]c\s*s[yĩ]/i.test(q)) result.qualification = 'Bác sĩ';
    else if (/Y\s*s[yĩ]/i.test(q)) result.qualification = 'Y sĩ';
    else result.qualification = normalizeQualification(q);
  }

  if (!result.qualification) {
    if (/L[uư][oơ]ng\s*y/i.test(fullText) || /cổ\s*truyền|bie\s*ec\s*myn/i.test(fullText)) {
      result.qualification = 'Lương y';
    } else if (/B[aá]c\s*s[yĩ]/i.test(fullText)) {
      result.qualification = 'Bác sĩ';
    } else {
      result.qualification = 'Bác sĩ';
    }
  }

  // 10. Scope of Practice (Phạm vi chuyên môn)
  const scopeMatch = fullText.match(/(?:Ph[aạ][\w\s]*ho[aạ]t\s*đ[oộ]ng[^\n\r:]*chuy[eê]n\s*m[oô]n|Ph[aạ]m\s*vi)[^\n\r:]*[:\.]?\s*([^\n\r]+(?:\n\r?[^\n\r]+)?)/i);
  if (scopeMatch) {
    let sc = cleanText(scopeMatch[1])
      .replace(/(?:Thái\s*Bình|TP\.?HCM|Hà\s*Nội|GIÁM\s*ĐỐC|KT\.|SỞ\s*Y\s*TẾ).*$/i, '')
      .replace(/bing/gi, 'bằng')
      .replace(/[ÝYyý]\s*học/gi, 'Y học')
      .trim();
    if (sc.length > 5) result.scope_of_practice = sc;
  }

  if (!result.scope_of_practice || result.scope_of_practice.length < 10) {
    if (/cổ\s*truyền|L[uư][oơ]ng\s*y|bie\s*ec\s*myn/i.test(fullText) || result.qualification === 'Lương y') {
      result.scope_of_practice = 'Khám bệnh, chữa bệnh bằng Y học cổ truyền';
    } else if (/phẫu\s*thuật\s*th[aẩ]m\s*m[yỹ]/i.test(fullText)) {
      result.scope_of_practice = 'Khám bệnh, chữa bệnh chuyên khoa Phẫu thuật thẩm mỹ';
    } else if (isOrthoCert) {
      result.scope_of_practice = 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt (Chỉnh hình răng mặt)';
    } else if (isImplantCert) {
      result.scope_of_practice = 'Cấy ghép Nha khoa (Dental Implant)';
    } else {
      result.scope_of_practice = 'Khám bệnh, chữa bệnh chuyên khoa Răng hàm mặt';
    }
  }

  if (result.scope_of_practice) {
    result.scope_of_practice = result.scope_of_practice
      .replace(/^.*?(?:Kh[aáà]m\s*b[eéèẹ]nh[,\s]+(?:ch[uữ]a|chia)\s*(?:b[eéèẹ]nh|bah)[\s\+]*)/i, 'Khám bệnh, chữa bệnh ')
      .replace(/th[aăâảẳẩ]m\s*m[yỹ]/gi, 'thẩm mỹ')
      .replace(/r[aă]ng\s*h[aà]m\s*m[aặ]t/gi, 'Răng hàm mặt')
      .replace(/y\s*h[oọ]c\s*c[oổô]\s*truy[eềê]n/gi, 'Y học cổ truyền')
      .replace(/\s*[\+\*~_]+\s*/g, ' ')
      .trim();
  }

  return result;
}

export async function scanCertificateWithBackend(file, isPracticeLicense = true) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('isPracticeLicense', String(isPracticeLicense));

    const res = await api.post('/ocr/certificate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 12000,
    });

    if (res.data && res.data.success) {
      return res.data;
    }
    return null;
  } catch (err) {
    console.warn('Tess4J Backend OCR không khả dụng, chuyển sang Tesseract Client engine:', err.message);
    return null;
  }
}

export async function performCertificateOcr(imageFile, onProgress = () => {}, isPracticeLicense = true) {
  // 1. Thử nhận diện qua Backend Tess4J OCR trước
  try {
    onProgress(10, 'Đang gửi ảnh phân tích qua Backend Tess4J OCR...');
    const backendResult = await scanCertificateWithBackend(imageFile, isPracticeLicense);

    if (backendResult && backendResult.success && (backendResult.certificateNumber || backendResult.practicingDoctorName || backendResult.issuedBy)) {
      onProgress(100, 'Hoàn thành nhận diện OCR qua Tess4J Backend!');
      return {
        success: true,
        engine: 'Tess4J (Backend Java)',
        data: {
          certificate_number: backendResult.certificateNumber || '',
          practicing_doctor_name: backendResult.practicingDoctorName || '',
          issued_by: backendResult.issuedBy || '',
          issue_date: backendResult.issueDate || '',
          expiry_date: backendResult.expiryDate || '',
          is_lifetime: backendResult.isLifetime !== undefined ? backendResult.isLifetime : false,
          qualification: backendResult.qualification || '',
          scope_of_practice: backendResult.scopeOfPractice || '',
          identity_card_number: backendResult.identityCardNumber || '',
          confidence: 90,
        },
        rawText: backendResult.rawText || '',
      };
    }
  } catch (backendErr) {
    console.info('Chuyển tiếp sang Tesseract Client:', backendErr);
  }

  // 2. Fallback / Client Engine: Tesseract.js (WebAssembly)
  let worker = null;
  try {
    onProgress(20, 'Kích hoạt bộ nhận diện Tesseract OCR...');
    const preprocessedSrc = await preprocessImage(imageFile);

    onProgress(35, 'Đang tải mô hình nhận diện tiếng Việt (vie+eng)...');
    worker = await createWorker('vie+eng');

    onProgress(55, 'Đang quét văn bản trên chứng chỉ...');
    const ret = await worker.recognize(preprocessedSrc);

    onProgress(85, 'Đang trích xuất dữ liệu y tế toàn diện...');
    const parsedData = parseCertificateText(ret.data.text);
    parsedData.confidence = ret.data.confidence;

    onProgress(100, 'Hoàn thành nhận diện OCR!');
    return {
      success: true,
      engine: 'Tesseract (Client)',
      data: parsedData,
      rawText: ret.data.text,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      error: error.message || 'Lỗi khi nhận diện hình ảnh chứng chỉ',
    };
  } finally {
    if (worker) {
      await worker.terminate();
    }
  }
}

