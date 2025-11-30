/**
 * Darbo Žurnalas - Apps Script Web App API
 *
 * REST API endpoints:
 * - GET: ?action=getAll - gauti visus duomenis
 * - POST: action=save - išsaugoti duomenis
 *
 * Deployment: Web App (Anyone can access)
 */

// IMPORTANT: Replace with your actual Spreadsheet ID
const SPREADSHEET_ID = '1ds-_5uX6T4qrQdsNK_xvW7i7PPFam8ckbsa2NDLvnnk';

/**
 * Handle OPTIONS requests (CORS preflight)
 */
function doOptions(e) {
  return jsonResponse({}, 200);
}

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;

    if (action === 'getAll') {
      return getAllData();
    }

    if (action === 'getProjects') {
      return getSheetData('projects');
    }

    if (action === 'getWorkEntries') {
      return getSheetData('work_entries');
    }

    if (action === 'getMaterials') {
      return getSheetData('materials');
    }

    return jsonResponse({ error: 'Invalid action' }, 400);

  } catch (error) {
    return jsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'saveProject') {
      return saveProject(data.project);
    }

    if (action === 'saveWorkEntry') {
      return saveWorkEntry(data.entry);
    }

    if (action === 'saveMaterial') {
      return saveMaterial(data.material);
    }

    if (action === 'deleteProject') {
      return deleteRow('projects', data.id);
    }

    if (action === 'deleteWorkEntry') {
      return deleteRow('work_entries', data.id);
    }

    if (action === 'deleteMaterial') {
      return deleteRow('materials', data.id);
    }

    if (action === 'updateProject') {
      return updateProject(data.project);
    }

    return jsonResponse({ error: 'Invalid action' }, 400);

  } catch (error) {
    return jsonResponse({ error: error.toString() }, 500);
  }
}

/**
 * Get all data from all sheets
 */
function getAllData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  const projects = sheetToJson(ss.getSheetByName('projects'));
  const workEntries = sheetToJson(ss.getSheetByName('work_entries'));
  const materials = sheetToJson(ss.getSheetByName('materials'));

  return jsonResponse({
    projects: projects,
    workEntries: workEntries,
    materials: materials
  });
}

/**
 * Get data from specific sheet
 */
function getSheetData(sheetName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) {
    return jsonResponse({ error: `Sheet ${sheetName} not found` }, 404);
  }

  const data = sheetToJson(sheet);
  return jsonResponse({ data: data });
}

/**
 * Convert sheet to JSON array
 */
function sheetToJson(sheet) {
  const data = sheet.getDataRange().getValues();

  if (data.length === 0) {
    return [];
  }

  const headers = data[0];
  const rows = data.slice(1);

  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  }).filter(row => row.id); // Filter out empty rows
}

/**
 * Save project
 */
function saveProject(project) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('projects');

  // Check if project exists
  const existingRow = findRowById(sheet, project.id);

  if (existingRow > 0) {
    // Update existing
    updateRow(sheet, existingRow, [
      project.id,
      project.name,
      project.client,
      project.address,
      project.hourlyRate,
      project.status,
      project.createdAt
    ]);
  } else {
    // Add new
    sheet.appendRow([
      project.id,
      project.name,
      project.client,
      project.address,
      project.hourlyRate,
      project.status,
      project.createdAt
    ]);
  }

  return jsonResponse({ success: true, project: project });
}

/**
 * Save work entry
 */
function saveWorkEntry(entry) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('work_entries');

  const existingRow = findRowById(sheet, entry.id);

  if (existingRow > 0) {
    updateRow(sheet, existingRow, [
      entry.id,
      entry.projectId,
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.hours,
      entry.notes
    ]);
  } else {
    sheet.appendRow([
      entry.id,
      entry.projectId,
      entry.date,
      entry.startTime,
      entry.endTime,
      entry.hours,
      entry.notes
    ]);
  }

  return jsonResponse({ success: true, entry: entry });
}

/**
 * Save material
 */
function saveMaterial(material) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('materials');

  const existingRow = findRowById(sheet, material.id);

  if (existingRow > 0) {
    updateRow(sheet, existingRow, [
      material.id,
      material.projectId,
      material.date,
      material.name,
      material.quantity,
      material.amount
    ]);
  } else {
    sheet.appendRow([
      material.id,
      material.projectId,
      material.date,
      material.name,
      material.quantity,
      material.amount
    ]);
  }

  return jsonResponse({ success: true, material: material });
}

/**
 * Update project (for project details editing)
 */
function updateProject(project) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('projects');

  const existingRow = findRowById(sheet, project.id);

  if (existingRow > 0) {
    updateRow(sheet, existingRow, [
      project.id,
      project.name,
      project.client,
      project.address,
      project.hourlyRate,
      project.status,
      project.createdAt
    ]);
    return jsonResponse({ success: true, project: project });
  } else {
    return jsonResponse({ error: 'Project not found' }, 404);
  }
}

/**
 * Delete row by ID
 */
function deleteRow(sheetName, id) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName(sheetName);

  const rowIndex = findRowById(sheet, id);

  if (rowIndex > 0) {
    sheet.deleteRow(rowIndex);
    return jsonResponse({ success: true });
  } else {
    return jsonResponse({ error: 'Row not found' }, 404);
  }
}

/**
 * Find row index by ID (returns row number, 0 if not found)
 */
function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) { // Start from 1 to skip header
    if (data[i][0] === id) {
      return i + 1; // Return 1-indexed row number
    }
  }

  return 0;
}

/**
 * Update row
 */
function updateRow(sheet, rowIndex, values) {
  const range = sheet.getRange(rowIndex, 1, 1, values.length);
  range.setValues([values]);
}

/**
 * Return JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  const output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);

  // Add CORS headers
  return output;
}

/**
 * Add CORS headers to response (Apps Script doesn't support custom headers in ContentService)
 * Instead, we need to ensure the Web App is deployed as "Anyone can access"
 */
