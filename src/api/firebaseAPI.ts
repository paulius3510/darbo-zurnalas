import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  hourlyRate: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  uid: string;
}

export interface WorkEntry {
  id: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes: string;
  uid: string;
}

export interface MaterialEntry {
  id: string;
  projectId: string;
  date: string;
  name: string;
  quantity: string;
  amount: number;
  uid: string;
}

export interface PublicInvoice {
  name: string;
  client: string;
  address: string;
  hourlyRate: number;
  paidAmount: number;
  totalHours: number;
  laborCost: number;
  workEntries: { date: string; hours: number }[];
  materials: { date: string; name: string; quantity: string; amount: number }[];
  totalMaterials: number;
  totalCost: number;
  updatedAt: string;
}

export interface AllData {
  projects: Project[];
  workEntries: WorkEntry[];
  materials: MaterialEntry[];
}

// --- Read ---

export async function getAllData(uid: string): Promise<AllData> {
  const [projectsSnap, workSnap, materialsSnap] = await Promise.all([
    getDocs(query(collection(db, 'projects'), where('uid', '==', uid))),
    getDocs(query(collection(db, 'workEntries'), where('uid', '==', uid))),
    getDocs(query(collection(db, 'materials'), where('uid', '==', uid))),
  ]);

  return {
    projects: projectsSnap.docs.map((d) => d.data() as Project),
    workEntries: workSnap.docs.map((d) => d.data() as WorkEntry),
    materials: materialsSnap.docs.map((d) => d.data() as MaterialEntry),
  };
}

export async function getPublicInvoice(projectId: string): Promise<PublicInvoice | null> {
  const snap = await getDoc(doc(db, 'publicInvoices', projectId));
  return snap.exists() ? (snap.data() as PublicInvoice) : null;
}

// --- Projects ---

export async function saveProject(project: Project): Promise<void> {
  await setDoc(doc(db, 'projects', project.id), project);
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', id));
}

// --- Work Entries ---

export async function saveWorkEntry(entry: WorkEntry): Promise<void> {
  await setDoc(doc(db, 'workEntries', entry.id), entry);
}

export async function deleteWorkEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, 'workEntries', id));
}

// --- Materials ---

export async function saveMaterial(material: MaterialEntry): Promise<void> {
  await setDoc(doc(db, 'materials', material.id), material);
}

export async function deleteMaterial(id: string): Promise<void> {
  await deleteDoc(doc(db, 'materials', id));
}

// --- Public Invoice ---

export async function publishInvoice(
  project: { name: string; client: string; address: string; hourlyRate: number; paidAmount: number; id: string },
  workEntries: { date: string; hours: number }[],
  materials: { date: string; name: string; quantity: string; amount: number }[]
): Promise<void> {
  const totalHours = workEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalMaterials = materials.reduce((sum, m) => sum + m.amount, 0);
  const laborCost = totalHours * project.hourlyRate;

  const invoice: PublicInvoice = {
    name: project.name,
    client: project.client,
    address: project.address,
    hourlyRate: project.hourlyRate,
    paidAmount: project.paidAmount || 0,
    totalHours,
    laborCost,
    workEntries,
    materials,
    totalMaterials,
    totalCost: laborCost + totalMaterials,
    updatedAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'publicInvoices', project.id), invoice);
}
