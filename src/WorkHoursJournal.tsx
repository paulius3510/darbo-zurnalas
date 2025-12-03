import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, ArrowLeft, Clock, Package, Calculator, Download, X, Edit2, Check } from 'lucide-react';
import * as GoogleSheetsAPI from './api/googleSheetsAPI';

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

const formatTime = (timeStr: string): string => {
  if (!timeStr) return '--:--';
  // If it's an ISO string like "1899-12-30T09:46:08.000Z", extract time
  if (timeStr.includes('T')) {
    const date = new Date(timeStr);
    return date.toLocaleTimeString('is-IS', { hour: '2-digit', minute: '2-digit', hour12: false });
  }
  // If it's already in HH:MM format, return as is
  return timeStr;
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
  // Sort groups by date descending (newest first)
  return Object.entries(groups).sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime());
};

// Group work entries by date and sum hours for invoice display
const groupWorkEntriesByDate = (entries: { date: string; hours: number }[]) => {
  const groups: { [key: string]: number } = {};
  entries.forEach(entry => {
    const date = entry.date || getTodayDate();
    groups[date] = (groups[date] || 0) + entry.hours;
  });
  // Sort by date ascending (oldest first)
  return Object.entries(groups)
    .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
    .map(([date, hours]) => ({ date, hours }));
};

