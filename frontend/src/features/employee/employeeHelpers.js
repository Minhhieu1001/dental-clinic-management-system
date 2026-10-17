export const ROLE_OPTIONS = [
  { value: 'Bác sĩ', label: 'Bác sĩ' },
  { value: 'Lễ tân', label: 'Lễ tân' },
  { value: 'Quản trị viên', label: 'Quản trị viên' },
  { value: 'Kho', label: 'Quản lý kho' },
  { value: 'Nhân viên', label: 'Nhân viên' },
];

export const mapStatus = (statusUser) => {
  if (statusUser === 'BLOCK') return 'locked';
  if (statusUser === 'INACTIVE') return 'inactive';
  return 'active';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Chưa cập nhật';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const mapGender = (gender) => {
  if (gender === 'MALE' || gender === 'Nam') return 'Nam';
  if (gender === 'FEMALE' || gender === 'Nữ') return 'Nữ';
  return 'Khác';
};

export const mapRole = (roleStr) => {
  if (!roleStr) return 'Nhân viên';
  const role = roleStr.toUpperCase();
  if (role === 'DENTIST') return 'Bác sĩ';
  if (role === 'RECEPTIONIST' || role === 'LỄ TÂN') return 'Lễ tân';
  if (role === 'ADMIN') return 'Quản trị viên';
  if (role === 'WAREHOUSE') return 'Kho';
  if (role === 'EMPLOYEE') return 'Nhân viên';
  return roleStr;
};

export const mapEmployeeFromApi = (employee) => {
  const roleStr = employee.position || employee.role || 'EMPLOYEE';
  const displayRole = mapRole(roleStr);

  const statusUserEnum = employee.statusUser;
  
  return {
    ...employee,
    name: employee.fullName || employee.username || employee.name,
    email: employee.email || '',
    phone: employee.phone || '',
    avatar: employee.avatar || employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.username || 'User')}&background=random`,
    displayStatus: mapStatus(statusUserEnum),
    displayRole: displayRole,
    role: displayRole, // Also override raw role for consistency in UI
    originalRole: roleStr, // Keep original role for editing
    originalUserRole: employee.role, // Save the actual User enum role
    displayCreatedAt: formatDate(employee.createdAt || employee.hireDate),
    displayGender: mapGender(employee.gender),
    address: employee.address || '',
    branchId: employee.branchId || '',
    branchName: employee.branchName || 'Chưa phân chi nhánh',
  };
};

export const calcStatsFromEmployees = (employees) => {
  const active = employees.filter((e) => e.displayStatus === 'active').length;
  const locked = employees.filter((e) => e.displayStatus === 'locked').length;
  const inactive = employees.filter((e) => e.displayStatus === 'inactive').length;

  return {
    total: employees.length,
    active,
    locked,
    inactive
  };
};
