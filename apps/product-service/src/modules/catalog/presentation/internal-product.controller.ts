import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Post, Req, UnauthorizedException, UseFilters } from '@nestjs/common';
import { matchesServiceCredential } from '@minimart/auth';
import { success } from '@minimart/config';
import { ProductService } from '../application/product.service';
import { CatalogErrorFilter } from './catalog-error.filter';
import { batchInput } from './catalog.validation';
@Controller('internal/v1/products')
@UseFilters(CatalogErrorFilter)
export class InternalProductController {
 constructor(private readonly service:ProductService){}
 private authorize(credential:string|undefined){if(!matchesServiceCredential(credential,process.env.SERVICE_CREDENTIAL??''))throw new UnauthorizedException({code:'INVALID_SERVICE_CREDENTIAL',message:'Invalid service credential'});}
 @Get(':id') async get(@Param('id',ParseUUIDPipe) id:string,@Headers('x-service-credential') credential:string|undefined,@Req() req:{correlationId?:string}){this.authorize(credential);return success(req,await this.service.get(id));}
 @Post('batch') async batch(@Body() body:unknown,@Headers('x-service-credential') credential:string|undefined,@Req() req:{correlationId?:string}){this.authorize(credential);return success(req,await this.service.batch(batchInput(body)));}
}
