import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, ArrowLeft, Clock, Package, Calculator, Download, X, Edit2, Check, LogOut } from 'lucide-react';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from './firebase';
import * as FirebaseAPI from './api/firebaseAPI';

interface WorkEntry {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes: string;
}

interface MaterialEntry {
  id: string;
  date: string;
  name: string;
  quantity: string;
  amount: number;
}

interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  hourlyRate: number;
  paidAmount: number;
  status: string;
  workEntries: WorkEntry[];
  materials: MaterialEntry[];
  createdAt: string;
}

const generateId = () => Math.random().toString(36).substr(2, 9);
const getTodayDate = () => new Date().toISOString().split('T')[0];

const calculateHours = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(0, Math.round(diff / 60 * 100) / 100);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('is-IS').format(amount) + ' kr';
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const sortByDate = (items: any[]) => {
  return [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const groupByDate = (items: any[]) => {
  const groups: { [key: string]: any[] } = {};
  items.forEach(item => {
    const date = item.date || getTodayDate();
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });
  return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
};

const groupWorkEntriesByDate = (entries: { date: string; hours: number }[]) => {
  const groups: { [key: string]: number } = {};
  entries.forEach(entry => {
    const date = entry.date || getTodayDate();
    groups[date] = (groups[date] || 0) + entry.hours;
  });
  return Object.entries(groups)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, hours]) => ({ date, hours }));
};

