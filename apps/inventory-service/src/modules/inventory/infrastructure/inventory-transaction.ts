import { Prisma } from '../../../generated/client';
import { PrismaService } from '../../../infrastructure/database/prisma.service';
import { InventoryError,missing } from '../domain/inventory.errors';
export async function inventoryWrite<T>(db:PrismaService,work:(tx:Prisma.TransactionClient)=>Promise<T>):Promise<T>{
 try {
  return await db.$transaction(async tx=>{
   // One inventory writer at a time in V1 (single store). No HTTP inside this transaction.
   await tx.$executeRaw`SELECT pg_advisory_xact_lock(2026112403)`;
   return work(tx);
  },{maxWait:5000,timeout:10000});
 } catch(error){
  if(error instanceof Prisma.PrismaClientKnownRequestError){
   if(error.code==='P2002')throw new InventoryError('DUPLICATE_REFERENCE','Mã hoặc tham chiếu đã tồn tại.');
   if(error.code==='P2025')throw missing('Dữ liệu');
  }
  throw error;
 }
}
