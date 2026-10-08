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
import {
  toMaterialDoc,
  toProjectDoc,
  toWorkEntryDoc,
  type MaterialDoc,
  type ProjectDoc,
  type WorkEntryDoc,
} from './documents';

// Firestore document shapes live in documents.ts (shared with the mappers
// and mirrored by firestore.rules); these aliases keep the public API names.
export type Project = ProjectDoc;
export type WorkEntry = WorkEntryDoc;
export type MaterialEntry = MaterialDoc;

export interface PublicProjectData {
  project: Project;
  workEntries: WorkEntry[];
  materials: MaterialEntry[];
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

export async function getPublicProjectData(projectId: string): Promise<PublicProjectData | null> {
  const projectSnap = await getDoc(doc(db, 'projects', projectId));
  if (!projectSnap.exists()) return null;

  const [workSnap, materialsSnap] = await Promise.all([
    getDocs(query(collection(db, 'workEntries'), where('projectId', '==', projectId))),
    getDocs(query(collection(db, 'materials'), where('projectId', '==', projectId))),
  ]);

  return {
    project: projectSnap.data() as Project,
    workEntries: workSnap.docs.map((d) => d.data() as WorkEntry),
    materials: materialsSnap.docs.map((d) => d.data() as MaterialEntry),
  };
}

// --- Projects ---

export async function saveProject(project: Project): Promise<void> {
  await setDoc(doc(db, 'projects', project.id), toProjectDoc(project));
}

export async function deleteProject(id: string): Promise<void> {
  await deleteDoc(doc(db, 'projects', id));
}

// --- Work Entries ---

export async function saveWorkEntry(entry: WorkEntry): Promise<void> {
  await setDoc(doc(db, 'workEntries', entry.id), toWorkEntryDoc(entry));
}

export async function deleteWorkEntry(id: string): Promise<void> {
  await deleteDoc(doc(db, 'workEntries', id));
}

// --- Materials ---

export async function saveMaterial(material: MaterialEntry): Promise<void> {
  await setDoc(doc(db, 'materials', material.id), toMaterialDoc(material));
}

export async function deleteMaterial(id: string): Promise<void> {
  await deleteDoc(doc(db, 'materials', id));
}

