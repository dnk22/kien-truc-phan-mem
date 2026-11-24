import { Injectable, type CanActivate, type ExecutionContext, UnauthorizedException, ServiceUnavailableException } from '@nestjs/common';
import { verifyAccessToken } from '@minimart/auth';
@Injectable()
export class CatalogSessionGuard implements CanActivate {
 async canActivate(context:ExecutionContext){
   const req=context.switchToHttp().getRequest<{headers:{authorization?:string};principal?:ReturnType<typeof verifyAccessToken>}>();
   req.principal=verifyAccessToken(req.headers.authorization);
   let response:Response;
   try {
     response=await fetch(new URL('/api/v1/auth/me',process.env.IDENTITY_SERVICE_URL??'http://127.0.0.1:3001'),{headers:{authorization:req.headers.authorization??''},signal:AbortSignal.timeout(5000),redirect:'error'});
   } catch {throw new ServiceUnavailableException({code:'IDENTITY_UNAVAILABLE',message:'Dịch vụ xác thực chưa sẵn sàng.'});}
   if(response.status===401||response.status===403)throw new UnauthorizedException({code:'SESSION_REVOKED',message:'Phiên đăng nhập đã kết thúc.'});
   if(!response.ok)throw new ServiceUnavailableException({code:'IDENTITY_UNAVAILABLE',message:'Dịch vụ xác thực chưa sẵn sàng.'});
   return true;
 }
}
