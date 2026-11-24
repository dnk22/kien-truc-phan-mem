import { OutboxWorker } from './outbox.worker';
const event={id:'event',eventType:'sale.completed.v1',payload:{},attempts:0};
describe('OutboxWorker',()=>{
 it('marks sent only after publisher confirmation',async()=>{
  const repository={due:jest.fn().mockResolvedValue([event]),sent:jest.fn().mockResolvedValue(undefined),defer:jest.fn()};
  const publisher={publish:jest.fn().mockResolvedValue(undefined)};
  await new OutboxWorker(repository,publisher).tick();
  expect(repository.sent).toHaveBeenCalledWith(event.id);
  expect(publisher.publish.mock.invocationCallOrder[0]).toBeLessThan(repository.sent.mock.invocationCallOrder[0]!);
 });
 it('leaves failed publishes pending',async()=>{
  const repository={due:jest.fn().mockResolvedValue([event]),sent:jest.fn(),defer:jest.fn().mockResolvedValue(undefined)};
  const publisher={publish:jest.fn().mockRejectedValue(new Error('broker down'))};
  await new OutboxWorker(repository,publisher).tick();
  expect(repository.sent).not.toHaveBeenCalled();
  expect(repository.defer).toHaveBeenCalledWith(event.id,0);
 });
});
