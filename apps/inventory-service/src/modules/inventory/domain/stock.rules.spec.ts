import { available,assertAvailable,assertAdjustment,sameItems } from './stock.rules';
const stock={productId:'p',productCode:'P',productName:'Product',onHand:10,reserved:3,version:2,threshold:5};
describe('stock rules',()=>{
 it('calculates available stock',()=>expect(available(stock)).toBe(7));
 it('rejects overselling and missing stock',()=>{
  expect(()=>assertAvailable(stock,8)).toThrow();
  expect(()=>assertAvailable(null,1)).toThrow();
  expect(()=>assertAvailable(stock,7)).not.toThrow();
 });
 it('rejects stale counts or counts below reserved',()=>{
  expect(()=>assertAdjustment(stock,1,10)).toThrow();
  expect(()=>assertAdjustment(stock,2,2)).toThrow();
  expect(()=>assertAdjustment(stock,2,3)).not.toThrow();
 });
 it('compares canonical reservation payloads',()=>{
  const a={productId:'a',quantity:1},b={productId:'b',quantity:2};
  expect(sameItems([a,b],[b,a])).toBe(true);
  expect(sameItems([a],[{...a,quantity:2}])).toBe(false);
 });
});
