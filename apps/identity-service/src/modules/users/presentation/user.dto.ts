import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ROLES, type Role, type UserStatus } from '@minimart/contracts';
export class UserQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100000)
  page = 1;
  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 10;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
  @ApiPropertyOptional({ enum: ROLES }) @IsOptional() @IsIn(ROLES) role?: Role;
  @ApiPropertyOptional({ enum: ['ACTIVE', 'LOCKED'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'LOCKED'])
  status?: UserStatus;
}
export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @Matches(/^[a-z0-9][a-z0-9._-]{2,39}$/)
  username!: string;
  @ApiProperty({ minLength: 10, maxLength: 64 })
  @IsString()
  @MinLength(10)
  @MaxLength(64)
  @Matches(/^[\x20-\x7E]+$/)
  password!: string;
  @ApiProperty()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/\S/)
  fullName!: string;
  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[+0-9 ()-]{6,20}$/)
  phone?: string;
  @ApiProperty({ enum: ROLES }) @IsIn(ROLES) role!: Role;
}
export class UpdateUserDto {
  @ApiPropertyOptional()
  @ValidateIf((_o, value) => value !== undefined)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  @Matches(/\S/)
  fullName?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  email?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @Matches(/^[+0-9 ()-]{6,20}$/)
  phone?: string | null;
}
export class UserStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'LOCKED'] })
  @IsIn(['ACTIVE', 'LOCKED'])
  status!: UserStatus;
}
export class UserRoleDto {
  @ApiProperty({ enum: ROLES }) @IsIn(ROLES) role!: Role;
}
