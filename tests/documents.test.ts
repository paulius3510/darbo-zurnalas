import { describe, expect, it } from 'vitest';
import { toMaterialDoc, toProjectDoc, toWorkEntryDoc } from '../src/api/documents';

describe('toProjectDoc', () => {
  it('pašalina laukus, kurių nėra Firestore schemoje (workEntries, materials ir kt.)', () => {
    const doc = toProjectDoc({
      id: 'p1', name: 'A', client: 'B', address: 'C', hourlyRate: 100, paidAmount: 0,
      status: 'active', isPublic: false, createdAt: '2026-01-01', uid: 'u1',
      workEntries: [{ id: 'x' }], materials: [], legacy: 'junk',
    } as any);
    expect(Object.keys(doc).sort()).toEqual(
      ['address', 'client', 'createdAt', 'hourlyRate', 'id', 'isPublic', 'name', 'paidAmount', 'status', 'uid'],
    );
  });

  it('užpildo numatytąsias reikšmes ir paverčia skaičius', () => {
    const doc = toProjectDoc({ id: 'p1', name: 'A', uid: 'u1', hourlyRate: '150', createdAt: '2026-01-01' } as any);
    expect(doc).toEqual({
      id: 'p1', name: 'A', client: '', address: '', hourlyRate: 150, paidAmount: 0,
      status: 'active', isPublic: false, createdAt: '2026-01-01', uid: 'u1',
    });
  });

  it('nežinomą status paverčia į active', () => {
    expect(toProjectDoc({ id: 'p', name: 'n', uid: 'u', status: 'weird' } as any).status).toBe('active');
    expect(toProjectDoc({ id: 'p', name: 'n', uid: 'u', status: 'completed' } as any).status).toBe('completed');
  });
});

describe('toWorkEntryDoc', () => {
  it('paverčia hours į skaičių ir pašalina papildomus laukus', () => {
    const doc = toWorkEntryDoc({
      id: 'w1', projectId: 'p1', date: '2026-01-01', startTime: '08:00', endTime: '16:00',
      hours: '8', notes: undefined, uid: 'u1', stundir: '8',
    } as any);
    expect(doc).toEqual({
      id: 'w1', projectId: 'p1', date: '2026-01-01', startTime: '08:00', endTime: '16:00',
      hours: 8, notes: '', uid: 'u1',
    });
  });
});

describe('toMaterialDoc', () => {
  it('paverčia amount į skaičių ir pašalina papildomus laukus', () => {
    const doc = toMaterialDoc({
      id: 'm1', projectId: 'p1', date: '2026-01-01', name: 'Flísar', quantity: 10, amount: '45000', uid: 'u1', verd: 1,
    } as any);
    expect(doc).toEqual({
      id: 'm1', projectId: 'p1', date: '2026-01-01', name: 'Flísar', quantity: '10', amount: 45000, uid: 'u1',
    });
  });
});
