export const welcomeEmailTemplate = (userName: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f6f4;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 80%;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .header h2 {
      margin: 0;
      color: #B58A5F;
    }
    .content {
      text-align: center;
      padding: 20px 0;
    }
    .content p {
      margin: 20px 0;
      color: #555;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .footer p {
      margin: 0;
      color: #777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Welcome to jivah</h2>
    </div>
    <div class="content">
      <p>Dear ${userName},</p>
      <p>We are thrilled to have you join us in the jivah!</p>
      <p>Explore, manage, and lead with ease using our platform. If you have any questions, feel free to reach out to our support team.</p>
      <p>Welcome aboard!</p>
    </div>
    <div class="footer">
      <p>jivah Dev Team</p>
    </div>
  </div>
</body>
</html>
`;

export const activateAccountTemplate = (
  otp: string,
  type: 'password-set' | 'verification',
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f6f4;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 80%;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .header h2 {
      margin: 0;
      color: #B58A5F;
    }
    .content {
      text-align: center;
      padding: 20px 0;
    }
    .content p {
      margin: 20px 0;
      color: #555;
      font-size: 16px;
    }
    .button {
      margin: 20px 0;
    }
    .button a {
      display: inline-block;
      padding: 10px 20px;
      background-color: #B58A5F;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .footer p {
      margin: 0;
      color: #777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${type == 'password-set' ? '<h2>Set Password</h2>' : '<h2>Activate Your Account</h2>'}
    </div>
    <div class="content">
    ${type == 'password-set' ? '<p>To set your password, use this link :</p>' : '<p>To verify your account, use this OTP:</p>'}
      <div class="button">
        ${otp}
      </div>
      ${type == 'password-set' ? '<p>If you did not request this otp, please ignore this email.</p>' : '<p>If you did not create this account, please ignore this email.</p>'}
    </div>
    <div class="footer">
      <p>jivah Dev Team</p>
    </div>
  </div>
</body>
</html>
`;

export const forgotPasswordTemplate = (resetLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f6f4;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 80%;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .header h2 {
      margin: 0;
      color: #B58A5F;
    }
    .content {
      text-align: center;
      padding: 20px 0;
    }
    .content p {
      margin: 20px 0;
      color: #555;
      font-size: 16px;
    }
    .button {
      margin: 20px 0;
    }
    .button a {
      display: inline-block;
      padding: 10px 20px;
      background-color: #B58A5F;
      color: #ffffff;
      text-decoration: none;
      border-radius: 5px;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .footer p {
      margin: 0;
      color: #777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Reset Your Password</h2>
    </div>
    <div class="content">
      <p>To reset your password, please click the button below:</p>
      <div class="button">
        <a href="${resetLink}" target="_blank">Reset Password</a>
      </div>
      <p>If you did not request a password reset, please ignore this email.</p>
    </div>
    <div class="footer">
      <p>jivah Dev Team</p>
    </div>
  </div>
</body>
</html>
`;

export const newDeviceLoginTemplate = (
  userName: string,
  userAgent: string,
  date: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f9f6f4;
      margin: 0;
      padding: 0;
    }
    .container {
      width: 80%;
      margin: 20px auto;
      padding: 20px;
      border: 1px solid #ddd;
      border-radius: 10px;
      background-color: #ffffff;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      text-align: center;
      padding-bottom: 20px;
      border-bottom: 1px solid #ddd;
    }
    .header h2 {
      margin: 0;
      color: #B58A5F;
    }
    .content {
      text-align: center;
      padding: 20px 0;
    }
    .content p {
      margin: 15px 0;
      color: #555;
      font-size: 16px;
    }
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    }
    .footer p {
      margin: 0;
      color: #777;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Device Login Detected</h2>
    </div>
    <div class="content">
      <p>Dear ${userName},</p>
      <p>We noticed a login to your account from a new device or browser:</p>
      <p><strong>Device/Browser:</strong> ${userAgent}</p>
      <p><strong>Date & Time:</strong> ${date}</p>
      <p>If this was you, no action is required. If you did not initiate this login, please secure your account immediately by changing your password and contacting support.</p>
    </div>
    <div class="footer">
      <p>jivah Security Team</p>
      <p>Stay secure, stay confident.</p>
    </div>
  </div>
</body>
</html>
`;

export const employeeWelcomeEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        h1 { color: #eba046; font-size: 24px; text-align: center; margin-bottom: 20px; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
        p { font-size: 16px; color: #333; }
        .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #777; }
        .logo { display: block; margin: 0 auto; max-width: 150px; }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://jivah-fe.vercel.app/assets/logo-DXKtbHx2.png" alt="Jivah Logo" class="logo">
        <h1>Welcome to Jivah!</h1>
        <div class="content">
            <p>Dear ${name},</p>
            <p>We are excited to welcome you as a new member of the Jivah family. We look forward to working with you and are confident that you will make a positive impact.</p>
            <p>You'll receive another email soon with instructions to set up your account password. If you have any questions, please don't hesitate to reach out to your manager or our HR team.</p>
            <p>Best regards,<br>The Jivah Team</p>
        </div>
        <div class="footer">
            <p>© 2025 Jivah, All Rights Reserved</p>
        </div>
    </div>
</body>
</html>
`;

export const employeeSetPasswordEmailTemplate = (token: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        h1 { color: #eba046; font-size: 24px; text-align: center; margin-bottom: 20px; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
        p { font-size: 16px; color: #333; }
        .button { display: inline-block; padding: 10px 20px; background-color: #eba046; color: #ffffff; text-decoration: none; border-radius: 5px; text-align: center; font-size: 16px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #777; }
        .logo { display: block; margin: 0 auto; max-width: 150px; }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://jivah-fe.vercel.app/assets/logo-DXKtbHx2.png" alt="Jivah Logo" class="logo">
        <h1>Set Your Password</h1>
        <div class="content">
            <p>Hello,</p>
            <p>To complete your account setup, please click the button below to set your password:</p>
            <p><a href="${process.env.CLIENT_URL}/?token=${token}" class="button">Set Password</a></p>
            <p>If you didn't request this, please ignore this email or contact your manager.</p>
            <p>Best regards,<br>The Jivah Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Jivah, All Rights Reserved</p>
        </div>
    </div>
</body>
</html>
`;

export const resetPasswordEmailTemplate = (token: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        h1 { color: #eba046; font-size: 24px; text-align: center; margin-bottom: 20px; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
        p { font-size: 16px; color: #333; }
        .button { display: inline-block; padding: 10px 20px; background-color: #eba046; color: #ffffff; text-decoration: none; border-radius: 5px; text-align: center; font-size: 16px; margin-top: 20px; }
        .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #777; }
        .logo { display: block; margin: 0 auto; max-width: 150px; }
    </style>
</head>
<body>
    <div class="container">
        <img src="https://jivah-fe.vercel.app/assets/logo-DXKtbHx2.png" alt="Jivah Logo" class="logo">
        <h1>Set Your Password</h1>
        <div class="content">
            <p>Hello,</p>
            <p>Please click the button below to reset your password:</p>
            <p><a href="${process.env.CLIENT_URL}/?token=${token}" class="button">Reset Password</a></p>
            <p>If you didn't request this, please ignore this email or contact your manager.</p>
            <p>Best regards,<br>The Jivah Team</p>
        </div>
        <div class="footer">
            <p>© ${new Date().getFullYear()} Jivah, All Rights Reserved</p>
        </div>
    </div>
</body>
</html>
`;
