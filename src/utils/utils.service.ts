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
import * as admin from 'firebase-admin';
import {
  activateAccountTemplate,
  employeeSetPasswordEmailTemplate,
  employeeWelcomeEmailTemplate,
  newDeviceLoginTemplate,
  welcomeEmailTemplate,
} from 'src/templates/authentication.template';
import { accountDeactivationEmailTemplate } from 'src/templates/user.template';
import { adminReceiptEmailTemplate, userReceiptEmailTemplate } from 'src/templates/sale.template';

@Injectable()
export class UtilsService {
  private infoTransport;
  private receiptTransport;
  private firebaseApp: admin.app.App;
  constructor(
    private readonly prisma: PrismaService,
    // private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.infoTransport = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'), 
      port: this.config.get<number>('SMTP_PORT'), 
      secure: true,
      auth: {
        user: this.config.get<string>('INFO_EMAIL'),
        pass: this.config.get<string>('INFO_PASSWORD'),
      },
    });
    this.receiptTransport = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'), 
      port: this.config.get<number>('SMTP_PORT'), 
      secure: true,
      auth: {
        user: this.config.get<string>('RECEIPT_EMAIL'),
        pass: this.config.get<string>('RECEIPT_PASSWORD'),
      },
    });
    this.firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: this.config.get<string>('FIREBASE_PROJECT_ID'),
        privateKey: this.config
          .get<string>('FIREBASE_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
        clientEmail: this.config.get<string>('FIREBASE_CLIENT_EMAIL'),
      }),
    });
  }

  sendEmail = async (
    to: string,
    html: string,
    subject: string,
    type: 'info' | 'receipt' = 'info',
    attachments?: { filename: string; content: Buffer | string; contentType?: string }[],
  ) => {
    try {
      const transport = type === 'receipt' ? this.receiptTransport : this.infoTransport;
  
      const mailOptions = {
        from: type === 'receipt' 
          ? '"Jivah Collections" <receipt@jivahcollections.com>' 
          : '"Jivah Collections" <info@jivahcollections.com>',
        to,
        subject,
        html,
        attachments,
      };
  
      await transport.sendMail(mailOptions);
    } catch (e) {
      console.error(e);
      if (e instanceof HttpException) {
        throw e;
      }
      throw new InternalServerErrorException(e.message);
    }
  };
  

  async verifySocialToken(token: string) {
    return this.firebaseApp.auth().verifyIdToken(token);
  }

  async sendNotification(tokens: string[], title: string, message: string) {
    const messagePayload = {
      notification: {
        title,
        body: message,
      },
    };

    try {
      const results = await Promise.all(
        tokens.map((token) =>
          admin.messaging().send({ ...messagePayload, token }),
        ),
      );
      console.log('Successfully sent messages:', results);
      return results;
    } catch (error) {
      console.error('Error sending messages:', error);
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


  async sendReceiptToUserAndAdmin(
    user: any,
    receiptSummary: string,
    receiptBlob: Buffer,
  ) {
    const userHtml = userReceiptEmailTemplate(user.name, receiptSummary);
    const adminHtml = adminReceiptEmailTemplate(user.name, receiptSummary);
  
    const attachment = [
      {
        filename: 'receipt.pdf',
        content: receiptBlob,
        contentType: 'application/pdf',
      },
    ];
  
    await this.sendEmail(user.email, userHtml, 'Your Jivah Receipt', 'receipt', attachment);
  
    await this.sendEmail(
      'receipt@jivahcollections.com',
      adminHtml,
      `Receipt Notification - ${user.name}`,
      'receipt',
      attachment,
    );
  }

  async sendDeactivationEmail(user: User) {
    const emailHtml = accountDeactivationEmailTemplate(user.name);
    const subject =
      'Your Jivah Account Has Been Deactivated by Jivah Collections Team';
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
