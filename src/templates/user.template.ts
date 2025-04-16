export const accountDeactivationEmailTemplate = (name: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); }
        h1 { color: #d9534f; font-size: 24px; text-align: center; margin-bottom: 20px; }
        .content { padding: 20px; background-color: #f9f9f9; border-radius: 5px; }
        p { font-size: 16px; color: #333; }
        .footer { text-align: center; margin-top: 20px; font-size: 14px; color: #777; }
        .logo { display: block; margin: 0 auto; max-width: 150px; }
    </style>
</head>
<body>
    <div class="container">
        <img src="http://jivahcollections.com/assets/logo-DXKtbHx2.png" alt="Jivah Logo" class="logo">
        <h1>Account Deactivation Notice</h1>
        <div class="content">
            <p>Dear ${name},</p>
            <p>We regret to inform you that your account has been deactivated by the administrator. This means you will no longer have access to your account and its associated services.</p>
            <p>If you believe this action was taken in error or have any concerns, please contact our support team for further assistance.</p>
            <p>Best regards,<br>The Jivah Team</p>
        </div>
        <div class="footer">
            <p>© 2025 Jivah, All Rights Reserved</p>
        </div>
    </div>
</body>
</html>
`;
