import { Body,Controller,Get,Headers,Param,ParseUUIDPipe,Post,Req,UnauthorizedException,UseFilters } from '@nestjs/common';
import { matchesServiceCredential } from '@minimart/auth';
import { success } from '@minimart/config';
import { ReservationService } from '../application/reservation.service';
import { StockService } from '../application/stock.service';
import { reservationInput } from './inventory.validation';
import { InventoryErrorFilter } from './inventory-http';
type Context={correlationId?:string};
@Controller('internal/v1/stock')
@UseFilters(InventoryErrorFilter)
export class InternalStockController {
 constructor(private readonly reservations:ReservationService,private readonly stock:StockService){}
 private authorize(value:string|undefined){if(!matchesServiceCredential(value,process.env.SERVICE_CREDENTIAL??''))throw new UnauthorizedException({code:'INVALID_SERVICE_CREDENTIAL',message:'Invalid service credential'});}
 @Post('reservations') async reserve(@Body() body:unknown,@Headers('x-service-credential') credential:string|undefined,@Req() req:Context){this.authorize(credential);return success(req,await this.reservations.reserve(reservationInput(body)));}
 @Get('reservations/by-invoice/:invoiceId') async byInvoice(@Param('invoiceId',ParseUUIDPipe) id:string,@Headers('x-service-credential') credential:string|undefined,@Req() req:Context){this.authorize(credential);return success(req,await this.reservations.byInvoice(id));}
 @Get('reservations/:id') async get(@Param('id',ParseUUIDPipe) id:string,@Headers('x-service-credential') credential:string|undefined,@Req() req:Context){this.authorize(credential);return success(req,await this.reservations.get(id));}
 @Post('reservations/:id/commit') async commit(@Param('id',ParseUUIDPipe) id:string,@Headers('x-service-credential') credential:string|undefined,@Req() req:Context){this.authorize(credential);return success(req,await this.reservations.commit(id));}
 @Post('reservations/:id/release') async release(@Param('id',ParseUUIDPipe) id:string,@Headers('x-service-credential') credential:string|undefined,@Req() req:Context){this.authorize(credential);return success(req,await this.reservations.release(id));}
 @Get('summary') async summary(@Headers('x-service-credential') credential:string|undefined,@Req() req:Context){this.authorize(credential);return success(req,await this.stock.summary());}
}
