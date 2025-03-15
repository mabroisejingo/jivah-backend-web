import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon from 'argon2';
import { Request } from 'express';
import * as XLSX from 'xlsx';
import * as nodemailer from 'nodemailer';
import { User } from '@prisma/client';
import {
  activateAccountTemplate,
  employeeSetPasswordEmailTemplate,
  employeeWelcomeEmailTemplate,
  newDeviceLoginTemplate,
  welcomeEmailTemplate,
} from 'src/templates/authentication.template';

@Injectable()
export class UtilsService {
  private smtpTransport;
  constructor(
    private readonly prisma: PrismaService,
    // private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.smtpTransport = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: true,
      auth: {
        user: this.config.get<string>('SMTP_EMAIL'),
        pass: this.config.get<string>('SMTP_PASSWORD'),
      },
    });
  }

  sendEmail = async (to: string, html: any, subject: string) => {
    try {
      // if (process.env.NODE_ENV !== 'production') {
      //   console.log('Not in production environment. Email not sent.');
      //   return;
      // }

      const mailOptions = {
        from: 'info@jivah.com',
        to,
        subject,
        html,
      };
      await this.smtpTransport.sendMail(mailOptions);
    } catch (e) {
      console.log(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new InternalServerErrorException(e.message);
    }
  };

  async verifySocialToken(socialToken: string, provider: string) {
    try {
      let userInfo;
      if (provider === 'google') {
        // userInfo = await this.googleAuthService.verifyToken(socialToken);
      } else if (provider === 'facebook') {
        // userInfo = await this.facebookAuthService.verifyToken(socialToken);
      }
      if (!userInfo) {
        throw new UnauthorizedException('Invalid social token');
      }
      return userInfo;
    } catch (error) {
      throw new UnauthorizedException('Error verifying social token');
    }
  }

  async createToken(
    data: any,
    options: { expiresIn: string },
  ): Promise<string> {
    return this.jwtService.signAsync(data, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: options.expiresIn,
    });
  }

  async verifyToken(token: string): Promise<any> {
    return await this.jwtService.verifyAsync(token, {
      secret: this.config.get<string>('JWT_SECRET'),
    });
  }

  async verifyPasswords(pass1: string, pass2: string) {
    return await argon.verify(pass1, pass2);
  }
  async hashPassword(pass: string) {
    return await argon.hash(pass);
  }

  async getLoggedInUser(req: Request) {
    const authorization = req.headers.authorization;
    if (authorization) {
      const token = authorization.split(' ')[1];
      if (!authorization.toString().startsWith('Bearer '))
        throw new UnauthorizedException('The provided token is invalid');
      const { error } = this.jwtService.verify(token, {
        secret: this.config.get('AT_SECRET'),
      });
      if (error)
        throw new BadRequestException(
          'Errow accured while getting the profile ' + error.message,
        );
      const details: any = await this.jwtService.decode(token);
      return await this.prisma.user.findUnique({
        where: { id: details.user },
      });
    } else {
      throw new UnauthorizedException(
        'Please you are not authorized to access resource',
      );
    }
  }

  readExcel(file: any): any[] {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  }

  writeExcel(data: any[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  generateOtp(): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  }

  sendOtpToPhone(
    phone: string,
    otp: string,
    type: 'password-reset',
  ): Promise<void> {
    console.log(phone, otp, type);
    return;
  }

  generateVerificationLink(userId: string): string {
    const token = this.createToken({ id: userId }, { expiresIn: '1h' });
    return `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  }

  async sendOtpToEmail(
    user: User,
    otp: string,
    type: 'password-set' | 'verification',
  ) {
    const emailHtml = activateAccountTemplate(otp, type);
    const subject =
      type == 'password-set' ? 'Reset Password' : 'Activate Your jivah Account';
    await this.sendEmail(user.email, emailHtml, subject);
  }

  async sendEmployeeAccountSetupEmails(
    name: string,
    token: string,
    email: string,
  ) {
    const emailHtml = employeeWelcomeEmailTemplate(name);
    const subject = 'Welcome to Jivah';
    await this.sendEmail(email, emailHtml, subject);
    const emailHtml2 = employeeSetPasswordEmailTemplate(token);
    const subject2 = 'To start using Jivah set your password';
    await this.sendEmail(email, emailHtml2, subject2);
  }

  async sendPasswordResetEmail(token: string, email: string) {
    const html = employeeSetPasswordEmailTemplate(token);
    const subject = 'Reset Password';
    await this.sendEmail(email, html, subject);
  }

  async sendTokenToEmail(
    user: User,
    otp: string,
    type: 'password-set' | 'verification',
  ) {
    const emailHtml = activateAccountTemplate(otp, type);
    const subject =
      type == 'password-set' ? 'Reset Password' : 'Activate Your jivah Account';
    await this.sendEmail(user.email, emailHtml, subject);
  }

  async sendNewDeviceLogin({
    user,
    userAgent,
  }: {
    user: User;
    userAgent: string;
  }) {
    const date = new Date().toLocaleString('en-US', { timeZone: 'UTC' });
    const emailHtml = newDeviceLoginTemplate(user.name, userAgent, date);
    const subject = 'New Device Login Alert';
    await this.sendEmail(user.email, emailHtml, subject);
  }

  async sendWelcomeEmail({ user }: { user: User }) {
    const emailHtml = welcomeEmailTemplate(user.name);
    const subject = 'Welcome to jivah';
    await this.sendEmail(user.email, emailHtml, subject);
  }

  async sendActivateAccountEmail({
    user,
    type,
  }: {
    user: User;
    type: 'password-set' | 'verification';
  }) {
    const link = this.config.get<string>('FRONTEND_URL') + '/auth/activate';
    const emailHtml = activateAccountTemplate(link, type);
    const subject = 'New Device Login Alert';
    await this.sendEmail(user.email, emailHtml, subject);
  }
}
