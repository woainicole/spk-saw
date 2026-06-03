const MONTHS_ID = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember'
];

export const getCurrentPeriod = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const getPeriodLabel = (period: string): string => {
  const [year, month] = period.split('-');
  return `${MONTHS_ID[parseInt(month) - 1]} ${year}`;
};

export const getPrevPeriod = (period: string): string => {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const getNextPeriod = (period: string): string => {
  const [y, m] = period.split('-').map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Minimum period = bulan saat akun dibuat (dari Firebase Auth metadata.creationTime) */
export const getMinPeriod = (creationTime?: string | null): string => {
  if (!creationTime) return getCurrentPeriod();
  const d = new Date(creationTime);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
