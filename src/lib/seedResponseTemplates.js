import { base44 } from '@/api/base44Client';

const DEFAULT_TEMPLATES = [
  {
    title: 'KYC Documents Insufficient',
    category: 'rejection',
    body: `Dear Applicant,

Thank you for submitting your KYC documents. After review, we found that the submitted documents are insufficient to complete the verification process.

Please resubmit the following:
• Valid government-issued photo ID (passport, driver's license, or national ID)
• Recent proof of address (utility bill or bank statement dated within 90 days)
• Source of funds documentation

If you have questions about the required documents, please contact our support team.

Best regards,
Vantoris Compliance Team`
  },
  {
    title: 'KYC Approved',
    category: 'approval',
    body: `Dear Applicant,

Congratulations! Your identity verification (KYC) has been approved. You're one step closer to accessing your wealth management account.

Your account application is now under final review. We typically complete this within 2-3 business days.

You'll receive a notification once your account is fully activated. If you have any questions in the meantime, please reach out to our support team.

Best regards,
Vantoris Team`
  },
  {
    title: 'Account Frozen - Security Review',
    category: 'info',
    body: `Dear Member,

Your account has been temporarily frozen pending a routine security review. This is a standard precaution to protect your assets.

During this period:
• No withdrawals or transfers can be processed
• You can still view your account and transaction history
• Trading activity is suspended

We expect to complete the review within 1-2 business days. You'll receive a notification once your account is restored to full access.

If you believe this is an error or have urgent questions, please contact our operations team.

Best regards,
Vantoris Operations`
  },
  {
    title: 'Account Reopened',
    category: 'approval',
    body: `Dear Member,

Your account has been successfully reactivated and is now fully operational.

You can now:
• Process withdrawals and transfers
• Resume trading activity
• Access all platform features

If you have any concerns or questions about your account, please don't hesitate to reach out.

Thank you for your continued trust in Vantoris.

Best regards,
Vantoris Team`
  },
  {
    title: 'Withdrawal Processing Delay',
    category: 'info',
    body: `Dear Member,

Your withdrawal request is being processed. We're currently experiencing higher than normal request volumes, which may cause slight delays in processing times.

Expected timeline: 2-5 business days
Status: In progress

We appreciate your patience. You'll receive a confirmation notification as soon as your withdrawal is processed.

If you need immediate assistance, please contact our operations team.

Best regards,
Vantoris Operations`
  },
  {
    title: 'Opening Contribution Received',
    category: 'approval',
    body: `Dear Member,

We've received your opening contribution and have verified the transaction.

Deposit details:
• Amount: [AMOUNT]
• Method: [METHOD]
• Reference: [REFERENCE]
• Status: Verified

Your account is now fully activated with this opening balance. You can now manage your investments, request additional services, and access all platform features.

Thank you for choosing Vantoris.

Best regards,
Vantoris Team`
  },
  {
    title: 'Additional Information Required',
    category: 'info',
    body: `Dear Applicant,

To complete your account setup, we need a bit more information from you:

• [Detail required]
• [Detail required]
• [Detail required]

Please log in to your account and provide this information at your earliest convenience. Once received, we can finalize your account activation.

If you have any questions or need assistance, our team is here to help.

Best regards,
Vantoris Support`
  },
  {
    title: 'Application Declined',
    category: 'rejection',
    body: `Dear Applicant,

Thank you for your interest in Vantoris. After careful review of your application, we regret to inform you that we are unable to proceed at this time.

This decision was made based on our account opening criteria and risk assessment procedures.

We encourage you to reapply in the future. If you have questions about this decision, please contact our support team.

Best regards,
Vantoris Membership Team`
  }
];

export async function seedResponseTemplates() {
  try {
    // Check if templates already exist
    const existing = await base44.entities.ServiceTemplate.list('-created_date', 1);
    if (existing.length > 0) {
      console.log('Templates already seeded');
      return;
    }

    // Create default templates
    await Promise.all(
      DEFAULT_TEMPLATES.map(template =>
        base44.entities.ServiceTemplate.create(template).catch(e =>
          console.warn(`Failed to create template: ${template.title}`, e)
        )
      )
    );
    console.log('✓ Response templates seeded successfully');
  } catch (error) {
    console.error('Error seeding templates:', error);
  }
}