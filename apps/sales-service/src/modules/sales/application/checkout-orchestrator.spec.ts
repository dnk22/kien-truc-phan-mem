import { CheckoutOrchestrator } from './checkout-orchestrator';
import type { InvoiceRepository, StockPort } from '../domain/sales.repository';
import type { InvoiceRecord } from '../domain/sales.types';
describe('CheckoutOrchestrator recovery',()=>{
 const invoice={id:'i',sagaIntent:'COMMIT',reservationId:'r',payment:{method:'CASH',amountReceived:100,changeAmount:0}} as InvoiceRecord;
 it('reconciles committed inventory without committing again',async()=>{
  const complete=jest.fn().mockResolvedValue({...invoice,status:'COMPLETED'});
  const repository={get:jest.fn().mockResolvedValue(invoice),complete} as unknown as InvoiceRepository;
  const commit=jest.fn();
  const stock={lookup:jest.fn().mockResolvedValue({id:'r',status:'COMMITTED'}),commit} as unknown as StockPort;
  await new CheckoutOrchestrator(repository,stock).advance('i');
  expect(commit).not.toHaveBeenCalled();
  expect(complete).toHaveBeenCalledWith('i');
 });
 it('defers an unknown outcome instead of marking payment failed',async()=>{
  const defer=jest.fn().mockResolvedValue({...invoice,status:'RECOVERY'});
  const repository={get:jest.fn().mockResolvedValue(invoice),defer} as unknown as InvoiceRepository;
  const stock={lookup:jest.fn().mockRejectedValue(new Error('timeout'))} as unknown as StockPort;
  await new CheckoutOrchestrator(repository,stock).advance('i');
  expect(defer).toHaveBeenCalledWith('i','COMMIT','SAGA_OUTCOME_UNKNOWN');
 });
});

it('reconciles a remote commit after a local completion failure on retry', async () => {
  const invoice = { id: 'i', sagaIntent: 'COMMIT', reservationId: 'r', payment: { method: 'CASH', amountReceived: 100, changeAmount: 0 } } as InvoiceRecord;
  const complete = jest.fn().mockRejectedValueOnce(new Error('DB unavailable')).mockResolvedValueOnce({ ...invoice, status: 'COMPLETED', sagaIntent: 'NONE' });
  const defer = jest.fn().mockResolvedValue({ ...invoice, status: 'RECOVERY' });
  const repository = { get: jest.fn().mockResolvedValue(invoice), complete, defer } as unknown as InvoiceRepository;
  const commit = jest.fn();
  const stock = { lookup: jest.fn().mockResolvedValue({ id: 'r', status: 'COMMITTED' }), commit } as unknown as StockPort;
  const orchestrator = new CheckoutOrchestrator(repository, stock);
  await orchestrator.advance('i');
  await orchestrator.advance('i');
  expect(complete).toHaveBeenCalledTimes(2);
  expect(defer).toHaveBeenCalledTimes(1);
  expect(commit).not.toHaveBeenCalled();
});
