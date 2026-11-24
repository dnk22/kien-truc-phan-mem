export class InventoryError extends Error {
  constructor(public readonly code:string,message:string,public readonly status=409){super(message);}
}
export const missing=(name:string)=>new InventoryError('NOT_FOUND',name+' không tồn tại.',404);
