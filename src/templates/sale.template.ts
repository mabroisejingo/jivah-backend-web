export const userReceiptEmailTemplate = (
    recipientName: string,
    receiptSummary: string,
  ) => `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px;">
        <h2 style="color: #333;">Hi ${recipientName},</h2>
        <p style="color: #444;">Thank you for your purchase! Your receipt is attached to this email.</p>
        <div style="margin: 20px 0; color: #555;">${receiptSummary}</div>
        <hr style="margin: 20px 0;" />
        <p style="color: #999; font-size: 0.875rem;">
          For any queries, please contact us at <a href="mailto:support@jivah.com">support@jivah.com</a>.
        </p>
        <p style="color: #999; font-size: 0.875rem;">— Jivah Collections Team</p>
      </div>
    </div>
  `;

  export const adminReceiptEmailTemplate = (
    userFullName: string,
    receiptSummary: string,
  ) => `
    <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; padding: 30px; border-radius: 8px;">
        <h3 style="color: #333;">New Receipt Notification</h3>
        <p style="color: #444;">A new purchase has been completed by <strong>${userFullName}</strong>.</p>
        <div style="margin: 20px 0; color: #555;">${receiptSummary}</div>
        <hr style="margin: 20px 0;" />
        <p style="color: #999; font-size: 0.875rem;">This is an automated notification sent to admin staff.</p>
      </div>
    </div>
  `;