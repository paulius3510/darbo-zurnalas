/**
 * Google Sheets API Integration via Apps Script Web App
 *
 * SETUP:
 * 1. Deploy Apps Script as Web App (see docs/GOOGLE_SHEETS_SETUP.md)
 * 2. Copy the Web App URL
 * 3. Replace APPS_SCRIPT_WEB_APP_URL below with your URL
 */

// Load from environment variables (configured in .env file)
const APPS_SCRIPT_WEB_APP_URL = import.meta.env.VITE_APPS_SCRIPT_URL || '';

// Enable/disable API (configured in .env file)
const API_ENABLED = import.meta.env.VITE_API_ENABLED === 'true';

// Debug: Log configuration on module load
console.log('🔧 Google Sheets API Config:');
console.log('  API_ENABLED:', API_ENABLED);
console.log('  VITE_API_ENABLED:', import.meta.env.VITE_API_ENABLED);
console.log('  URL configured:', APPS_SCRIPT_WEB_APP_URL ? 'Yes' : 'No');

export interface Project {
  id: string;
  name: string;
  client: string;
  address: string;
  hourlyRate: number;
  status: string;
  createdAt: string;
}

export interface WorkEntry {
  id: string;
  projectId: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  notes: string;
}

export interface MaterialEntry {
  id: string;
  projectId: string;
  date: string;
  name: string;
  quantity: string;
  amount: number;
}

export interface AllData {
  projects: Project[];
  workEntries: WorkEntry[];
  materials: MaterialEntry[];
}

/**
 * Get all data from Google Sheets
 */
export async function getAllData(): Promise<AllData | null> {
  if (!API_ENABLED) {
    console.log('API disabled, using localStorage only');
    return null;
  }

  try {
    const response = await fetch(`${APPS_SCRIPT_WEB_APP_URL}?action=getAll`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data from Google Sheets:', error);
    return null;
  }
}

/**
 * Save project to Google Sheets
 * Note: Uses GET with payload parameter due to CORS restrictions with POST
 */
export async function saveProject(project: Project): Promise<boolean> {
  console.log('📝 saveProject called, API_ENABLED:', API_ENABLED);

  if (!API_ENABLED) {
    console.log('⚠️ API disabled, skipping Google Sheets sync');
    return true; // Skip API call
  }

  console.log('🔄 Syncing project to Google Sheets...');

  try {
    // Use GET with encoded payload to avoid CORS issues
    const payload = encodeURIComponent(JSON.stringify(project));
    const url = `${APPS_SCRIPT_WEB_APP_URL}?action=saveProject&payload=${payload}`;

    console.log('📤 Sending to URL:', url.substring(0, 100) + '...');

    const response = await fetch(url);

    console.log('📨 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Response error:', errorText);
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Response data:', result);
    return result.success === true;
  } catch (error) {
    console.error('❌ Error saving project:', error);
    console.error('❌ Error details:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

/**
 * Save work entry to Google Sheets
 */
export async function saveWorkEntry(entry: WorkEntry): Promise<boolean> {
  if (!API_ENABLED) {
    return true;
  }

  try {
    const payload = encodeURIComponent(JSON.stringify(entry));
    const url = `${APPS_SCRIPT_WEB_APP_URL}?action=saveWorkEntry&payload=${payload}`;

    const response = await fetch(url);
    const result = await response.json();
    console.log('✅ Work entry saved:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error saving work entry:', error);
    return false;
  }
}

/**
 * Save material to Google Sheets
 */
export async function saveMaterial(material: MaterialEntry): Promise<boolean> {
  if (!API_ENABLED) {
    return true;
  }

  try {
    const payload = encodeURIComponent(JSON.stringify(material));
    const url = `${APPS_SCRIPT_WEB_APP_URL}?action=saveMaterial&payload=${payload}`;

    const response = await fetch(url);
    const result = await response.json();
    console.log('✅ Material saved:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error saving material:', error);
    return false;
  }
}

/**
 * Delete project from Google Sheets
 */
export async function deleteProject(id: string): Promise<boolean> {
  if (!API_ENABLED) {
    return true;
  }

  try {
    const url = `${APPS_SCRIPT_WEB_APP_URL}?action=deleteProject&id=${encodeURIComponent(id)}`;

    const response = await fetch(url);
    const result = await response.json();
    console.log('✅ Project deleted:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error deleting project:', error);
    return false;
  }
}

/**
 * Delete work entry from Google Sheets
 */
export async function deleteWorkEntry(id: string): Promise<boolean> {
  if (!API_ENABLED) {
    return true;
  }

  try {
    const url = `${APPS_SCRIPT_WEB_APP_URL}?action=deleteWorkEntry&id=${encodeURIComponent(id)}`;

    const response = await fetch(url);
    const result = await response.json();
    console.log('✅ Work entry deleted:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error deleting work entry:', error);
    return false;
  }
}

/**
 * Delete material from Google Sheets
 */
export async function deleteMaterial(id: string): Promise<boolean> {
  if (!API_ENABLED) {
    return true;
  }

  try {
    const url = `${APPS_SCRIPT_WEB_APP_URL}?action=deleteMaterial&id=${encodeURIComponent(id)}`;

    const response = await fetch(url);
    const result = await response.json();
    console.log('✅ Material deleted:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error deleting material:', error);
    return false;
  }
}

/**
 * Update project in Google Sheets
 */
export async function updateProject(project: Project): Promise<boolean> {
  if (!API_ENABLED) {
    return true;
  }

  try {
    const payload = encodeURIComponent(JSON.stringify(project));
    const url = `${APPS_SCRIPT_WEB_APP_URL}?action=updateProject&payload=${payload}`;

    const response = await fetch(url);
    const result = await response.json();
    console.log('✅ Project updated:', result);
    return result.success === true;
  } catch (error) {
    console.error('Error updating project:', error);
    return false;
  }
}

/**
 * Sync local data to Google Sheets
 * Call this when you want to push all localStorage data to Sheets
 */
export async function syncToSheets(localData: AllData): Promise<boolean> {
  if (!API_ENABLED) {
    return false;
  }

  try {
    // Save all projects
    for (const project of localData.projects) {
      await saveProject(project);
    }

    // Save all work entries
    for (const entry of localData.workEntries) {
      await saveWorkEntry(entry);
    }

    // Save all materials
    for (const material of localData.materials) {
      await saveMaterial(material);
    }

    return true;
  } catch (error) {
    console.error('Error syncing to Sheets:', error);
    return false;
  }
}

/**
 * Load data from Google Sheets and merge with local
 */
export async function loadFromSheets(): Promise<AllData | null> {
  if (!API_ENABLED) {
    return null;
  }

  return await getAllData();
}
