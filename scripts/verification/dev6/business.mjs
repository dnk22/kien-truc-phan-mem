import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { request, login, runId, pass, eventually } from './http.mjs';
export async function fixture() {
  const manager = await login('manager'), cashier = await login('cashier'), warehouse = await login('warehouse'), admin = await login('admin');
  const create = async (path, body) => (await request(path, { method:'POST', token:manager, body, status:201 })).data;
  const category = await create('/categories', { code:'T-'+runId, name:'Verification '+runId });
  const product = await create('/products', { code:'P-'+runId, name:'Verification product '+runId, categoryId:category.id, unit:'Cái', sellingPrice:12000, barcode:'00'+runId });
  await request('/products', {method:'POST',token:manager,body:{code:product.code,name:'Duplicate',categoryId:category.id,unit:'Cái',sellingPrice:100},status:409});
  await request('/products', {method:'POST',token:cashier,body:{},status:403});
  await request('/reports/revenue?from=2026-01-01&to=2026-01-01',{token:warehouse,status:403});
  await request('/inventory',{token:admin,status:403});
  const supplier = await create('/suppliers',{code:'S-'+runId,name:'Verification supplier '+runId});
  const receipt=(await request('/purchase-receipts',{method:'POST',token:warehouse,body:{supplierId:supplier.id,items:[{productId:product.id,quantity:8,unitCost:5000}]},status:201})).data;
  const stock=async()=> (await request('/inventory/'+product.id,{token:manager,status:200})).data;
  assert.equal((await stock()).onHand,0);
  await request('/purchase-receipts/'+receipt.id+'/confirm',{method:'POST',token:warehouse,status:403});
  await request('/purchase-receipts/'+receipt.id+'/confirm',{method:'POST',token:manager,statuses:[200,201]});
  await request('/purchase-receipts/'+receipt.id+'/confirm',{method:'POST',token:manager,statuses:[200,201]});
  assert.equal((await stock()).onHand,8);
  pass('catalog uniqueness, RBAC and idempotent receipt');
  return {manager,cashier,warehouse,admin,product,stock};
}
export async function prepare(f,quantity,key=randomUUID()){
  return request('/sales/checkout/prepare',{method:'POST',token:f.cashier,key,body:{items:[{productId:f.product.id,quantity}]},statuses:[200,409]});
}
export async function confirm(f,id,body,key=randomUUID()){
  return request('/sales/checkout/'+id+'/confirm',{method:'POST',token:f.cashier,key,body,statuses:[200,400,409]});
}
export async function waitInvoice(f,id,status){
  return eventually('invoice '+status,async()=>{const i=(await request('/invoices/'+id,{token:f.cashier,status:200})).data;return i.status===status?i:false;});
}
export async function business(f){
  const key=randomUUID();
  const a=await prepare(f,2,key); assert.equal(a.status,200);
  const ready=await waitInvoice(f,a.data.id,'READY');
  assert.equal(ready.totalAmount,24000);
  assert.equal((await prepare(f,2,key)).data.id,ready.id);
  assert.equal((await prepare(f,3,key)).status,409);
  assert.equal((await stockState(f)).reserved,2);
  assert.equal((await confirm(f,ready.id,{method:'CASH',amountReceived:1})).status,400);
  const payKey=randomUUID();
  await confirm(f,ready.id,{method:'CASH',amountReceived:30000},payKey);
  const completed=await waitInvoice(f,ready.id,'COMPLETED');
  assert.equal(completed.payment.changeAmount,6000);
  await confirm(f,ready.id,{method:'CASH',amountReceived:30000},payKey);
  assert.equal((await stockState(f)).onHand,6);
  await request('/products/'+f.product.id+'/price',{method:'PATCH',token:f.manager,body:{sellingPrice:13000},status:200});
  assert.equal((await request('/invoices/'+ready.id,{token:f.manager,status:200})).data.totalAmount,24000);
  pass('prepare/confirm replay, payment validation and immutable invoice price');
  const competing=await Promise.all([prepare(f,6),prepare(f,6)]);
  const accepted=competing.filter(x=>x.status===200);
  assert.equal(accepted.length,1);
  const reserved=await waitInvoice(f,accepted[0].data.id,'READY');
  assert.equal((await stockState(f)).available,0);
  await request('/sales/checkout/'+reserved.id+'/cancel',{method:'POST',token:f.cashier,status:200});
  await waitInvoice(f,reserved.id,'CANCELLED');
  assert.equal((await stockState(f)).available,6);
  pass('concurrent last-stock reservation and cancel release');
  return completed;
}
async function stockState(f){const s=await f.stock();assert.ok(s.onHand>=s.reserved&&s.reserved>=0);assert.equal(s.available,s.onHand-s.reserved);return s;}
