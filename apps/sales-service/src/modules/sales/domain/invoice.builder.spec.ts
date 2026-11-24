import { InvoiceBuilder } from './invoice.builder';
const line={productId:'p1',productCode:'P01',productName:'Milk',unit:'Hộp',quantity:2,unitPrice:15000,subtotal:30000};
describe('InvoiceBuilder',()=>{
 it('creates a valid immutable snapshot',()=>{
  const invoice=new InvoiceBuilder().setCashier('cashier').setItems([line]).build();
  expect(invoice.totalAmount).toBe(30000);
  expect(invoice.items[0]).not.toBe(line);
 });
 it('rejects missing cashier, duplicate products and invalid arithmetic',()=>{
  expect(()=>new InvoiceBuilder().setItems([line]).build()).toThrow();
  expect(()=>new InvoiceBuilder().setCashier('c').setItems([line,line]).build()).toThrow();
  expect(()=>new InvoiceBuilder().setCashier('c').setItems([{...line,subtotal:1}]).build()).toThrow();
 });
});