// Public Invoice View Component (for clients)
function PublicInvoiceView({ projectId }: { projectId: string }) {
  const [data, setData] = useState<FirebaseAPI.PublicProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    FirebaseAPI.getPublicProjectData(projectId).then(result => {
      if (result) {
        setData(result);
      } else {
        setError('Verkefni fannst ekki');
      }
      setLoading(false);
    }).catch(() => {
      setError('Villa við að hlaða gögnum');
      setLoading(false);
    });
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Hleður...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Villa'}</p>
          <p className="text-gray-500">Vinsamlegast athugaðu slóðina</p>
        </div>
      </div>
    );
  }

  const { project, workEntries, materials } = data;
  const totalHours = workEntries.reduce((sum, e) => sum + e.hours, 0);
  const totalMaterials = materials.reduce((sum, m) => sum + m.amount, 0);
  const laborCost = totalHours * project.hourlyRate;
  const totalCost = laborCost + totalMaterials;
  const groupedWork = groupWorkEntriesByDate(workEntries);
  const sortedMaterials = sortByDate(materials);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white p-5">
            <h1 className="text-2xl font-light tracking-widest mb-2">REIKNINGUR</h1>
            <div className="text-sm opacity-90">Paulius Grigaliunas | Sími: 857-2335</div>
          </div>

          <div className="bg-gray-50 p-4 text-sm grid grid-cols-2 gap-2">
            <span className="text-gray-500">Verkefni</span>
            <span className="font-medium">{project.name || '-'}</span>
            <span className="text-gray-500">Viðskiptavinur</span>
            <span className="font-medium">{project.client}</span>
            <span className="text-gray-500">Heimilisfang</span>
            <span className="font-medium">{project.address}</span>
          </div>

          <div className="p-4 border-b">
            <h2 className="text-xs font-semibold tracking-wider text-gray-500 mb-3">VINNUSTUNDIR</h2>
            {groupedWork.length === 0 ? (
              <p className="text-gray-400 text-sm">Engar vinnustundir skráðar</p>
            ) : (
              groupedWork.map((entry, idx) => (
                <div key={idx} className="py-2 text-sm border-b border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{formatDate(entry.date)}</span>
                    <span className="font-medium">{entry.hours} klst</span>
                  </div>
                </div>
              ))
            )}
            <div className="flex justify-between mt-3 pt-2 border-t-2 text-sm font-semibold">
              <span>Samtals: {totalHours} klst ({formatCurrency(project.hourlyRate)}/klst)</span>
              <span>{formatCurrency(laborCost)}</span>
            </div>
          </div>

          <div className="p-4 border-b">
            <h2 className="text-xs font-semibold tracking-wider text-gray-500 mb-3">EFNI</h2>
            {sortedMaterials.length === 0 ? (
              <p className="text-gray-400 text-sm">Ekkert efni skráð</p>
            ) : (
              sortedMaterials.map((m, idx) => (
                <div key={idx} className="flex justify-between py-2 text-sm border-b border-gray-100">
                  <span className="text-gray-600 w-24">{formatDate(m.date)}</span>
                  <span className="flex-1 mx-3 truncate">{m.name} {m.quantity && <span className="text-gray-400">({m.quantity})</span>}</span>
                  <span className="font-medium">{formatCurrency(m.amount)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between mt-3 pt-2 border-t-2 text-sm font-semibold">
              <span>Samtals efni</span>
              <span>{formatCurrency(totalMaterials)}</span>
            </div>
          </div>

          <div className="bg-gray-800 text-white p-5 text-center">
            <div className="text-xs tracking-widest opacity-80">HEILDARUPPHÆÐ</div>
            <div className="text-3xl font-light mt-1">{formatCurrency(totalCost)}</div>
          </div>

          {(project.paidAmount || 0) > 0 && (
            <div className="p-4 border-t">
              <div className="flex justify-between py-2 text-sm">
                <span className="text-gray-600">Greitt</span>
                <span className="font-medium text-green-600">- {formatCurrency(project.paidAmount)}</span>
              </div>
              <div className="flex justify-between py-2 text-lg font-bold border-t-2 mt-2 pt-2">
                <span>Eftirstöðvar</span>
                <span className="text-blue-600">{formatCurrency(totalCost - project.paidAmount)}</span>
              </div>
            </div>
          )}

          <div className="print-hidden p-4">
            <button
              onClick={() => window.print()}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
            >
              Prenta / Vista PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkHoursJournal() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentView, setCurrentView] = useState<string>('list');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', client: '', address: '', hourlyRate: 0 });
  const [activeTab, setActiveTab] = useState<string>('work');
  const [showImport, setShowImport] = useState(false);
  const [importData, setImportData] = useState('');
  const [showInvoice, setShowInvoice] = useState(false);
  const [showEditProject, setShowEditProject] = useState(false);
  const [editProjectData, setEditProjectData] = useState({ name: '', client: '', address: '', hourlyRate: 0, paidAmount: 0, status: 'active' });
  const [publicViewId, setPublicViewId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);

  // Check for public view URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('v');
    if (viewId) {
      setPublicViewId(viewId);
    }
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  // Load data when user is authenticated
  useEffect(() => {
    if (!user) return;
    FirebaseAPI.getAllData(user.uid).then(data => {
      const projectsWithEntries = data.projects.map(p => ({
        ...p,
        paidAmount: p.paidAmount || 0,
        workEntries: data.workEntries
          .filter(e => e.projectId === p.id)
          .map(e => ({ id: e.id, date: e.date, startTime: e.startTime, endTime: e.endTime, hours: e.hours, notes: e.notes })),
        materials: data.materials
          .filter(m => m.projectId === p.id)
          .map(m => ({ id: m.id, date: m.date, name: m.name, quantity: m.quantity, amount: m.amount })),
      }));
      setProjects(projectsWithEntries);
    });
  }, [user]);

  const handleLogin = () => signInWithPopup(auth, googleProvider);
  const handleLogout = () => signOut(auth);

  const getProjectSummary = (project: Project) => {
    const totalHours = project.workEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalMaterials = project.materials.reduce((sum, m) => sum + m.amount, 0);
    const laborCost = totalHours * project.hourlyRate;
    return { totalHours, totalMaterials, laborCost, totalCost: laborCost + totalMaterials };
  };

  const addProject = async () => {
    if (!newProject.name && !newProject.client) return;
    if (!user) return;
    const project: Project = {
      id: generateId(),
      ...newProject,
      paidAmount: 0,
      status: 'active',
      workEntries: [],
      materials: [],
      createdAt: new Date().toISOString()
    };
    setProjects([...projects, project]);
    setNewProject({ name: '', client: '', address: '', hourlyRate: 0 });
    setShowNewProject(false);

    await FirebaseAPI.saveProject({ ...project, uid: user.uid });
  };

  const deleteProject = async (id: string) => {
    if (!confirm('Eyða verkefni?')) return;
    if (!user) return;

    const project = projects.find(p => p.id === id);
    if (project) {
      const deleteOps = [
        ...project.workEntries.map(e => FirebaseAPI.deleteWorkEntry(e.id)),
        ...project.materials.map(m => FirebaseAPI.deleteMaterial(m.id)),
        FirebaseAPI.deleteProject(id),
      ];
      await Promise.all(deleteOps);
    }

    setProjects(projects.filter(p => p.id !== id));
    if (selectedProject?.id === id) {
      setSelectedProject(null);
      setCurrentView('list');
    }
  };

  const updateProject = (updated: Project) => {
    setProjects(projects.map(p => p.id === updated.id ? updated : p));
    setSelectedProject(updated);
  };

  const openEditProject = () => {
    if (!selectedProject) return;
    setEditProjectData({
      name: selectedProject.name,
      client: selectedProject.client,
      address: selectedProject.address,
      hourlyRate: selectedProject.hourlyRate,
      paidAmount: selectedProject.paidAmount || 0,
      status: selectedProject.status || 'active'
    });
    setShowEditProject(true);
  };

  const saveEditProject = async () => {
    if (!selectedProject || !user) return;
    const updated = {
      ...selectedProject,
      name: editProjectData.name,
      client: editProjectData.client,
      address: editProjectData.address,
      hourlyRate: editProjectData.hourlyRate,
      paidAmount: editProjectData.paidAmount,
      status: editProjectData.status
    };
    updateProject(updated);
    setShowEditProject(false);

    await FirebaseAPI.saveProject({
      id: updated.id,
      name: updated.name,
      client: updated.client,
      address: updated.address,
      hourlyRate: updated.hourlyRate,
      paidAmount: updated.paidAmount,
      status: updated.status,
      createdAt: updated.createdAt,
      uid: user.uid,
    });
  };

  const addWorkEntry = async () => {
    if (!selectedProject || !user) return;
    const entry: WorkEntry = {
      id: generateId(),
      date: getTodayDate(),
      startTime: '',
      endTime: '',
      hours: 0,
      notes: ''
    };
    updateProject({ ...selectedProject, workEntries: [entry, ...selectedProject.workEntries] });
    setEditingEntryId(entry.id);

    await FirebaseAPI.saveWorkEntry({
      ...entry,
      projectId: selectedProject.id,
      uid: user.uid,
    });
  };

  const updateWorkEntry = (entryId: string, field: string, value: string) => {
    if (!selectedProject) return;
    const entries = selectedProject.workEntries.map(e => {
      if (e.id !== entryId) return e;
      const updated: WorkEntry = { ...e, [field]: value };
      if (field === 'startTime' || field === 'endTime') {
        updated.hours = calculateHours(
          field === 'startTime' ? value : e.startTime,
          field === 'endTime' ? value : e.endTime
        );
      }
      return updated;
    });

    updateProject({ ...selectedProject, workEntries: entries });

    if (field === 'date' || field === 'startTime' || field === 'endTime') {
      const entry = entries.find(e => e.id === entryId);
      if (entry && user) {
        FirebaseAPI.saveWorkEntry({ ...entry, projectId: selectedProject.id, uid: user.uid });
      }
    }
  };

  const syncWorkEntryOnBlur = (entryId: string) => {
    if (!selectedProject || !user) return;
    const entry = selectedProject.workEntries.find(e => e.id === entryId);
    if (entry) {
      FirebaseAPI.saveWorkEntry({ ...entry, projectId: selectedProject.id, uid: user.uid });
    }
  };

  const deleteWorkEntry = async (entryId: string) => {
    if (!selectedProject) return;
    updateProject({ ...selectedProject, workEntries: selectedProject.workEntries.filter(e => e.id !== entryId) });
    await FirebaseAPI.deleteWorkEntry(entryId);
  };

  const addMaterial = async () => {
    if (!selectedProject || !user) return;
    const material: MaterialEntry = {
      id: generateId(),
      date: getTodayDate(),
      name: '',
      quantity: '',
      amount: 0
    };
    updateProject({ ...selectedProject, materials: [material, ...selectedProject.materials] });
    setEditingEntryId(material.id);

    await FirebaseAPI.saveMaterial({
      ...material,
      projectId: selectedProject.id,
      uid: user.uid,
    });
  };

  const updateMaterial = (materialId: string, field: string, value: string | number) => {
    if (!selectedProject) return;
    const materials = selectedProject.materials.map(m => {
      if (m.id === materialId) {
        return { ...m, [field]: field === 'amount' ? Number(value) || 0 : value };
      }
      return m;
    });

    updateProject({ ...selectedProject, materials });

    if (field === 'date') {
      const material = materials.find(m => m.id === materialId);
      if (material && user) {
        FirebaseAPI.saveMaterial({ ...material, projectId: selectedProject.id, uid: user.uid });
      }
    }
  };

  const syncMaterialOnBlur = (materialId: string) => {
    if (!selectedProject || !user) return;
    const material = selectedProject.materials.find(m => m.id === materialId);
    if (material) {
      FirebaseAPI.saveMaterial({ ...material, projectId: selectedProject.id, uid: user.uid });
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!selectedProject) return;
    updateProject({ ...selectedProject, materials: selectedProject.materials.filter(m => m.id !== materialId) });
    await FirebaseAPI.deleteMaterial(materialId);
  };

  const handleImport = async () => {
    if (!selectedProject || !importData.trim() || !user) return;
    try {
      const data = JSON.parse(importData);
      let updated = { ...selectedProject };
      const newMaterialsList: MaterialEntry[] = [];
      const newWorkList: WorkEntry[] = [];

      if (data.efni && Array.isArray(data.efni)) {
        const newMaterials = data.efni.map((m: any) => ({
          id: generateId(),
          date: m.dags || m.date || getTodayDate(),
          name: m.heiti || m.name || '',
          quantity: m.magn || m.quantity || '',
          amount: Number(m.verd || m.amount) || 0
        }));
        newMaterialsList.push(...newMaterials);
        updated.materials = [...updated.materials, ...newMaterials];
      }
      if (data.vinna && Array.isArray(data.vinna)) {
        const newWork = data.vinna.map((w: any) => {
          const startTime = w.byrjun || w.start || '08:00';
          const endTime = w.lok || w.end || '16:00';
          const hours = w.stundir || w.hours || calculateHours(startTime, endTime);
          return {
            id: generateId(),
            date: w.dags || w.date || getTodayDate(),
            startTime,
            endTime,
            hours,
            notes: w.athugasemd || w.notes || ''
          };
        });
        newWorkList.push(...newWork);
        updated.workEntries = [...updated.workEntries, ...newWork];
      }
      updateProject(updated);

      await Promise.all([
        ...newMaterialsList.map(m =>
          FirebaseAPI.saveMaterial({ ...m, projectId: selectedProject.id, uid: user.uid })
        ),
        ...newWorkList.map(e =>
          FirebaseAPI.saveWorkEntry({ ...e, projectId: selectedProject.id, uid: user.uid })
        ),
      ]);

      setImportData('');
      setShowImport(false);
      alert('Gögn flutt inn!');
    } catch (e) {
      alert('Villa í JSON sniði');
    }
  };

  const copyPublicUrl = () => {
    if (!selectedProject) return;
    const url = `${window.location.origin}${window.location.pathname}?v=${selectedProject.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Public Invoice View (for clients)
  if (publicViewId) {
    return <PublicInvoiceView projectId={publicViewId} />;
  }

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Verkefnaskrá</h1>
          <p className="text-gray-500 mb-6">Skráðu þig inn til að halda áfram</p>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors"
          >
            Innskráning með Google
          </button>
        </div>
      </div>
    );
  }

  // Project List View
  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Verkefnaskrá</h1>
            <div className="flex gap-2">
              <button onClick={() => setShowNewProject(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
                <Plus size={20} /> Nýtt verkefni
              </button>
              <button onClick={handleLogout} className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg" title="Útskrá">
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {showNewProject && (
            <div className="bg-white p-4 rounded-lg shadow-md border">
              <h3 className="font-semibold mb-3">Nýtt verkefni</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input type="text" placeholder="Heiti verkefnis" value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })} className="border rounded-lg px-3 py-2" />
                <input type="text" placeholder="Viðskiptavinur" value={newProject.client} onChange={e => setNewProject({ ...newProject, client: e.target.value })} className="border rounded-lg px-3 py-2" />
                <input type="text" placeholder="Heimilisfang" value={newProject.address} onChange={e => setNewProject({ ...newProject, address: e.target.value })} className="border rounded-lg px-3 py-2" />
                <input type="number" placeholder="Tímagjald (kr/klst)" value={newProject.hourlyRate || ''} onChange={e => setNewProject({ ...newProject, hourlyRate: Number(e.target.value) })} className="border rounded-lg px-3 py-2" />
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={addProject} className="bg-green-600 text-white px-4 py-2 rounded-lg">Vista</button>
                <button onClick={() => setShowNewProject(false)} className="bg-gray-300 px-4 py-2 rounded-lg">Hætta við</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {projects.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                <p>Engin verkefni skráð</p>
              </div>
            ) : (
              [...projects]
                .sort((a, b) => {
                  if ((a.status === 'completed') !== (b.status === 'completed')) {
                    return a.status === 'completed' ? 1 : -1;
                  }
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                .map(project => (
                <div key={project.id} onClick={() => { setSelectedProject(project); setCurrentView('project'); }} className={`bg-white p-4 rounded-lg shadow-md border cursor-pointer hover:shadow-lg ${project.status === 'completed' ? 'opacity-60' : ''}`}>
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{project.name || project.client}</h3>
                    {project.name && project.client && <p className="text-gray-600">{project.client}</p>}
                    <p className="text-gray-500 text-sm">{project.address}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {project.status === 'completed'
                      ? <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">Lokið</span>
                      : <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Virkt</span>
                    }
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // Project Detail View
  if (currentView === 'project' && selectedProject) {
    const summary = getProjectSummary(selectedProject);
    const workGroups = groupByDate(selectedProject.workEntries);
    const materialGroups = groupByDate(selectedProject.materials);

    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentView('list')} className="p-2 hover:bg-gray-200 rounded-lg">
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-800">{selectedProject.name || selectedProject.client || 'Verkefni'}</h1>
              <p className="text-gray-600">{selectedProject.client} - {selectedProject.address}</p>
            </div>
            <button onClick={openEditProject} className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300">
              <Edit2 size={20} />
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-blue-600 mb-1"><Clock size={18} /> <span className="text-sm">Vinnustundir</span></div>
              <p className="text-xl font-bold text-blue-800">{summary.totalHours} klst</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-green-600 mb-1"><Calculator size={18} /> <span className="text-sm">Laun</span></div>
              <p className="text-xl font-bold text-green-800">{formatCurrency(summary.laborCost)}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-orange-600 mb-1"><Package size={18} /> <span className="text-sm">Efni</span></div>
              <p className="text-xl font-bold text-orange-800">{formatCurrency(summary.totalMaterials)}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-purple-600 mb-1"><FileText size={18} /> <span className="text-sm">Samtals</span></div>
              <p className="text-xl font-bold text-purple-800">{formatCurrency(summary.totalCost)}</p>
            </div>
          </div>

          {/* Hourly Rate */}
          <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
            <span className="text-gray-600">Tímagjald:</span>
            <span className="font-semibold">{formatCurrency(selectedProject.hourlyRate)}/klst</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button onClick={() => setShowInvoice(true)} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
              <FileText size={18} /> Reikningur
            </button>
            <button onClick={() => setShowImport(true)} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
              <Download size={18} /> Flytja inn
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b">
            <button onClick={() => setActiveTab('work')} className={`flex-1 py-2 text-center font-medium ${activeTab === 'work' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
              Vinnustundir
            </button>
            <button onClick={() => setActiveTab('materials')} className={`flex-1 py-2 text-center font-medium ${activeTab === 'materials' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}>
              Efni
            </button>
          </div>

          {/* Work Tab */}
          {activeTab === 'work' && (
            <div className="space-y-3">
              <button onClick={addWorkEntry} className="w-full flex items-center justify-center gap-2 bg-blue-100 text-blue-700 py-2 rounded-lg hover:bg-blue-200">
                <Plus size={18} /> Bæta við vinnudegi
              </button>
              {selectedProject.workEntries.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Engar vinnustundir skráðar</p>
              ) : (
                workGroups.map(([date, entries]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                      <Clock size={14} />
                      {formatDate(date)}
                      <span className="text-gray-400 ml-auto">
                        {(entries as WorkEntry[]).reduce((sum, e) => sum + e.hours, 0)} klst
                      </span>
                    </div>
                    {(entries as WorkEntry[]).map(entry => (
                      <div key={entry.id} className="bg-white p-3 rounded-lg border shadow-sm ml-2">
                        {editingEntryId === entry.id ? (
                          <>
                            <div className="flex flex-wrap gap-2 items-center">
                              <input type="date" value={entry.date} onChange={e => updateWorkEntry(entry.id, 'date', e.target.value)} className="border rounded px-2 py-1 text-sm" />
                              <input type="time" value={entry.startTime} onChange={e => updateWorkEntry(entry.id, 'startTime', e.target.value)} className="border rounded px-2 py-1 text-sm w-24" />
                              <span>-</span>
                              <input type="time" value={entry.endTime} onChange={e => updateWorkEntry(entry.id, 'endTime', e.target.value)} className="border rounded px-2 py-1 text-sm w-24" />
                              <span className="font-semibold text-blue-600">{entry.hours} klst</span>
                              <button onClick={() => deleteWorkEntry(entry.id)} className="text-red-500 ml-auto hover:text-red-700"><Trash2 size={18} /></button>
                            </div>
                            <input type="text" placeholder="Athugasemdir..." value={entry.notes} onChange={e => updateWorkEntry(entry.id, 'notes', e.target.value)} onBlur={() => syncWorkEntryOnBlur(entry.id)} className="w-full border rounded px-2 py-1 text-sm mt-2" />
                            <button onClick={() => { syncWorkEntryOnBlur(entry.id); setEditingEntryId(null); }} className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800">
                              <Check size={14} /> Lokið
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="text-gray-500">{entry.startTime || '--:--'} - {entry.endTime || '--:--'}</span>
                            <span className="font-semibold text-blue-600">{entry.hours} klst</span>
                            {entry.notes && <span className="text-gray-400 truncate flex-1">{entry.notes}</span>}
                            <button onClick={() => setEditingEntryId(entry.id)} className="text-gray-400 hover:text-blue-600 ml-auto"><Edit2 size={16} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Materials Tab */}
          {activeTab === 'materials' && (
            <div className="space-y-3">
              <button onClick={addMaterial} className="w-full flex items-center justify-center gap-2 bg-orange-100 text-orange-700 py-2 rounded-lg hover:bg-orange-200">
                <Plus size={18} /> Bæta við efni
              </button>
              {selectedProject.materials.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Ekkert efni skráð</p>
              ) : (
                materialGroups.map(([date, materials]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                      <Package size={14} />
                      {formatDate(date)}
                      <span className="text-gray-400 ml-auto">
                        {formatCurrency((materials as MaterialEntry[]).reduce((sum, m) => sum + m.amount, 0))}
                      </span>
                    </div>
                    {(materials as MaterialEntry[]).map(material => (
                      <div key={material.id} className="bg-white p-3 rounded-lg border shadow-sm ml-2">
                        {editingEntryId === material.id ? (
                          <>
                            <div className="flex flex-wrap gap-2 items-center">
                              <input type="date" value={material.date} onChange={e => updateMaterial(material.id, 'date', e.target.value)} className="border rounded px-2 py-1 text-sm" />
                              <input type="text" placeholder="Heiti efnis" value={material.name} onChange={e => updateMaterial(material.id, 'name', e.target.value)} onBlur={() => syncMaterialOnBlur(material.id)} className="border rounded px-2 py-1 text-sm flex-1 min-w-32" />
                              <input type="text" placeholder="Magn" value={material.quantity} onChange={e => updateMaterial(material.id, 'quantity', e.target.value)} onBlur={() => syncMaterialOnBlur(material.id)} className="border rounded px-2 py-1 text-sm w-20" />
                              <input type="number" placeholder="Verð" value={material.amount || ''} onChange={e => updateMaterial(material.id, 'amount', e.target.value)} onBlur={() => syncMaterialOnBlur(material.id)} className="border rounded px-2 py-1 text-sm w-24" />
                              <button onClick={() => deleteMaterial(material.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                            </div>
                            <button onClick={() => { syncMaterialOnBlur(material.id); setEditingEntryId(null); }} className="mt-2 text-sm text-blue-600 flex items-center gap-1 hover:text-blue-800">
                              <Check size={14} /> Lokið
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-3 text-sm">
                            <span className="flex-1 truncate">{material.name || 'Ónefnt efni'}</span>
                            {material.quantity && <span className="text-gray-400">{material.quantity}</span>}
                            <span className="text-orange-600 font-semibold">{formatCurrency(material.amount)}</span>
                            <button onClick={() => setEditingEntryId(material.id)} className="text-gray-400 hover:text-orange-600"><Edit2 size={16} /></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Edit Project Modal */}
          {showEditProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-4 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Breyta verkefni</h3>
                  <button onClick={() => setShowEditProject(false)} className="hover:bg-gray-100 p-1 rounded"><X size={20} /></button>
                </div>
                <div className="space-y-3">
                  <input type="text" placeholder="Heiti" value={editProjectData.name} onChange={e => setEditProjectData({...editProjectData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Viðskiptavinur" value={editProjectData.client} onChange={e => setEditProjectData({...editProjectData, client: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Heimilisfang" value={editProjectData.address} onChange={e => setEditProjectData({...editProjectData, address: e.target.value})} className="w-full border rounded-lg px-3 py-2" />
                  <input type="number" placeholder="Tímagjald" value={editProjectData.hourlyRate || ''} onChange={e => setEditProjectData({...editProjectData, hourlyRate: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                  <input type="number" placeholder="Greitt (sumokėta)" value={editProjectData.paidAmount || ''} onChange={e => setEditProjectData({...editProjectData, paidAmount: Number(e.target.value)})} className="w-full border rounded-lg px-3 py-2" />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditProjectData({...editProjectData, status: 'active'})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${editProjectData.status === 'active' ? 'bg-green-100 text-green-700 ring-2 ring-green-400' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Virkt
                    </button>
                    <button
                      onClick={() => setEditProjectData({...editProjectData, status: 'completed'})}
                      className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${editProjectData.status === 'completed' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-400' : 'bg-gray-100 text-gray-500'}`}
                    >
                      Lokið
                    </button>
                  </div>
                </div>
                <button onClick={saveEditProject} className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                  <Check size={18} /> Vista
                </button>
                <button onClick={() => { setShowEditProject(false); deleteProject(selectedProject.id); }} className="w-full mt-2 text-red-500 text-sm py-2 hover:text-red-700 flex items-center justify-center gap-1">
                  <Trash2 size={14} /> Eyða verkefni
                </button>
              </div>
            </div>
          )}

          {/* Import Modal */}
          {showImport && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-4 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Flytja inn gögn (JSON)</h3>
                  <button onClick={() => setShowImport(false)} className="hover:bg-gray-100 p-1 rounded"><X size={20} /></button>
                </div>
                <textarea value={importData} onChange={e => setImportData(e.target.value)} placeholder='{"efni": [{"heiti": "Flísar", "magn": "10 m²", "verd": 50000}], "vinna": [{"dags": "2024-01-15", "stundir": 8}]}' className="w-full border rounded-lg px-3 py-2 h-40 font-mono text-sm" />
                <button onClick={handleImport} className="w-full mt-3 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">Flytja inn</button>
              </div>
            </div>
          )}

          {/* Invoice Modal */}
          {showInvoice && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
              <div className="bg-white rounded-lg w-full max-w-xl my-4">
                <div className="flex justify-between items-center p-4 border-b print-hidden">
                  <h3 className="font-bold">Reikningur</h3>
                  <button onClick={() => setShowInvoice(false)} className="hover:bg-gray-100 p-1 rounded"><X size={24} /></button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
                  <div className="bg-gray-800 text-white p-5">
                    <h1 className="text-2xl font-light tracking-widest mb-2">REIKNINGUR</h1>
                    <div className="text-sm opacity-90">Paulius Grigaliunas | Sími: 857-2335</div>
                  </div>

                  <div className="bg-gray-50 p-4 text-sm grid grid-cols-2 gap-2">
                    <span className="text-gray-500">Verkefni</span>
                    <span className="font-medium">{selectedProject.name || '-'}</span>
                    <span className="text-gray-500">Viðskiptavinur</span>
                    <span className="font-medium">{selectedProject.client}</span>
                    <span className="text-gray-500">Heimilisfang</span>
                    <span className="font-medium">{selectedProject.address}</span>
                  </div>

                  <div className="p-4 border-b">
                    <h2 className="text-xs font-semibold tracking-wider text-gray-500 mb-3">VINNUSTUNDIR</h2>
                    {selectedProject.workEntries.length === 0 ? (
                      <p className="text-gray-400 text-sm">Engar vinnustundir skráðar</p>
                    ) : (
                      groupWorkEntriesByDate(selectedProject.workEntries).map((entry, idx) => (
                        <div key={idx} className="py-2 text-sm border-b border-gray-100">
                          <div className="flex justify-between">
                            <span className="text-gray-600">{formatDate(entry.date)}</span>
                            <span className="font-medium">{entry.hours} klst</span>
                          </div>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between mt-3 pt-2 border-t-2 text-sm font-semibold">
                      <span>Samtals: {summary.totalHours} klst ({formatCurrency(selectedProject.hourlyRate)}/klst)</span>
                      <span>{formatCurrency(summary.laborCost)}</span>
                    </div>
                  </div>

                  <div className="p-4 border-b">
                    <h2 className="text-xs font-semibold tracking-wider text-gray-500 mb-3">EFNI</h2>
                    {selectedProject.materials.length === 0 ? (
                      <p className="text-gray-400 text-sm">Ekkert efni skráð</p>
                    ) : (
                      sortByDate(selectedProject.materials).map(m => (
                        <div key={m.id} className="flex justify-between py-2 text-sm border-b border-gray-100">
                          <span className="text-gray-600">{formatDate(m.date)}</span>
                          <span className="flex-1 mx-3 truncate">{m.name} {m.quantity && <span className="text-gray-400">({m.quantity})</span>}</span>
                          <span className="font-medium">{formatCurrency(m.amount)}</span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between mt-3 pt-2 border-t-2 text-sm font-semibold">
                      <span>Samtals efni</span>
                      <span>{formatCurrency(summary.totalMaterials)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-800 text-white p-5 text-center">
                    <div className="text-xs tracking-widest opacity-80">HEILDARUPPHÆÐ</div>
                    <div className="text-3xl font-light mt-1">{formatCurrency(summary.totalCost)}</div>
                  </div>

                  {(selectedProject.paidAmount || 0) > 0 && (
                    <div className="p-4 border-t">
                      <div className="flex justify-between py-2 text-sm">
                        <span className="text-gray-600">Greitt</span>
                        <span className="font-medium text-green-600">- {formatCurrency(selectedProject.paidAmount || 0)}</span>
                      </div>
                      <div className="flex justify-between py-2 text-lg font-bold border-t-2 mt-2 pt-2">
                        <span>Eftirstöðvar</span>
                        <span className="text-blue-600">{formatCurrency(summary.totalCost - (selectedProject.paidAmount || 0))}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t print-hidden space-y-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2">Deila með viðskiptavini:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={`${window.location.origin}${window.location.pathname}?v=${selectedProject.id}`}
                        readOnly
                        className="flex-1 border rounded px-2 py-1 text-xs bg-white text-gray-600"
                      />
                      <button
                        onClick={copyPublicUrl}
                        className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                          copied
                            ? 'bg-green-100 text-green-700'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {copied ? 'Afritað!' : 'Afrita'}
                      </button>
                    </div>
                  </div>

                  <button onClick={() => setShowInvoice(false)} className="w-full bg-gray-200 hover:bg-gray-300 py-2 rounded-lg transition-colors">
                    Loka
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  return null;
}
