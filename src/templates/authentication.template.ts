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


export const activateAccountTemplate = (otp: string, type: 'password-reset' | 'verification') => `
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
      ${type == "password-reset" ? "<h2>Reset Password</h2>" : "<h2>Activate Your Account</h2>"}
    </div>
    <div class="content">
    ${type == "password-reset" ? "<p>To reset your password, use this OTP:</p>" : "<p>To verify your account, use this OTP:</p>"}
      <div class="button">
        ${otp}
      </div>
      ${type == "password-reset" ? "<p>If you did not request this otp, please ignore this email.</p>" : "<p>If you did not create this account, please ignore this email.</p>"}
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
