import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class LoginDto {
    @ApiProperty({ description: 'The email address of the user' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'The password of the user' })
    @IsString()
    @MinLength(8)
    password: string;
}

export class RegisterDto {
    @ApiProperty({ description: 'The email address of the user' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'The password of the user' })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ description: 'The first name of the user' })
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty({ description: 'The last name of the user' })
    @IsOptional()
    @IsString()
    lastName?: string;
}

export class ForgotPasswordDto {
    @ApiProperty({ description: 'The email address of the user' })
    @IsEmail()
    email: string;
}

export class ResetPasswordDto {
    @ApiProperty({ description: 'The reset password token' })
    @IsString()
    token: string;

    @ApiProperty({ description: 'The new password' })
    @IsString()
    @MinLength(8)
    password: string;
}

export class VerifyEmailDto {
    @ApiProperty({ description: 'The verification token' })
    @IsString()
    token: string;
}

export class ResendVerificationEmailDto {
    @ApiProperty({ description: 'The email address to resend the verification email to' })
    @IsEmail()
    email: string;
}