// Public Invoice View Component (for clients)
function PublicInvoiceView({ projectId }: { projectId: string }) {
  const [publicProject, setPublicProject] = useState<{
    name: string;
    client: string;
    address: string;
    hourlyRate: number;
    totalHours: number;
    laborCost: number;
    workEntries: { date: string; startTime: string; endTime: string; hours: number; notes: string }[];
    materials: { date: string; name: string; quantity: string; amount: number }[];
    totalMaterials: number;
    totalCost: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPublicData = async () => {
      try {
        const data = await GoogleSheetsAPI.getAllData();
        if (data && data.projects) {
          const project = data.projects.find(p => p.id === projectId);
          if (project) {
            const workEntries = data.workEntries.filter(e => e.projectId === projectId);
            const materials = data.materials.filter(m => m.projectId === projectId);
            const totalHours = workEntries.reduce((sum, e) => sum + e.hours, 0);
            const totalMaterials = materials.reduce((sum, m) => sum + m.amount, 0);
            const laborCost = totalHours * project.hourlyRate;

            setPublicProject({
              name: project.name,
              client: project.client,
              address: project.address,
              hourlyRate: project.hourlyRate,
              totalHours,
              laborCost,
              workEntries: sortByDate(workEntries.map(e => ({
                date: e.date,
                startTime: e.startTime,
                endTime: e.endTime,
                hours: e.hours,
                notes: e.notes
              }))),
              materials: sortByDate(materials.map(m => ({
                date: m.date,
                name: m.name,
                quantity: m.quantity,
                amount: m.amount
              }))),
              totalMaterials,
              totalCost: laborCost + totalMaterials
            });

            // Update page title and meta tags for better link previews
            const projectTitle = project.name || project.client;
            document.title = `Reikningur - ${projectTitle}`;

            // Update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
              metaDescription.setAttribute('content', `Verkefnayfirlit fyrir ${project.client}`);
            }

            // Update Open Graph tags
            const ogTitle = document.querySelector('meta[property="og:title"]');
            if (ogTitle) {
              ogTitle.setAttribute('content', `Reikningur - ${projectTitle}`);
            }
            const ogDescription = document.querySelector('meta[property="og:description"]');
            if (ogDescription) {
              ogDescription.setAttribute('content', `Verkefnayfirlit fyrir ${project.client}`);
            }
          } else {
            setError('Verkefni fannst ekki');
          }
        } else {
          setError('Gat ekki hlaðið gögnum');
        }
      } catch (e) {
        setError('Villa við að hlaða gögnum');
      }
      setLoading(false);
    };
    loadPublicData();
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

  if (error || !publicProject) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md text-center">
          <p className="text-red-600 text-lg mb-4">{error || 'Villa'}</p>
          <p className="text-gray-500">Vinsamlegast athugaðu slóðina</p>
        </div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('is-IS');

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-gray-800 text-white p-5">
            <h1 className="text-2xl font-light tracking-widest mb-2">REIKNINGUR</h1>
            <div className="text-sm opacity-90">Paulius Grigaliunas | Sími: 857-2335</div>
          </div>

          {/* Project Info */}
          <div className="bg-gray-50 p-4 text-sm grid grid-cols-2 gap-2">
            <span className="text-gray-500">Verkefni</span>
            <span className="font-medium">{publicProject.name || '-'}</span>
            <span className="text-gray-500">Viðskiptavinur</span>
            <span className="font-medium">{publicProject.client}</span>
            <span className="text-gray-500">Heimilisfang</span>
            <span className="font-medium">{publicProject.address}</span>
          </div>

          {/* Work Hours Section */}
          <div className="p-4 border-b">
            <h2 className="text-xs font-semibold tracking-wider text-gray-500 mb-3">VINNUSTUNDIR</h2>
            {publicProject.workEntries.length === 0 ? (
              <p className="text-gray-400 text-sm">Engar vinnustundir skráðar</p>
            ) : (
              groupWorkEntriesByDate(publicProject.workEntries).map((entry, idx) => (
                <div key={idx} className="py-2 text-sm border-b border-gray-100">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{formatDate(entry.date)}</span>
                    <span className="font-medium">{entry.hours} klst</span>
                  </div>
                </div>
              ))
            )}
            <div className="flex justify-between mt-3 pt-2 border-t-2 text-sm font-semibold">
              <span>Samtals: {publicProject.totalHours} klst ({formatCurrency(publicProject.hourlyRate)}/klst)</span>
              <span>{formatCurrency(publicProject.laborCost)}</span>
            </div>
          </div>

          {/* Materials Section */}
          <div className="p-4 border-b">
            <h2 className="text-xs font-semibold tracking-wider text-gray-500 mb-3">EFNI</h2>
            {publicProject.materials.length === 0 ? (
              <p className="text-gray-400 text-sm">Ekkert efni skráð</p>
            ) : (
              publicProject.materials.map((m, idx) => (
                <div key={idx} className="flex justify-between py-2 text-sm border-b border-gray-100">
                  <span className="text-gray-600 w-24">{formatDate(m.date)}</span>
                  <span className="flex-1 mx-3 truncate">{m.name} {m.quantity && <span className="text-gray-400">({m.quantity})</span>}</span>
                  <span className="font-medium">{formatCurrency(m.amount)}</span>
                </div>
              ))
            )}
            <div className="flex justify-between mt-3 pt-2 border-t-2 text-sm font-semibold">
              <span>Samtals efni</span>
              <span>{formatCurrency(publicProject.totalMaterials)}</span>
            </div>
          </div>

          {/* Total */}
          <div className="bg-gray-800 text-white p-5 text-center">
            <div className="text-xs tracking-widest opacity-80">HEILDARUPPHÆÐ</div>
            <div className="text-3xl font-light mt-1">{formatCurrency(publicProject.totalCost)}</div>
          </div>

          {/* Print Button - hidden when printing */}
          <div className="print-hidden p-4">
            <button
              onClick={() => window.print()}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 transition-colors"
            >
              🖨️ Prenta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkHoursJournal() {
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
  const [editProjectData, setEditProjectData] = useState({ name: '', client: '', address: '', hourlyRate: 0 });
  const [publicViewId, setPublicViewId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Check for public view URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewId = params.get('v');
    if (viewId) {
      setPublicViewId(viewId);
    }
  }, []);

  // Load data on mount - first try Google Sheets, then localStorage
  useEffect(() => {
    const loadData = async () => {
      // Try to load from Google Sheets first
      const sheetsData = await GoogleSheetsAPI.loadFromSheets();

      if (sheetsData && sheetsData.projects && sheetsData.projects.length > 0) {
        console.log('📥 Loaded data from Google Sheets');
        // Convert flat structure to nested structure
        const projectsWithEntries = sheetsData.projects.map(p => ({
          ...p,
          workEntries: sheetsData.workEntries
            .filter(e => e.projectId === p.id)
            .map(e => ({
              id: e.id,
              date: e.date,
              startTime: e.startTime,
              endTime: e.endTime,
              hours: e.hours,
              notes: e.notes
            })),
          materials: sheetsData.materials
            .filter(m => m.projectId === p.id)
            .map(m => ({
              id: m.id,
              date: m.date,
              name: m.name,
              quantity: m.quantity,
              amount: m.amount
            }))
        }));
        setProjects(projectsWithEntries);
      } else {
        // Fallback to localStorage
        console.log('📥 Loading data from localStorage');
        const saved = localStorage.getItem('verkefni_data');
        if (saved) {
          try { setProjects(JSON.parse(saved)); } catch (e) {}
        }
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('verkefni_data', JSON.stringify(projects));
    }
  }, [projects]);

  const getProjectSummary = (project: Project) => {
    const totalHours = project.workEntries.reduce((sum, e) => sum + e.hours, 0);
    const totalMaterials = project.materials.reduce((sum, m) => sum + m.amount, 0);
    const laborCost = totalHours * project.hourlyRate;
    return { totalHours, totalMaterials, laborCost, totalCost: laborCost + totalMaterials };
  };

  const addProject = async () => {
    if (!newProject.name && !newProject.client) return;
    const project: Project = {
      id: generateId(),
      ...newProject,
      status: 'active',
      workEntries: [],
      materials: [],
      createdAt: new Date().toISOString()
    };
    setProjects([...projects, project]);
    setNewProject({ name: '', client: '', address: '', hourlyRate: 0 });
    setShowNewProject(false);

    // Sync to Google Sheets
    await GoogleSheetsAPI.saveProject(project);
  };

  const deleteProject = async (id: string) => {
    if (confirm('Eyða verkefni?')) {
      // Delete all work entries and materials for this project from Google Sheets
      const project = projects.find(p => p.id === id);
      if (project) {
        for (const entry of project.workEntries) {
          await GoogleSheetsAPI.deleteWorkEntry(entry.id);
        }
        for (const material of project.materials) {
          await GoogleSheetsAPI.deleteMaterial(material.id);
        }
      }

      // Delete project from Google Sheets
      await GoogleSheetsAPI.deleteProject(id);

      setProjects(projects.filter(p => p.id !== id));
      if (selectedProject?.id === id) {
        setSelectedProject(null);
        setCurrentView('list');
      }
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
      hourlyRate: selectedProject.hourlyRate
    });
    setShowEditProject(true);
  };

  const saveEditProject = async () => {
    if (!selectedProject) return;
    const updated = {
      ...selectedProject,
      name: editProjectData.name,
      client: editProjectData.client,
      address: editProjectData.address,
      hourlyRate: editProjectData.hourlyRate
    };
    updateProject(updated);
    setShowEditProject(false);

    // Sync to Google Sheets
    await GoogleSheetsAPI.updateProject({
      id: updated.id,
      name: updated.name,
      client: updated.client,
      address: updated.address,
      hourlyRate: updated.hourlyRate,
      status: updated.status,
      createdAt: updated.createdAt
    });
  };

  const addWorkEntry = async () => {
    if (!selectedProject) return;
    const entry: WorkEntry = {
      id: generateId(),
      date: getTodayDate(),
      startTime: '',
      endTime: '',
      hours: 0,
      notes: ''
    };
    // Add new entry at the beginning
    updateProject({ ...selectedProject, workEntries: [entry, ...selectedProject.workEntries] });

    // Sync to Google Sheets
    await GoogleSheetsAPI.saveWorkEntry({
      id: entry.id,
      projectId: selectedProject.id,
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      hours: entry.hours,
      notes: entry.notes
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

    const updatedProject = { ...selectedProject, workEntries: entries };
    updateProject(updatedProject);

    // Sync to Google Sheets for date/time changes
    if (field === 'date' || field === 'startTime' || field === 'endTime') {
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        GoogleSheetsAPI.saveWorkEntry({
          id: entry.id,
          projectId: selectedProject.id,
          date: entry.date,
          startTime: entry.startTime,
          endTime: entry.endTime,
          hours: entry.hours,
          notes: entry.notes
        });
      }
    }
  };

  // Sync work entry on blur (for text fields like notes)
  const syncWorkEntryOnBlur = (entryId: string) => {
    if (!selectedProject) return;
    const entry = selectedProject.workEntries.find(e => e.id === entryId);
    if (entry) {
      GoogleSheetsAPI.saveWorkEntry({
        id: entry.id,
        projectId: selectedProject.id,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        hours: entry.hours,
        notes: entry.notes
      });
    }
  };

  const deleteWorkEntry = async (entryId: string) => {
    if (!selectedProject) return;
    updateProject({ ...selectedProject, workEntries: selectedProject.workEntries.filter(e => e.id !== entryId) });

    // Sync to Google Sheets
    await GoogleSheetsAPI.deleteWorkEntry(entryId);
  };

  const addMaterial = async () => {
    if (!selectedProject) return;
    const material: MaterialEntry = {
      id: generateId(),
      date: getTodayDate(),
      name: '',
      quantity: '',
      amount: 0
    };
    // Add new entry at the beginning
    updateProject({ ...selectedProject, materials: [material, ...selectedProject.materials] });

    // Sync to Google Sheets
    await GoogleSheetsAPI.saveMaterial({
      id: material.id,
      projectId: selectedProject.id,
      date: material.date,
      name: material.name,
      quantity: material.quantity,
      amount: material.amount
    });
  };

  const updateMaterial = (materialId: string, field: string, value: string | number) => {
    if (!selectedProject) return;
    const materials = selectedProject.materials.map(m => {
      if (m.id === materialId) {
        const updated: MaterialEntry = { ...m, [field]: field === 'amount' ? Number(value) || 0 : value };
        return updated;
      }
      return m;
    });

    const updatedProject = { ...selectedProject, materials };
    updateProject(updatedProject);

    // Sync to Google Sheets on date change (other fields sync on blur)
    if (field === 'date') {
      const material = materials.find(m => m.id === materialId);
      if (material) {
        GoogleSheetsAPI.saveMaterial({
          id: material.id,
          projectId: selectedProject.id,
          date: material.date,
          name: material.name,
          quantity: material.quantity,
          amount: material.amount
        });
      }
    }
  };

  // Sync material on blur (for text/number fields)
  const syncMaterialOnBlur = (materialId: string) => {
    if (!selectedProject) return;
    const material = selectedProject.materials.find(m => m.id === materialId);
    if (material) {
      GoogleSheetsAPI.saveMaterial({
        id: material.id,
        projectId: selectedProject.id,
        date: material.date,
        name: material.name,
        quantity: material.quantity,
        amount: material.amount
      });
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (!selectedProject) return;
    updateProject({ ...selectedProject, materials: selectedProject.materials.filter(m => m.id !== materialId) });

    // Sync to Google Sheets
    await GoogleSheetsAPI.deleteMaterial(materialId);
  };

  const handleImport = async () => {
    if (!selectedProject || !importData.trim()) return;
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
          // Calculate hours from start/end times, or use provided value
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

      // Sync all new entries to Google Sheets
      for (const material of newMaterialsList) {
        await GoogleSheetsAPI.saveMaterial({
          id: material.id,
          projectId: selectedProject.id,
          date: material.date,
          name: material.name,
          quantity: material.quantity,
          amount: material.amount
        });
      }
      for (const entry of newWorkList) {
        await GoogleSheetsAPI.saveWorkEntry({
          id: entry.id,
          projectId: selectedProject.id,
          date: entry.date,
          startTime: entry.startTime,
          endTime: entry.endTime,
          hours: entry.hours,
          notes: entry.notes
        });
      }

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

  // Project List View
  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Verkefnaskrá</h1>
            <button onClick={() => setShowNewProject(true)} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg">
              <Plus size={20} /> Nýtt verkefni
            </button>
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
              [...projects].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(project => {
                return (
                  <div key={project.id} onClick={() => { setSelectedProject(project); setCurrentView('project'); }} className="bg-white p-4 rounded-lg shadow-md border cursor-pointer hover:shadow-lg">
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{project.name || project.client}</h3>
                      <p className="text-gray-600">{project.client}</p>
                      <p className="text-gray-500 text-sm">{project.address}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-700">Virkt</span>
                      <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">Eyða</button>
                    </div>
                  </div>
                );
              })
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
                        <div className="flex flex-wrap gap-2 items-center">
                          <input type="date" value={entry.date} onChange={e => updateWorkEntry(entry.id, 'date', e.target.value)} className="border rounded px-2 py-1 text-sm" />
                          <input type="time" value={entry.startTime} onChange={e => updateWorkEntry(entry.id, 'startTime', e.target.value)} className="border rounded px-2 py-1 text-sm w-24" />
                          <span>-</span>
                          <input type="time" value={entry.endTime} onChange={e => updateWorkEntry(entry.id, 'endTime', e.target.value)} className="border rounded px-2 py-1 text-sm w-24" />
                          <span className="font-semibold text-blue-600">{entry.hours} klst</span>
                          <button onClick={() => deleteWorkEntry(entry.id)} className="text-red-500 ml-auto hover:text-red-700"><Trash2 size={18} /></button>
                        </div>
                        <input type="text" placeholder="Athugasemdir..." value={entry.notes} onChange={e => updateWorkEntry(entry.id, 'notes', e.target.value)} onBlur={() => syncWorkEntryOnBlur(entry.id)} className="w-full border rounded px-2 py-1 text-sm mt-2" />
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
                        <div className="flex flex-wrap gap-2 items-center">
                          <input type="date" value={material.date} onChange={e => updateMaterial(material.id, 'date', e.target.value)} className="border rounded px-2 py-1 text-sm" />
                          <input type="text" placeholder="Heiti efnis" value={material.name} onChange={e => updateMaterial(material.id, 'name', e.target.value)} onBlur={() => syncMaterialOnBlur(material.id)} className="border rounded px-2 py-1 text-sm flex-1 min-w-32" />
                          <input type="text" placeholder="Magn" value={material.quantity} onChange={e => updateMaterial(material.id, 'quantity', e.target.value)} onBlur={() => syncMaterialOnBlur(material.id)} className="border rounded px-2 py-1 text-sm w-20" />
                          <input type="number" placeholder="Verð" value={material.amount || ''} onChange={e => updateMaterial(material.id, 'amount', e.target.value)} onBlur={() => syncMaterialOnBlur(material.id)} className="border rounded px-2 py-1 text-sm w-24" />
                          <span className="text-orange-600 font-semibold">{formatCurrency(material.amount)}</span>
                          <button onClick={() => deleteMaterial(material.id)} className="text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
                        </div>
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
                </div>
                <button onClick={saveEditProject} className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700">
                  <Check size={18} /> Vista
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
                {/* Modal Header */}
                <div className="flex justify-between items-center p-4 border-b print-hidden">
                  <h3 className="font-bold">Reikningur</h3>
                  <button onClick={() => setShowInvoice(false)} className="hover:bg-gray-100 p-1 rounded"><X size={24} /></button>
                </div>

                {/* Printable Invoice Content */}
                <div className="max-h-[70vh] overflow-y-auto print:max-h-none print:overflow-visible">
                  {/* Invoice Header */}
                  <div className="bg-gray-800 text-white p-5">
                    <h1 className="text-2xl font-light tracking-widest mb-2">REIKNINGUR</h1>
                    <div className="text-sm opacity-90">Paulius Grigaliunas | Sími: 857-2335</div>
                  </div>

                  {/* Project Info */}
                  <div className="bg-gray-50 p-4 text-sm grid grid-cols-2 gap-2">
                    <span className="text-gray-500">Verkefni</span>
                    <span className="font-medium">{selectedProject.name || '-'}</span>
                    <span className="text-gray-500">Viðskiptavinur</span>
                    <span className="font-medium">{selectedProject.client}</span>
                    <span className="text-gray-500">Heimilisfang</span>
                    <span className="font-medium">{selectedProject.address}</span>
                  </div>

                  {/* Work Hours Section */}
                  <div className="p-4 border-b">
                    <h2 className="text-xs font-semibold tracking-wider text-gray-500 mb-3">VINNUSTUNDIR</h2>
                    {selectedProject.workEntries.length === 0 ? (
                      <p className="text-gray-400 text-sm">Engar vinnustundir skráðar</p>
                    ) : (
                      <>
                        {groupWorkEntriesByDate(selectedProject.workEntries).map((entry, idx) => (
                          <div key={idx} className="py-2 text-sm border-b border-gray-100">
                            <div className="flex justify-between">
                              <span className="text-gray-600">{formatDate(entry.date)}</span>
                              <span className="font-medium">{entry.hours} klst</span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    <div className="flex justify-between mt-3 pt-2 border-t-2 text-sm font-semibold">
                      <span>Samtals: {summary.totalHours} klst ({formatCurrency(selectedProject.hourlyRate)}/klst)</span>
                      <span>{formatCurrency(summary.laborCost)}</span>
                    </div>
                  </div>

                  {/* Materials Section */}
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

                  {/* Total */}
                  <div className="bg-gray-800 text-white p-5 text-center">
                    <div className="text-xs tracking-widest opacity-80">HEILDARUPPHÆÐ</div>
                    <div className="text-3xl font-light mt-1">{formatCurrency(summary.totalCost)}</div>
                  </div>
                </div>

                {/* Actions - hidden when printing */}
                <div className="p-4 border-t print-hidden space-y-3">
                  {/* Share Link Section */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 mb-2">🔗 Deila með viðskiptavini:</p>
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
                        {copied ? '✓ Afritað!' : '📋 Afrita'}
                      </button>
                    </div>
                  </div>

                  {/* Close Button */}
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
