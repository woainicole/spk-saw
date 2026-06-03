export interface Criteria {
  id: string;
  name: string;
  type: 'benefit' | 'cost';
  weight: number;
  description?: string;
  uid?: string;
  period?: string; // "YYYY-MM"
}

export interface Alternative {
  id: string;
  name: string;
  values: Record<string, number>;
  uid?: string;
  period?: string; // "YYYY-MM"
}
