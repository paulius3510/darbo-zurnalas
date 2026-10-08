// Grynos funkcijos, kurios paverčia programos objektus į Firestore dokumentus.
// Laukų sąrašai ir tipai privalo sutapti su firestore.rules (validProject /
// validWorkEntry / validMaterial): taisyklės atmeta papildomus laukus ir
// neteisingus tipus, todėl viskas, kas įrašoma, pereina per šias funkcijas.

export type ProjectDoc = {
  id: string;
  name: string;
  client: string;
  address: string;
  hourlyRate: number;
  paidAmount: number;
  status: string; // rules allow only 'active' | 'completed'; toProjectDoc normalizes
  isPublic: boolean;
  createdAt: string;
  uid: string;
};

export type WorkEntryDoc = {
  id: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes: string;
  uid: string;
};

export type MaterialDoc = {
  id: string;
  projectId: string;
  date: string;
  name: string;
  quantity: string;
  amount: number;
  uid: string;
};

const str = (v: unknown): string => (v === undefined || v === null ? '' : String(v));
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export function toProjectDoc(p: Record<string, unknown>): ProjectDoc {
  return {
    id: str(p.id),
    name: str(p.name),
    client: str(p.client),
    address: str(p.address),
    hourlyRate: num(p.hourlyRate),
    paidAmount: num(p.paidAmount),
    status: p.status === 'completed' ? 'completed' : 'active',
    isPublic: p.isPublic === true,
    createdAt: str(p.createdAt),
    uid: str(p.uid),
  };
}

export function toWorkEntryDoc(e: Record<string, unknown>): WorkEntryDoc {
  return {
    id: str(e.id),
    projectId: str(e.projectId),
    date: str(e.date),
    startTime: str(e.startTime),
    endTime: str(e.endTime),
    hours: num(e.hours),
    notes: str(e.notes),
    uid: str(e.uid),
  };
}

export function toMaterialDoc(m: Record<string, unknown>): MaterialDoc {
  return {
    id: str(m.id),
    projectId: str(m.projectId),
    date: str(m.date),
    name: str(m.name),
    quantity: str(m.quantity),
    amount: num(m.amount),
    uid: str(m.uid),
  };
}
