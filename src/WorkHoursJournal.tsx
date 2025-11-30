import React, { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Share2, ArrowLeft, Clock, Package, Calculator, Download, X, Edit2, Check } from 'lucide-react';
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
  return date.toLocaleDateString('is-IS');
};

const sortByDate = (items: any[]) => {
  return [...items].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

const groupByDate = (items: any[]) => {
  const sorted = sortByDate(items);
  const groups: { [key: string]: any[] } = {};
  sorted.forEach(item => {
    const date = item.date || getTodayDate();
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
  });
  return Object.entries(groups).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime());
};

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

  useEffect(() => {
    const saved = localStorage.getItem('verkefni_data');
    if (saved) {
      try { setProjects(JSON.parse(saved)); } catch (e) {}
    }
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

  const deleteProject = (id: string) => {
    if (confirm('Eyða verkefni?')) {
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

  const saveEditProject = () => {
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
  };

  const addWorkEntry = () => {
    if (!selectedProject) return;
    const entry: WorkEntry = {
      id: generateId(),
      date: getTodayDate(),
      startTime: '08:00',
      endTime: '16:00',
      hours: 8,
      notes: ''
    };
    updateProject({ ...selectedProject, workEntries: [...selectedProject.workEntries, entry] });
  };

  const updateWorkEntry = (entryId: string, field: string, value: any) => {
    if (!selectedProject) return;
    const entries = selectedProject.workEntries.map(e => {
      if (e.id !== entryId) return e;
      const updated = { ...e, [field]: value };
      if (field === 'startTime' || field === 'endTime') {
        updated.hours = calculateHours(
          field === 'startTime' ? value : e.startTime,
          field === 'endTime' ? value : e.endTime
        );
      }
      return updated;
    });
    updateProject({ ...selectedProject, workEntries: entries });
  };

  const deleteWorkEntry = (entryId: string) => {
    if (!selectedProject) return;
    updateProject({ ...selectedProject, workEntries: selectedProject.workEntries.filter(e => e.id !== entryId) });
  };

  const addMaterial = () => {
    if (!selectedProject) return;
    const material: MaterialEntry = {
      id: generateId(),
      date: getTodayDate(),
      name: '',
      quantity: '',
      amount: 0
    };
    updateProject({ ...selectedProject, materials: [...selectedProject.materials, material] });
  };

  const updateMaterial = (materialId: string, field: string, value: any) => {
    if (!selectedProject) return;
    const materials = selectedProject.materials.map(m =>
      m.id === materialId ? { ...m, [field]: field === 'amount' ? Number(value) || 0 : value } : m
    );
    updateProject({ ...selectedProject, materials });
  };

  const deleteMaterial = (materialId: string) => {
    if (!selectedProject) return;
    updateProject({ ...selectedProject, materials: selectedProject.materials.filter(m => m.id !== materialId) });
  };

  const handleImport = () => {
    if (!selectedProject || !importData.trim()) return;
    try {
      const data = JSON.parse(importData);
      let updated = { ...selectedProject };
      if (data.efni && Array.isArray(data.efni)) {
        const newMaterials = data.efni.map((m: any) => ({
          id: generateId(),
          date: m.dags || m.date || getTodayDate(),
          name: m.heiti || m.name || '',
          quantity: m.magn || m.quantity || '',
          amount: Number(m.verd || m.amount) || 0
        }));
        updated.materials = [...updated.materials, ...newMaterials];
      }
      if (data.vinna && Array.isArray(data.vinna)) {
        const newWork = data.vinna.map((w: any) => ({
          id: generateId(),
          date: w.dags || w.date || getTodayDate(),
          startTime: w.byrjun || w.start || '08:00',
          endTime: w.lok || w.end || '16:00',
          hours: w.stundir || w.hours || 8,
          notes: w.athugasemd || w.notes || ''
        }));
        updated.workEntries = [...updated.workEntries, ...newWork];
      }
      updateProject(updated);
      setImportData('');
      setShowImport(false);
      alert('Gögn flutt inn!');
    } catch (e) {
      alert('Villa í JSON sniði');
    }
  };

  const generateStatusMessage = () => {
    if (!selectedProject) return '';
    const summary = getProjectSummary(selectedProject);
    const today = new Date().toLocaleDateString('is-IS');
    return `${selectedProject.name || selectedProject.client} - Staða
==================
Vinnustundir: ${summary.totalHours} klst
Laun: ${formatCurrency(summary.laborCost)}
Efni: ${formatCurrency(summary.totalMaterials)}
==================
Samtals: ${formatCurrency(summary.totalCost)}

Síðast uppfært: ${today}`;
  };

  const copyStatus = () => {
    navigator.clipboard.writeText(generateStatusMessage());
    alert('Staða afrituð!');
  };

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
              projects.map(project => {
                const summary = getProjectSummary(project);
                return (
                  <div key={project.id} onClick={() => { setSelectedProject(project); setCurrentView('project'); }} className="bg-white p-4 rounded-lg shadow-md border cursor-pointer hover:shadow-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{project.name || project.client}</h3>
                        <p className="text-gray-600">{project.client}</p>
                        <p className="text-gray-500 text-sm">{project.address}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{summary.totalHours} klst</p>
                        <p className="font-semibold text-blue-600">{formatCurrency(summary.totalCost)}</p>
                      </div>
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
            <button onClick={copyStatus} className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
              <Share2 size={18} /> Staða
            </button>
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
                        <input type="text" placeholder="Athugasemdir..." value={entry.notes} onChange={e => updateWorkEntry(entry.id, 'notes', e.target.value)} className="w-full border rounded px-2 py-1 text-sm mt-2" />
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
                          <input type="text" placeholder="Heiti efnis" value={material.name} onChange={e => updateMaterial(material.id, 'name', e.target.value)} className="border rounded px-2 py-1 text-sm flex-1 min-w-32" />
                          <input type="text" placeholder="Magn" value={material.quantity} onChange={e => updateMaterial(material.id, 'quantity', e.target.value)} className="border rounded px-2 py-1 text-sm w-20" />
                          <input type="number" placeholder="Verð" value={material.amount || ''} onChange={e => updateMaterial(material.id, 'amount', e.target.value)} className="border rounded px-2 py-1 text-sm w-24" />
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-4 w-full max-w-lg max-h-[90vh] overflow-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold">Reikningsyfirlit</h3>
                  <button onClick={() => setShowInvoice(false)} className="hover:bg-gray-100 p-1 rounded"><X size={20} /></button>
                </div>
                <div className="space-y-4 text-sm">
                  <div className="border-b pb-2">
                    <p className="font-semibold text-lg">{selectedProject.name || selectedProject.client}</p>
                    <p className="text-gray-600">{selectedProject.client}</p>
                    <p className="text-gray-500">{selectedProject.address}</p>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2 text-blue-700">Vinnustundir</p>
                    <div className="bg-blue-50 p-2 rounded">
                      <p>{summary.totalHours} klst × {formatCurrency(selectedProject.hourlyRate)} = <span className="font-bold">{formatCurrency(summary.laborCost)}</span></p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-semibold mb-2 text-orange-700">Efni</p>
                    <div className="bg-orange-50 p-2 rounded space-y-1">
                      {selectedProject.materials.length === 0 ? (
                        <p className="text-gray-500">Ekkert efni skráð</p>
                      ) : (
                        selectedProject.materials.map(m => (
                          <p key={m.id} className="flex justify-between">
                            <span>{m.name} {m.quantity && `(${m.quantity})`}</span>
                            <span>{formatCurrency(m.amount)}</span>
                          </p>
                        ))
                      )}
                      <p className="font-semibold pt-2 border-t flex justify-between">
                        <span>Samtals efni:</span>
                        <span>{formatCurrency(summary.totalMaterials)}</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-3">
                    <p className="text-xl font-bold flex justify-between text-purple-700">
                      <span>Samtals:</span>
                      <span>{formatCurrency(summary.totalCost)}</span>
                    </p>
                  </div>
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
