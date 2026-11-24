import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class LoginDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(40) username!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(64) password!: string;
}
export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  currentPassword!: string;
  @ApiProperty({ minLength: 10, maxLength: 64 })
  @IsString()
  @MinLength(10)
  @MaxLength(64)
  @Matches(/^[\x20-\x7E]+$/)
  newPassword!: string;
}
