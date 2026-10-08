import 'firebase/compat/firestore';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';

const rules = readFileSync('firestore.rules', 'utf8');
const ownerMatch = rules.match(/function ownerUid\(\)\s*\{\s*return '([^']+)';/);
// Until the rules define ownerUid(), fall back to a fixed id so the suite still runs (and fails).
const OWNER = ownerMatch ? ownerMatch[1] : 'owner-uid';
const STRANGER = 'stranger-uid';

const PUBLIC_PROJECT = 'pub000001';
const PRIVATE_PROJECT = 'prv000001';

function project(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: 'Baðherbergi',
    client: 'Jón',
    address: 'Reykjavík',
    hourlyRate: 6500,
    paidAmount: 0,
    status: 'active',
    isPublic: false,
    createdAt: '2026-10-08T00:00:00.000Z',
    uid: OWNER,
    ...overrides,
  };
}

function workEntry(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    projectId: PRIVATE_PROJECT,
    date: '2026-10-08',
    startTime: '08:00',
    endTime: '16:00',
    hours: 8,
    notes: '',
    uid: OWNER,
    ...overrides,
  };
}

function material(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    projectId: PRIVATE_PROJECT,
    date: '2026-10-08',
    name: 'Flísar',
    quantity: '10 m²',
    amount: 45000,
    uid: OWNER,
    ...overrides,
  };
}

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'darbo-zurnalas-rules-test',
    firestore: { rules },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'projects', PUBLIC_PROJECT), project(PUBLIC_PROJECT, { isPublic: true }));
    await setDoc(doc(db, 'projects', PRIVATE_PROJECT), project(PRIVATE_PROJECT));
    await setDoc(doc(db, 'workEntries', 'we000001'), workEntry('we000001'));
    await setDoc(doc(db, 'materials', 'mat00001'), material('mat00001'));
  });
});

const ownerDb = () => env.authenticatedContext(OWNER).firestore();
const strangerDb = () => env.authenticatedContext(STRANGER).firestore();
const anonDb = () => env.unauthenticatedContext().firestore();

describe('kitas prisijungęs naudotojas (ne savininkas)', () => {
  it('negali sukurti workEntry su savininko uid', async () => {
    await assertFails(setDoc(doc(strangerDb(), 'workEntries', 'forged01'), workEntry('forged01')));
  });

  it('negali sukurti material viešam projektui', async () => {
    await assertFails(
      setDoc(doc(strangerDb(), 'materials', 'forged02'), material('forged02', { projectId: PUBLIC_PROJECT })),
    );
  });

  it('negali sukurti projekto net su savo uid', async () => {
    await assertFails(setDoc(doc(strangerDb(), 'projects', 'strg0001'), project('strg0001', { uid: STRANGER })));
  });

  it('negali ištrinti savininko įrašo', async () => {
    await assertFails(deleteDoc(doc(strangerDb(), 'workEntries', 'we000001')));
  });
});

describe('savininkas – normalūs veiksmai', () => {
  it('gali sukurti projektą', async () => {
    await assertSucceeds(setDoc(doc(ownerDb(), 'projects', 'new00001'), project('new00001')));
  });

  it('gali perrašyti savo projektą', async () => {
    await assertSucceeds(
      setDoc(doc(ownerDb(), 'projects', PRIVATE_PROJECT), project(PRIVATE_PROJECT, { paidAmount: 100000 })),
    );
  });

  it('gali sukurti workEntry savo projektui', async () => {
    await assertSucceeds(setDoc(doc(ownerDb(), 'workEntries', 'we000002'), workEntry('we000002')));
  });

  it('gali sukurti material savo projektui', async () => {
    await assertSucceeds(setDoc(doc(ownerDb(), 'materials', 'mat00002'), material('mat00002')));
  });

  it('gali ištrinti savo įrašą ir projektą', async () => {
    await assertSucceeds(deleteDoc(doc(ownerDb(), 'workEntries', 'we000001')));
    await assertSucceeds(deleteDoc(doc(ownerDb(), 'projects', PRIVATE_PROJECT)));
  });

  it('gali išvardyti savo projektus', async () => {
    await assertSucceeds(getDocs(query(collection(ownerDb(), 'projects'), where('uid', '==', OWNER))));
  });
});

describe('savininkas – duomenų vientisumas', () => {
  it('negali pakeisti projekto uid į kitą', async () => {
    await assertFails(
      setDoc(doc(ownerDb(), 'projects', PRIVATE_PROJECT), project(PRIVATE_PROJECT, { uid: STRANGER })),
    );
  });

  it('negali sukurti workEntry neegzistuojančiam projektui', async () => {
    await assertFails(
      setDoc(doc(ownerDb(), 'workEntries', 'we000003'), workEntry('we000003', { projectId: 'nope0000' })),
    );
  });

  it('negali įrašyti projekto su papildomu lauku', async () => {
    await assertFails(setDoc(doc(ownerDb(), 'projects', 'new00002'), project('new00002', { extra: 'x' })));
  });

  it('negali įrašyti projekto su neteisingu lauko tipu', async () => {
    await assertFails(setDoc(doc(ownerDb(), 'projects', 'new00003'), project('new00003', { hourlyRate: '6500' })));
  });

  it('negali įrašyti projekto, kurio id laukas nesutampa su dokumento id', async () => {
    await assertFails(setDoc(doc(ownerDb(), 'projects', 'new00004'), project('other000')));
  });
});

describe('vieša sąskaita (neprisijungęs)', () => {
  it('gali perskaityti viešą projektą ir jo įrašus', async () => {
    await assertSucceeds(getDoc(doc(anonDb(), 'projects', PUBLIC_PROJECT)));
    await assertSucceeds(
      getDocs(query(collection(anonDb(), 'workEntries'), where('projectId', '==', PUBLIC_PROJECT))),
    );
  });

  it('negali perskaityti privataus projekto', async () => {
    await assertFails(getDoc(doc(anonDb(), 'projects', PRIVATE_PROJECT)));
  });

  it('negali išvardyti projektų', async () => {
    await assertFails(getDocs(collection(anonDb(), 'projects')));
  });

  it('negali nieko rašyti', async () => {
    await assertFails(setDoc(doc(anonDb(), 'workEntries', 'anon0001'), workEntry('anon0001')));
  });
});
