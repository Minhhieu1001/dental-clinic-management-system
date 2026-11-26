import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import Pill from 'lucide-react-native/icons/pill';
import Search from 'lucide-react-native/icons/search';
import Users from 'lucide-react-native/icons/users';
import X from 'lucide-react-native/icons/x';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { FamilyProfilesModal } from '../../src/components/FamilyProfilesModal';
import { XrayResults, type XrayAnalysis } from '../../src/components/XrayResults';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/contexts/AuthContext';
import { medicalRecordService } from '../../src/services/medicalRecord.service';
import { LinkedProfile, patientService } from '../../src/services/patient.service';
import { formatDate, formatMoney } from '../../src/utils/formatters';

type RecordTab = 'INFO' | 'EXAMS' | 'PLANS' | 'PRESCRIPTIONS' | 'XRAY';

function stripHtml(html?: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDoctorName(name?: string): string {
  if (!name) return '';
  const clean = String(name).replace(/^(BS\.?|Bác sĩ)\s*/i, '').trim();
  return clean ? `BS. ${clean}` : '';
}

function formatPhaseTitle(rawName: string | undefined, idx: number): string {
  const num = idx + 1;
  if (!rawName) return `Giai đoạn ${num}`;
  const rest = rawName
    .replace(/^(Giai\s*đoạn|GĐ)\s*\d*\s*[:\-–.]?\s*/i, '')
    .replace(/[:\-–.\s]+$/, '')
    .trim();
  return rest ? `Giai đoạn ${num} • ${rest}` : `Giai đoạn ${num}`;
}

function formatToothTag(raw?: string | number): string {
  if (raw == null || raw === '') return '';
  const clean = String(raw).trim().replace(/^R/i, '');
  return clean ? `Răng ${clean}` : '';
}

export default function RecordsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, patientId: primaryPatientId } = useAuth();

  const [activeTab, setActiveTab] = useState<RecordTab>('INFO');

  useEffect(() => {
    if (
      params.tab === 'INFO' ||
      params.tab === 'EXAMS' ||
      params.tab === 'PLANS' ||
      params.tab === 'PRESCRIPTIONS' ||
      params.tab === 'XRAY'
    ) {
      setActiveTab(params.tab);
    }
  }, [params.tab]);
  const [profiles, setProfiles] = useState<LinkedProfile[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [familyModalOpen, setFamilyModalOpen] = useState(false);

  const [patientInfo, setPatientInfo] = useState<any | null>(null);
  const [recordDetail, setRecordDetail] = useState<any | null>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedRecordId, setSelectedRecordId] = useState('');
  const medicalRequestRef = useRef(0);
  const [exams, setExams] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [xrays, setXrays] = useState<XrayAnalysis[]>([]);
  const [xrayError, setXrayError] = useState(false);
  const [rxSearch, setRxSearch] = useState('');
  const [selectedRx, setSelectedRx] = useState<any | null>(null);

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRelationships = useCallback(async () => {
    if (!user || !primaryPatientId) return;
    try {
      const list = await patientService.getMyRelationships();
      if (list.length > 0) {
        setProfiles(list);
      } else {
        setProfiles([
          {
            patientId: primaryPatientId,
            fullName: user.username || 'Hồ sơ của tôi',
            isPrimary: true,
            phone: user.phone ?? undefined,
          },
        ]);
      }
    } catch {
      setProfiles([
        {
          patientId: primaryPatientId,
          fullName: user.username || 'Hồ sơ của tôi',
          isPrimary: true,
          phone: user.phone ?? undefined,
        },
      ]);
    }
  }, [user, primaryPatientId]);

  useEffect(() => {
    if (primaryPatientId && !selectedPatientId) {
      setSelectedPatientId(primaryPatientId);
    }
    loadRelationships();
  }, [primaryPatientId, selectedPatientId, loadRelationships]);

  const loadMedicalData = useCallback(async () => {
    const targetId = selectedPatientId || primaryPatientId;
    if (!user || !targetId) return;

    const requestId = ++medicalRequestRef.current;
    setLoading(true);
    try {
      const [pat, recList, planList, rxList] = await Promise.all([
        patientService.getById(targetId).catch(() => null),
        medicalRecordService.getRecordsByPatientId(targetId).catch(() => []),
        medicalRecordService.getTreatmentPlansByPatientId(targetId).catch(() => []),
        medicalRecordService.getPrescriptionsByPatientId(targetId).catch(() => []),
      ]);

      if (requestId !== medicalRequestRef.current) return;
      setRecords(recList);
      const chosen = recList.find((record: any) => (record.id || record.medicalRecordId) === selectedRecordId) || recList[0];
      const recId = chosen?.id || chosen?.medicalRecordId || '';
      if (recId !== selectedRecordId) setSelectedRecordId(recId);
      setPatientInfo(pat);
      setPlans(planList);
      setPrescriptions(rxList);

      if (recId) {
        const [fullRec, examList, xrayResult] = await Promise.all([
          medicalRecordService.getRecordById(recId).catch(() => chosen),
          medicalRecordService.getExamsByRecordId(recId).catch(() => []),
          medicalRecordService.getXrayHistoryByRecordId(recId)
            .then((data) => ({ data, error: false }))
            .catch(() => ({ data: [] as any[], error: true })),
        ]);
        if (requestId !== medicalRequestRef.current) return;
        setRecordDetail(fullRec);
        setExams(examList);
        setXrays(xrayResult.data);
        setXrayError(xrayResult.error);
      } else {
        setRecordDetail(null);
        const fallbackExams = await medicalRecordService.getExamsByPatientId(targetId).catch(() => []);
        if (requestId !== medicalRequestRef.current) return;
        setExams(fallbackExams);
        setXrays([]);
        setXrayError(false);
      }
    } finally {
      if (requestId === medicalRequestRef.current) setLoading(false);
    }
  }, [user, selectedPatientId, primaryPatientId, selectedRecordId]);

  useEffect(() => {
    loadMedicalData();
  }, [loadMedicalData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadRelationships(), loadMedicalData()]);
    setRefreshing(false);
  };

  const activeProfile = useMemo(
    () =>
      profiles.find((p) => p.patientId === selectedPatientId) ?? {
        patientId: selectedPatientId,
        fullName: patientInfo?.fullName || user?.username || 'Hồ sơ của tôi',
      },
    [profiles, selectedPatientId, patientInfo, user]
  );

  const filteredRx = useMemo(() => {
    const q = rxSearch.trim().toLowerCase();
    if (!q) return prescriptions;
    return prescriptions.filter((rx) => {
      const items = rx.prescriptionDetails || rx.items || rx.medications || [];
      const medMatch = items.some((m: any) =>
        String(m.medicineName || m.name || '').toLowerCase().includes(q)
      );
      return (
        medMatch ||
        [rx.prescriptionName, rx.prescriptionCode, rx.dentistName, rx.prescriber].some((v) =>
          String(v || '').toLowerCase().includes(q)
        )
      );
    });
  }, [prescriptions, rxSearch]);

  if (!user) {
    return (
      <View style={styles.guestBox}>
        <Text style={styles.guestTitle}>Hồ sơ bệnh án điện tử</Text>
        <Text style={styles.guestSub}>
          Đăng nhập để xem bệnh án, kết quả khám răng, phác đồ điều trị và đơn thuốc.
        </Text>
        <Pressable style={styles.loginBtn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
        </Pressable>
      </View>
    );
  }

  const mergedInfo = { ...patientInfo, ...recordDetail };

  return (
    <View style={styles.container}>
      {/* Family Profile Switcher Bar */}
      <Pressable style={styles.profileBar} onPress={() => setFamilyModalOpen(true)}>
        <View style={styles.profileIconBox}>
          <Users size={18} color={Colors.primaryDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileBarLabel}>ĐANG XEM HỒ SƠ BỆNH ÁN</Text>
          <Text numberOfLines={1} style={styles.profileBarName}>
            {activeProfile.fullName}
          </Text>
        </View>
        <View style={styles.switchPill}>
          <Text style={styles.switchPillText}>Đổi / Liên kết</Text>
          <ChevronDown size={14} color={Colors.primaryDark} />
        </View>
      </Pressable>

      {records.length > 1 && (
        <View style={styles.recordPicker}>
          <Text style={styles.recordPickerLabel}>HỒ SƠ BỆNH ÁN ĐANG XEM</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {records.map((record: any) => {
              const id = record.id || record.medicalRecordId;
              const active = id === selectedRecordId;
              return (
                <Pressable key={id} onPress={() => setSelectedRecordId(id)} style={[styles.recordOption, active && styles.recordOptionActive]}>
                  <Text style={[styles.recordOptionText, active && styles.recordOptionTextActive]}>
                    {record.medicalRecordCode || 'Hồ sơ bệnh án'} · {formatDate(record.recordDate)}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Sub-tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabsRow}>
        {(
          [
            { key: 'INFO', label: 'Thông tin' },
            { key: 'EXAMS', label: 'Lịch sử khám' },
            { key: 'PLANS', label: 'Phác đồ' },
            { key: 'PRESCRIPTIONS', label: 'Đơn thuốc' },
            { key: 'XRAY', label: 'X-Quang' },
          ] as const
        ).map((t) => {
          const active = activeTab === t.key;
          return (
            <Pressable
              key={t.key}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}>
              <Text numberOfLines={1} style={[styles.tabBtnText, active && { color: '#fff' }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && !refreshing ? (
        <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          showsVerticalScrollIndicator={false}>
          {/* TAB 1: INFO */}
          {activeTab === 'INFO' && (
            <View style={{ gap: 14 }}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Thông tin Hành chính</Text>
                {[
                  ['Họ và tên', mergedInfo.fullName || mergedInfo.patientName || '—'],
                  ['Mã bệnh nhân', mergedInfo.patientCode || '—'],
                  ['Mã bệnh án', mergedInfo.medicalRecordCode || mergedInfo.recordCode || '—'],
                  ['Ngày sinh', formatDate(mergedInfo.dateOfBirth)],
                  [
                    'Giới tính',
                    mergedInfo.gender === 'MALE'
                      ? 'Nam'
                      : mergedInfo.gender === 'FEMALE'
                        ? 'Nữ'
                        : mergedInfo.gender || '—',
                  ],
                  ['Số điện thoại', mergedInfo.phone || mergedInfo.phoneNumber || '—'],
                  ['CCCD', mergedInfo.cccd || '—'],
                  ['Địa chỉ', mergedInfo.address || '—'],
                ].map(([k, v]) => (
                  <View key={k} style={styles.infoLine}>
                    <Text style={styles.infoKey}>{k}</Text>
                    <Text selectable style={styles.infoVal}>
                      {v}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={styles.card}>
                <Text style={styles.cardTitle}>Tiền sử Y khoa & Lưu ý</Text>
                {[
                  [
                    'Bệnh lý toàn thân',
                    Array.isArray(mergedInfo.systemicDiseases)
                      ? mergedInfo.systemicDiseases.join(', ')
                      : mergedInfo.systemicDisease || 'Không ghi nhận',
                  ],
                  ['Dị ứng thuốc / thức ăn', mergedInfo.allergies || 'Không ghi nhận'],
                  ['Thuốc đang sử dụng', mergedInfo.currentMedications || 'Không có'],
                  ['Tiền sử phẫu thuật', mergedInfo.surgicalHistory || 'Không có'],
                  [
                    'Liên hệ khẩn cấp',
                    mergedInfo.contactName
                      ? `${mergedInfo.contactName} (${mergedInfo.contactPhone || ''})`
                      : 'Chưa cập nhật',
                  ],
                ].map(([k, v]) => (
                  <View key={k} style={styles.infoLine}>
                    <Text style={styles.infoKey}>{k}</Text>
                    <Text style={styles.infoVal}>{v}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TAB 2: CLINICAL EXAMS */}
          {activeTab === 'EXAMS' && (
            <View style={{ gap: 12 }}>
              {exams.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có dữ liệu khám lâm sàng.</Text>
              ) : (
                exams.map((ex: any, idx: number) => {
                  const diagnoses = Array.isArray(ex.diagnoses)
                    ? ex.diagnoses
                    : ex.diagnosis
                      ? [ex.diagnosis]
                      : [];
                  const teeth = Array.isArray(ex.toothRecords) ? ex.toothRecords : [];
                  return (
                    <View key={ex.id || idx} style={styles.card}>
                      <View style={styles.rowBetween}>
                        <Text style={styles.badgeDate}>
                          {formatDate(ex.examinationDate || ex.createdAt)}
                        </Text>
                        <Text numberOfLines={1} style={styles.doctorName}>
                          {ex.dentistName ? formatDoctorName(ex.dentistName) : 'Bác sĩ điều trị'}
                        </Text>
                      </View>
                      <Text style={styles.examTitle}>
                        {ex.chiefComplaint || 'Khám răng tổng quát'}
                      </Text>
                      {ex.branchName ? (
                        <Text style={styles.subMeta}>Cơ sở: {ex.branchName}</Text>
                      ) : null}

                      {diagnoses.length > 0 ? (
                        <View style={styles.subBlock}>
                          <Text style={styles.subBlockLabel}>CHẨN ĐOÁN:</Text>
                          {diagnoses.map((d: any, dIdx: number) => {
                            const toothLbl = formatToothTag(d.toothPosition || d.toothNumber);
                            return (
                              <Text key={d.id || dIdx} style={styles.subBlockItem}>
                                • {d.diagnosisName || d.primaryDiagnosis || d.name || 'Chẩn đoán nha khoa'}
                                {toothLbl ? ` (${toothLbl})` : ''}
                              </Text>
                            );
                          })}
                        </View>
                      ) : null}

                      {teeth.length > 0 ? (
                        <View style={styles.subBlock}>
                          <Text style={styles.subBlockLabel}>TÌNH TRẠNG RĂNG GHI NHẬN:</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                            {teeth.map((t: any, tIdx: number) => {
                              const code = String(t.toothNumber || t.toothCode || '').replace(/^R/i, '');
                              return (
                                <View key={t.id || tIdx} style={styles.toothTag}>
                                  <Text style={styles.toothTagText}>
                                    R{code}: {t.toothStatus || t.condition || t.status || 'Theo dõi'}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 3: TREATMENT PLANS */}
          {activeTab === 'PLANS' && (
            <View style={{ gap: 14 }}>
              {plans.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có phác đồ điều trị nào.</Text>
              ) : (
                plans.map((plan: any, idx: number) => {
                  const phases: any[] = Array.isArray(plan.phases) ? plan.phases : [];
                  const doneCount = phases.filter((p) => p.status === 'COMPLETED').length;
                  const pct = phases.length > 0 ? Math.round((doneCount / phases.length) * 100) : 0;

                  return (
                    <View key={plan.id || idx} style={styles.card}>
                      <Text style={styles.planHeaderTitle}>
                        {plan.planName || `Kế hoạch điều trị #${idx + 1}`}
                      </Text>
                      <Text style={styles.subMeta}>
                        {plan.dentistName ? `${formatDoctorName(plan.dentistName)} • ` : ''}
                        Ngày lập: {formatDate(plan.startDate || plan.createdAt)}
                      </Text>

                      {/* Hộp tổng chi phí & tiến độ */}
                      <View style={styles.planSummaryStrip}>
                        <View style={styles.rowBetween}>
                          <Text style={styles.planCostLabel}>Tổng chi phí dự kiến</Text>
                          <Text style={styles.costHighlight}>
                            {formatMoney(plan.estimatedCost ?? plan.totalCost ?? 0)}
                          </Text>
                        </View>
                        {phases.length > 0 ? (
                          <View style={{ marginTop: 8 }}>
                            <View style={styles.progressTrack}>
                              <View style={[styles.progressFill, { width: `${pct}%` }]} />
                            </View>
                            <Text style={styles.progressCaption}>
                              Hoàn thành {doneCount}/{phases.length} giai đoạn ({pct}%)
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {phases.map((phase: any, pIdx: number) => {
                        const services = phase.treatmentServices || phase.services || [];
                        const isDone = phase.status === 'COMPLETED';
                        const isProg = phase.status === 'IN_PROGRESS';
                        const badgeBg = isDone ? '#ecfdf5' : isProg ? '#eff6ff' : '#f1f5f9';
                        const badgeColor = isDone
                          ? Colors.primaryDark
                          : isProg
                            ? '#1d4ed8'
                            : Colors.textSecondary;
                        const badgeLabel = isDone
                          ? 'Hoàn tất'
                          : isProg
                            ? 'Đang thực hiện'
                            : 'Dự kiến';

                        return (
                          <View key={phase.id || pIdx} style={styles.phaseBox}>
                            <View style={styles.phaseHeaderRow}>
                              <Text style={styles.phaseTitle}>
                                {formatPhaseTitle(phase.phaseName, pIdx)}
                              </Text>
                              <View style={[styles.phasePill, { backgroundColor: badgeBg }]}>
                                <Text style={[styles.phasePillText, { color: badgeColor }]}>
                                  {badgeLabel}
                                </Text>
                              </View>
                            </View>

                            {services.map((s: any, sIdx: number) => {
                              const toothLbl = formatToothTag(s.toothNumber || s.toothPosition);
                              const qty = s.quantity || 1;
                              return (
                                <View
                                  key={s.id || sIdx}
                                  style={[
                                    styles.serviceRow,
                                    sIdx > 0 && styles.serviceRowDivider,
                                  ]}>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.serviceName}>
                                      {s.serviceName || s.name || 'Dịch vụ điều trị'}
                                    </Text>
                                    <View style={styles.serviceMetaRow}>
                                      {toothLbl ? (
                                        <View style={styles.serviceToothBadge}>
                                          <Text style={styles.serviceToothText}>{toothLbl}</Text>
                                        </View>
                                      ) : null}
                                      <Text style={styles.serviceQtyText}>SL: {qty}</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.servicePrice}>
                                    {formatMoney(s.totalAmount ?? s.price)}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>
                        );
                      })}
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* TAB 4: PRESCRIPTIONS */}
          {activeTab === 'PRESCRIPTIONS' && (
            <View style={{ gap: 12 }}>
              <View style={styles.searchBox}>
                <Search size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm mã đơn, bác sĩ hoặc tên thuốc..."
                  placeholderTextColor={Colors.textMuted}
                  value={rxSearch}
                  onChangeText={setRxSearch}
                />
              </View>

              {filteredRx.length === 0 ? (
                <Text style={styles.emptyText}>Chưa có đơn thuốc nào.</Text>
              ) : (
                filteredRx.map((rx: any, idx: number) => {
                  const meds = rx.prescriptionDetails || rx.items || rx.medications || [];
                  return (
                    <Pressable
                      key={rx.id || idx}
                      style={styles.card}
                      onPress={() => setSelectedRx(rx)}>
                      <View style={styles.rowBetween}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Pill size={16} color={Colors.primary} />
                          <Text style={styles.rxCode}>
                            {rx.prescriptionCode || 'ĐƠN THUỐC'}
                          </Text>
                        </View>
                        <Text style={styles.subMeta}>
                          {formatDate(rx.prescriptionDate || rx.createdAt)}
                        </Text>
                      </View>
                      <Text style={styles.examTitle}>
                        {rx.prescriptionName || rx.diagnosis || 'Đơn thuốc điều trị nha khoa'}
                      </Text>
                      <Text style={styles.subMeta}>
                        {rx.dentistName || rx.prescriber
                          ? `${formatDoctorName(rx.dentistName || rx.prescriber)} • `
                          : ''}
                        {meds.length} loại thuốc
                      </Text>
                    </Pressable>
                  );
                })
              )}
            </View>
          )}

          {activeTab === 'XRAY' && <XrayResults analyses={xrays} error={xrayError} />}
        </ScrollView>
      )}

      {/* Prescription Detail Modal */}
      <Modal
        visible={Boolean(selectedRx)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedRx(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {selectedRx ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.rowBetween}>
                  <Text style={styles.modalTitle}>
                    {selectedRx.prescriptionName || 'Chi tiết Đơn thuốc'}
                  </Text>
                  <Pressable onPress={() => setSelectedRx(null)}>
                    <X size={20} color={Colors.text} />
                  </Pressable>
                </View>
                <Text style={[styles.subMeta, { marginTop: 4, marginBottom: 12 }]}>
                  Mã đơn: {selectedRx.prescriptionCode || '—'} • Ngày kê:{' '}
                  {formatDate(selectedRx.prescriptionDate || selectedRx.createdAt)}
                </Text>

                {(
                  selectedRx.prescriptionDetails ||
                  selectedRx.items ||
                  selectedRx.medications ||
                  []
                ).map((m: any, i: number) => (
                  <View key={m.id || i} style={styles.medItem}>
                    <View style={styles.rowBetween}>
                      <Text style={styles.medName}>
                        {i + 1}. {m.medicineName || m.name || m.medicine?.name}
                      </Text>
                      <Text style={styles.medQty}>
                        {m.quantity} {m.unit || m.medicine?.unit || 'viên'}
                      </Text>
                    </View>
                    <Text style={styles.medDosage}>
                      Cách dùng: {m.dosage || m.usage || m.instructions || 'Theo chỉ dẫn bác sĩ'}
                    </Text>
                  </View>
                ))}

                {selectedRx.doctorAdvice || selectedRx.advice ? (
                  <View style={styles.adviceBox}>
                    <Text style={styles.adviceTitle}>LỜI DẶN CỦA BÁC SĨ</Text>
                    <Text style={styles.adviceText}>
                      {stripHtml(selectedRx.doctorAdvice || selectedRx.advice)}
                    </Text>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <FamilyProfilesModal
        visible={familyModalOpen}
        onClose={() => setFamilyModalOpen(false)}
        profiles={profiles}
        selectedPatientId={selectedPatientId || primaryPatientId || ''}
        primaryPatientId={primaryPatientId || ''}
        primaryPhone={user.phone || patientInfo?.phone || ''}
        onSelectProfile={(id) => { setSelectedRecordId(''); setRecords([]); setSelectedPatientId(id); }}
        onReloadProfiles={loadRelationships}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  guestBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  guestTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  guestSub: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', marginTop: 6 },
  loginBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginBtnText: { color: '#fff', fontWeight: '800' },
  profileBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  recordPicker: { paddingHorizontal: 16, paddingTop: 12, gap: 7 },
  recordPickerLabel: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary },
  recordOption: { borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card, paddingHorizontal: 10, paddingVertical: 8 },
  recordOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  recordOptionText: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  recordOptionTextActive: { color: Colors.primaryDark },
  profileIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBarLabel: { fontSize: 10, fontWeight: '800', color: Colors.textSecondary },
  profileBarName: { fontSize: 14.5, fontWeight: '800', color: Colors.text },
  switchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  switchPillText: { fontSize: 11.5, fontWeight: '800', color: Colors.primaryDark },
  tabsScroll: { flexGrow: 0, flexShrink: 0, maxHeight: 72 },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabBtn: {
    minHeight: 42,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabBtnText: { fontSize: 12, fontWeight: '800', color: Colors.textSecondary },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: { fontSize: 15.5, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  infoLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoKey: { fontSize: 12.5, color: Colors.textSecondary, fontWeight: '600' },
  infoVal: { flex: 1, fontSize: 13, color: Colors.text, fontWeight: '700', textAlign: 'right' },
  emptyText: { textAlign: 'center', color: Colors.textSecondary, marginTop: 32, fontSize: 13.5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  badgeDate: {
    fontSize: 11.5,
    fontWeight: '800',
    color: Colors.primaryDark,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  doctorName: { fontSize: 12.5, fontWeight: '700', color: Colors.textSecondary, flexShrink: 1 },
  examTitle: { fontSize: 15, fontWeight: '800', color: Colors.text, marginTop: 8 },
  subMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 3 },
  subBlock: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subBlockLabel: { fontSize: 10.5, fontWeight: '800', color: Colors.textSecondary },
  subBlockItem: { fontSize: 12.5, color: Colors.text, marginTop: 3, fontWeight: '600' },
  toothTag: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  toothTagText: { fontSize: 11.5, fontWeight: '700', color: Colors.text },
  planHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.text,
    lineHeight: 22,
  },
  planSummaryStrip: {
    marginTop: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  planCostLabel: { fontSize: 12, fontWeight: '700', color: Colors.primaryDark },
  costHighlight: { fontSize: 15.5, fontWeight: '900', color: Colors.primary },
  progressTrack: {
    height: 7,
    borderRadius: 4,
    backgroundColor: '#d1fae5',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  progressCaption: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginTop: 5,
  },
  phaseBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phaseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  phaseTitle: { fontSize: 13.5, fontWeight: '800', color: Colors.text, flex: 1 },
  phasePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  phasePillText: { fontSize: 11, fontWeight: '800' },
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 8,
  },
  serviceRowDivider: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  serviceName: { fontSize: 13, fontWeight: '700', color: Colors.text, lineHeight: 18 },
  serviceMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  serviceToothBadge: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  serviceToothText: { fontSize: 11, fontWeight: '700', color: Colors.primaryDark },
  serviceQtyText: { fontSize: 11.5, fontWeight: '600', color: Colors.textSecondary },
  servicePrice: { fontSize: 13, fontWeight: '800', color: Colors.text },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: Colors.text, paddingVertical: 0 },
  rxCode: { fontSize: 12, fontWeight: '800', color: Colors.primaryDark },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, flex: 1 },
  medItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 4,
  },
  medName: { fontSize: 14, fontWeight: '800', color: Colors.text, flex: 1 },
  medQty: { fontSize: 13, fontWeight: '800', color: Colors.primaryDark },
  medDosage: { fontSize: 12.5, color: Colors.textSecondary },
  adviceBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1,
    borderColor: Colors.primaryBorder,
  },
  adviceTitle: { fontSize: 11, fontWeight: '800', color: Colors.primaryDark, marginBottom: 4 },
  adviceText: { fontSize: 13, color: Colors.text, lineHeight: 19 },
});
