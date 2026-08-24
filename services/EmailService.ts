import nodemailer from "nodemailer";
import { createGoogleCalendarUrl } from "@/lib/gcal";
import { formatDateTime } from "@/lib/utils";

function createTransport() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: parseInt(process.env.EMAIL_PORT || "587"),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

function resolveRecipient(realEmail: string): string {
  // Always send to the official email directly in all environments
  return realEmail;
}

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f6f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f6f9; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); border: 1px solid #e5e7eb;">
          <!-- Header -->
          <tr>
            <td style="background-color: #046CB7; padding: 32px 40px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.3px;">Kodewise WorkOS</h1>
              <p style="margin: 4px 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Creative Operations Platform</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px 40px; color: #374151; font-size: 15px; line-height: 1.7;">
              ${body}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 40px; text-align: center;">
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">This is an automated message from Kodewise WorkOS. Do not reply to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string): string {
  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #6b7280; font-weight: 500; font-size: 14px; text-align: left;">${label}</td>
      <td align="right" style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; color: #111827; font-weight: 600; font-size: 14px; text-align: right;">${value}</td>
    </tr>
  `;
}

const TABLE_OPEN = `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 20px; margin: 20px 0; border-collapse: collapse;">`;
const TABLE_CLOSE = `</table>`;

const BTN_STYLE = `display: inline-block; margin-top: 12px; padding: 12px 24px; background-color: #046CB7; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;`;
const BTN_GCAL_STYLE = `display: inline-block; margin-top: 12px; margin-left: 8px; padding: 12px 24px; background-color: #4285F4; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;`;

const BADGE_BLUE = `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background-color: #e0f2fe; color: #046CB7;">`;
const BADGE_GREEN = `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background-color: #d1fae5; color: #065f46;">`;
const BADGE_RED = `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background-color: #fee2e2; color: #991b1b;">`;
const BADGE_YELLOW = `<span style="display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; background-color: #fef3c7; color: #92400e;">`;
const BADGE_CLOSE = `</span>`;

export class EmailService {
  static async send(to: string, subject: string, html: string): Promise<void> {
    try {
      if (!process.env.EMAIL_USER || process.env.EMAIL_USER === "placeholder@gmail.com") {
        console.log("[EmailService] EMAIL_USER not configured — skipping email send.");
        return;
      }
      const transport = createTransport();
      await transport.sendMail({
        from: process.env.EMAIL_FROM || `"Kodewise WorkOS" <${process.env.EMAIL_USER}>`,
        to: resolveRecipient(to),
        subject: `[Kodewise WorkOS] ${subject}`,
        html,
      });
      console.log(`[EmailService] Sent "${subject}" to ${resolveRecipient(to)}`);
    } catch (err) {
      console.error("[EmailService] Failed to send email:", err);
    }
  }

  // ── Work Item ─────────────────────────────────────────────────────────────
  static async sendWorkItemCreated(opts: {
    recipientEmail: string; recipientName: string;
    workNumber: string; title: string; brand: string; priority: string; workItemId: string;
    createdAt?: Date | string | null; estimatedEnd?: Date | string | null; assignorEmail?: string | null;
  }) {
    const gcalUrl = createGoogleCalendarUrl({
      title: `[${opts.workNumber}] ${opts.title}`,
      description: `Work Item ${opts.workNumber} created in ${opts.brand}. Priority: ${opts.priority}.\nView details: ${BASE_URL}/tl/work/${opts.workItemId}`,
      startDate: opts.estimatedEnd ? new Date(opts.estimatedEnd) : new Date(),
      endDate: opts.estimatedEnd ? new Date(opts.estimatedEnd) : null,
      attendees: [opts.recipientEmail, opts.assignorEmail]
    });

    const html = layout("New Work Item Created", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">A new work item has been created and is now in your workspace.</p>
      ${TABLE_OPEN}
        ${row("Work Number", opts.workNumber)}
        ${row("Title", opts.title)}
        ${row("Brand", opts.brand)}
        ${row("Priority", opts.priority)}
        ${row("Created At", formatDateTime(opts.createdAt || new Date()))}
      ${TABLE_CLOSE}
      <div>
        <a href="${BASE_URL}/tl/work/${opts.workItemId}" style="${BTN_STYLE}">View Work Item &rarr;</a>
        <a href="${gcalUrl}" target="_blank" style="${BTN_GCAL_STYLE}"> Add to Google Calendar &rarr;</a>
      </div>
    `);
    await this.send(opts.recipientEmail, `New Work Item: ${opts.workNumber} — ${opts.title}`, html);
  }

  // ── Stage events ──────────────────────────────────────────────────────────
  static async sendStageAssigned(opts: {
    recipientEmail: string; recipientName: string;
    stageName: string; workNumber: string; workTitle: string; workItemId: string;
    createdAt?: Date | string | null; deadline?: Date | string | null; assignorEmail?: string | null;
  }) {
    const gcalUrl = createGoogleCalendarUrl({
      title: `[${opts.workNumber}] ${opts.stageName}`,
      description: `Task "${opts.stageName}" assigned for Work Item ${opts.workNumber} - ${opts.workTitle}.\nView details: ${BASE_URL}/employee/work/${opts.workItemId}`,
      startDate: opts.deadline ? new Date(opts.deadline) : new Date(),
      endDate: opts.deadline ? new Date(opts.deadline) : null,
      attendees: [opts.recipientEmail, opts.assignorEmail]
    });

    const html = layout("Task Assigned to You", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">You have been assigned to a Task. Please review and begin when ready.</p>
      ${TABLE_OPEN}
        ${row("Work Item", `${opts.workNumber} — ${opts.workTitle}`)}
        ${row("Task", opts.stageName)}
        ${row("Created At", formatDateTime(opts.createdAt || new Date()))}
      ${TABLE_CLOSE}
      <div>
        <a href="${BASE_URL}/employee/work/${opts.workItemId}" style="${BTN_STYLE}">Open Work Item &rarr;</a>
        <a href="${gcalUrl}" target="_blank" style="${BTN_GCAL_STYLE}"> Add to Google Calendar &rarr;</a>
      </div>
    `);
    await this.send(opts.recipientEmail, `Task Assigned: ${opts.stageName} (${opts.workNumber})`, html);
  }

  static async sendStageSubmittedToTL(opts: {
    recipientEmail: string; recipientName: string; employeeName: string;
    stageName: string; workNumber: string; workTitle: string; workItemId: string;
  }) {
    const html = layout("Task Submitted — Review Required", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;"><strong>${opts.employeeName}</strong> has submitted a stage for your review.</p>
      ${TABLE_OPEN}
        ${row("Work Item", `${opts.workNumber} — ${opts.workTitle}`)}
        ${row("Task", opts.stageName)}
        ${row("Status", `${BADGE_YELLOW}Awaiting TL Review${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/tl/work/${opts.workItemId}" style="${BTN_STYLE}">Review Now &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Review Required: ${opts.stageName} (${opts.workNumber})`, html);
  }

  static async sendStageSubmittedToCoAssignee(opts: {
    recipientEmail: string; recipientName: string; employeeName: string;
    stageName: string; workNumber: string; workTitle: string; workItemId: string;
  }) {
    const html = layout("Co-worker Task Submitted", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your co-worker <strong>${opts.employeeName}</strong> has completed and submitted their task <strong>${opts.stageName}</strong> for the work item.</p>
      ${TABLE_OPEN}
        ${row("Work Item", `${opts.workNumber} — ${opts.workTitle}`)}
        ${row("Submitted Task", opts.stageName)}
        ${row("Status", `${BADGE_YELLOW}Awaiting TL Review${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/work/${opts.workItemId}" style="${BTN_STYLE}">Open Work Item &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Task Submitted: ${opts.stageName} (${opts.workNumber})`, html);
  }

  static async sendStageApproved(opts: {
    recipientEmail: string; recipientName: string;
    stageName: string; workNumber: string; workItemId: string;
  }) {
    const html = layout("Task Approved", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your submission has been approved by the Team Leader.</p>
      ${TABLE_OPEN}
        ${row("Work Item", opts.workNumber)}
        ${row("Task", opts.stageName)}
        ${row("Status", `${BADGE_GREEN}Approved${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/work/${opts.workItemId}" style="${BTN_STYLE}">View Work Item &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Task Approved: ${opts.stageName} (${opts.workNumber})`, html);
  }

  static async sendStageRejected(opts: {
    recipientEmail: string; recipientName: string;
    stageName: string; workNumber: string; reason: string; workItemId: string;
  }) {
    const html = layout("Task Rejected — Action Required", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your submission has been rejected. Please review the feedback and resubmit.</p>
      ${TABLE_OPEN}
        ${row("Work Item", opts.workNumber)}
        ${row("Task", opts.stageName)}
        ${row("Status", `${BADGE_RED}Rejected${BADGE_CLOSE}`)}
        ${row("Reason", opts.reason)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/work/${opts.workItemId}" style="${BTN_STYLE}">View &amp; Resubmit &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Task Rejected: ${opts.stageName} (${opts.workNumber})`, html);
  }

  static async sendNextStageReady(opts: {
    recipientEmail: string; recipientName: string;
    stageName: string; workNumber: string; workTitle: string; workItemId: string;
    deadline?: Date | string | null;
  }) {
    const gcalUrl = createGoogleCalendarUrl({
      title: `[${opts.workNumber}] ${opts.stageName}`,
      description: `Task "${opts.stageName}" unlocked for Work Item ${opts.workNumber} - ${opts.workTitle}.\nView details: ${BASE_URL}/employee/work/${opts.workItemId}`,
      startDate: opts.deadline ? new Date(opts.deadline) : new Date(),
      endDate: opts.deadline ? new Date(opts.deadline) : null,
      attendees: [opts.recipientEmail]
    });

    const html = layout("Your Next Stage is Ready", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">The previous stage has been completed and your next stage is now unlocked.</p>
      ${TABLE_OPEN}
        ${row("Work Item", `${opts.workNumber} — ${opts.workTitle}`)}
        ${row("Stage", opts.stageName)}
        ${row("Status", `${BADGE_BLUE}Ready${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <div>
        <a href="${BASE_URL}/employee/work/${opts.workItemId}" style="${BTN_STYLE}">Start Working &rarr;</a>
        <a href="${gcalUrl}" target="_blank" style="${BTN_GCAL_STYLE}"> Add to Google Calendar &rarr;</a>
      </div>
    `);
    await this.send(opts.recipientEmail, `Stage Ready: ${opts.stageName} (${opts.workNumber})`, html);
  }

  static async sendClientAccepted(opts: {
    recipientEmail: string; recipientName: string;
    stageName: string; workNumber: string; workItemId: string;
  }) {
    const html = layout("Client Accepted", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Excellent work! The client has accepted the deliverable for your stage.</p>
      ${TABLE_OPEN}
        ${row("Work Item", opts.workNumber)}
        ${row("Stage", opts.stageName)}
        ${row("Status", `${BADGE_GREEN}Client Accepted${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/work/${opts.workItemId}" style="${BTN_STYLE}">View Work Item &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Client Accepted: ${opts.stageName} (${opts.workNumber})`, html);
  }

  // ── Leave events ──────────────────────────────────────────────────────────
  static async sendLeaveRequestSubmitted(opts: {
    tlEmails: string[]; employeeName: string; leaveType: string;
    startDate: string; endDate: string; days: number; reason?: string;
  }) {
    const html = layout("New Leave Request", `
      <p style="margin: 0 0 16px;">Hello Team Leader,</p>
      <p style="margin: 0 0 16px;"><strong>${opts.employeeName}</strong> has submitted a leave request requiring your approval.</p>
      ${TABLE_OPEN}
        ${row("Employee", opts.employeeName)}
        ${row("Type", opts.leaveType)}
        ${row("Duration", `${opts.days} day${opts.days !== 1 ? "s" : ""}`)}
        ${row("From", opts.startDate)}
        ${row("To", opts.endDate)}
        ${opts.reason ? row("Reason", opts.reason) : ""}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/tl/approvals" style="${BTN_STYLE}">Review Request &rarr;</a>
    `);
    for (const email of opts.tlEmails) {
      await this.send(email, `Leave Request: ${opts.employeeName} (${opts.leaveType})`, html);
    }
  }

  static async sendLeaveApproved(opts: {
    recipientEmail: string; recipientName: string; leaveType: string;
    startDate: string; endDate: string; days: number;
  }) {
    const html = layout("Leave Approved", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your leave request has been approved.</p>
      ${TABLE_OPEN}
        ${row("Type", opts.leaveType)}
        ${row("Duration", `${opts.days} day${opts.days !== 1 ? "s" : ""}`)}
        ${row("From", opts.startDate)}
        ${row("To", opts.endDate)}
        ${row("Status", `${BADGE_GREEN}Approved${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/leaves" style="${BTN_STYLE}">View Leave Balance &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Leave Approved: ${opts.leaveType} (${opts.days} day${opts.days !== 1 ? "s" : ""})`, html);
  }

  static async sendLeaveRejected(opts: {
    recipientEmail: string; recipientName: string;
    leaveType: string; startDate: string; endDate: string;
  }) {
    const html = layout("Leave Request Rejected", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your leave request has been rejected. Please contact your Team Leader.</p>
      ${TABLE_OPEN}
        ${row("Type", opts.leaveType)}
        ${row("From", opts.startDate)}
        ${row("To", opts.endDate)}
        ${row("Status", `${BADGE_RED}Rejected${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/leaves" style="${BTN_STYLE}">View Leaves &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Leave Rejected: ${opts.leaveType}`, html);
  }

  static async sendLeaveBalanceUpdated(opts: {
    recipientEmail: string; recipientName: string;
    allowedPaid: number; allowedCasual: number; allowedSick: number;
  }) {
    const html = layout("Leave Balances Updated", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your leave allowances have been updated by your Team Leader.</p>
      ${TABLE_OPEN}
        ${row("Paid Leaves", `${opts.allowedPaid} days`)}
        ${row("Casual Leaves", `${opts.allowedCasual} days`)}
        ${row("Sick Leaves", `${opts.allowedSick} days`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/leaves" style="${BTN_STYLE}">View Leave Balance &rarr;</a>
    `);
    await this.send(opts.recipientEmail, "Your Leave Balances Have Been Updated", html);
  }

  // ── Profile Draft events ──────────────────────────────────────────────────
  static async sendProfileDraftSubmitted(opts: {
    tlEmails: string[]; employeeName: string; changedFields: string[];
  }) {
    const html = layout("Profile Update Request", `
      <p style="margin: 0 0 16px;">Hello Team Leader,</p>
      <p style="margin: 0 0 16px;"><strong>${opts.employeeName}</strong> has submitted a profile update awaiting approval.</p>
      ${TABLE_OPEN}
        ${row("Employee", opts.employeeName)}
        ${row("Fields Changed", opts.changedFields.join(", ") || "Various fields")}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/tl/approvals" style="${BTN_STYLE}">Review Profile Draft &rarr;</a>
    `);
    for (const email of opts.tlEmails) {
      await this.send(email, `Profile Update: ${opts.employeeName}`, html);
    }
  }

  static async sendProfileDraftApproved(opts: { recipientEmail: string; recipientName: string; }) {
    const html = layout("Profile Update Approved", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your profile update has been approved and applied successfully.</p>
      <a href="${BASE_URL}/employee/profile" style="${BTN_STYLE}">View Profile &rarr;</a>
    `);
    await this.send(opts.recipientEmail, "Your Profile Update Has Been Approved", html);
  }

  static async sendProfileDraftRejected(opts: { recipientEmail: string; recipientName: string; }) {
    const html = layout("Profile Update Rejected", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your profile update request has been rejected. Your profile remains unchanged.</p>
      <a href="${BASE_URL}/employee/profile" style="${BTN_STYLE}">View Profile &rarr;</a>
    `);
    await this.send(opts.recipientEmail, "Your Profile Update Was Rejected", html);
  }

  // ── Attendance Request events ─────────────────────────────────────────────
  static async sendAttendanceRequestSubmitted(opts: {
    tlEmails: string[]; employeeName: string;
    type: "CREATE" | "UPDATE"; clockIn: string; clockOut?: string; reason?: string;
  }) {
    const html = layout("Attendance Request", `
      <p style="margin: 0 0 16px;">Hello Team Leader,</p>
      <p style="margin: 0 0 16px;"><strong>${opts.employeeName}</strong> has submitted a manual attendance ${opts.type === "CREATE" ? "creation" : "update"} request.</p>
      ${TABLE_OPEN}
        ${row("Employee", opts.employeeName)}
        ${row("Request Type", opts.type === "CREATE" ? "New Entry" : "Update Existing")}
        ${row("Clock In", opts.clockIn)}
        ${opts.clockOut ? row("Clock Out", opts.clockOut) : ""}
        ${opts.reason ? row("Reason", opts.reason) : ""}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/tl/approvals" style="${BTN_STYLE}">Review Request &rarr;</a>
    `);
    for (const email of opts.tlEmails) {
      await this.send(email, `Attendance Request: ${opts.employeeName}`, html);
    }
  }

  static async sendAttendanceRequestApproved(opts: {
    recipientEmail: string; recipientName: string; clockIn: string; clockOut?: string;
  }) {
    const html = layout("Attendance Request Approved", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your attendance request has been approved and records updated.</p>
      ${TABLE_OPEN}
        ${row("Clock In", opts.clockIn)}
        ${opts.clockOut ? row("Clock Out", opts.clockOut) : ""}
        ${row("Status", `${BADGE_GREEN}Approved${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
    `);
    await this.send(opts.recipientEmail, "Attendance Request Approved", html);
  }

  static async sendAttendanceRequestRejected(opts: {
    recipientEmail: string; recipientName: string; clockIn: string;
  }) {
    const html = layout("Attendance Request Rejected", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your manual attendance request for <strong>${opts.clockIn}</strong> has been rejected.</p>
      <p style="margin: 0 0 16px;">Please contact your Team Leader for more information.</p>
    `);
    await this.send(opts.recipientEmail, "Attendance Request Rejected", html);
  }

  // ── Punctuality Reward ────────────────────────────────────────────────────
  static async sendPunctualityReward(opts: {
    recipientEmail: string; recipientName: string; newPaidBalance: number;
  }) {
    const html = layout("Punctuality Reward Earned!", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Congratulations! You have achieved <strong>20 consecutive punctual working days</strong> (check-in before 10:20 AM IST, excluding weekends and holidays).</p>
      <p style="margin: 0 0 16px;">As a reward, <strong>+1 Paid Leave</strong> has been added to your balance.</p>
      ${TABLE_OPEN}
        ${row("Reward", "+1 Paid Leave")}
        ${row("New Paid Balance", `${opts.newPaidBalance} days`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/leaves" style="${BTN_STYLE}">View Leave Balance &rarr;</a>
    `);
    await this.send(opts.recipientEmail, "Punctuality Reward: +1 Paid Leave Earned!", html);
  }

  // ── Work Item Completed ───────────────────────────────────────────────────
  static async sendWorkItemCompleted(opts: {
    recipientEmail: string; recipientName: string;
    workNumber: string; title: string; brand: string; workItemId: string;
  }) {
    const html = layout("Work Item Completed ✓", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">The work item has been fully completed.</p>
      ${TABLE_OPEN}
        ${row("Work Number", opts.workNumber)}
        ${row("Title", opts.title)}
        ${row("Brand", opts.brand)}
        ${row("Status", `${BADGE_GREEN}Completed${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/tl/work/${opts.workItemId}" style="${BTN_STYLE}">View Details &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Work Item Completed: ${opts.workNumber} — ${opts.title}`, html);
  }

  // ── Stage Started ──────────────────────────────────────────────────────────
  static async sendStageStarted(opts: {
    tlEmails: string[]; employeeName: string; stageName: string;
    workNumber: string; workTitle: string; workItemId: string;
  }) {
    const html = layout("Stage Started", `
      <p style="margin: 0 0 16px;">Hello Team Leader,</p>
      <p style="margin: 0 0 16px;"><strong>${opts.employeeName}</strong> has started working on a stage.</p>
      ${TABLE_OPEN}
        ${row(" Work Item", `${opts.workNumber} — ${opts.workTitle}`+ " ")}
        ${row(" Stage", opts.stageName+ " ")}
        ${row(" Status", `${BADGE_BLUE}In Progress${BADGE_CLOSE}`+ " ")}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/tl/work/${opts.workItemId}" style="${BTN_STYLE}">View Work Item &rarr;</a>
    `);
    for (const email of opts.tlEmails) {
      await this.send(email, `Stage Started: ${opts.stageName} (${opts.workNumber})`, html);
    }
  }

  // ── Stage Completed Directly ──────────────────────────────────────────────
  static async sendStageCompletedDirectly(opts: {
    recipientEmail: string; recipientName: string;
    stageName: string; workNumber: string; workTitle: string; workItemId: string;
  }) {
    const html = layout("Stage Completed ✓", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">The stage has been completed successfully (no approval required).</p>
      ${TABLE_OPEN}
        ${row("Work Item", `${opts.workNumber} — ${opts.workTitle}`)}
        ${row("Stage", opts.stageName)}
        ${row("Status", `${BADGE_GREEN}Completed${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${opts.recipientEmail.includes("studiotrack.local") || opts.recipientEmail.includes("kodewise.local") ? `${BASE_URL}/tl/work/${opts.workItemId}` : `${BASE_URL}/employee/work/${opts.workItemId}`}" style="${BTN_STYLE}">View Work Item &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Stage Completed: ${opts.stageName} (${opts.workNumber})`, html);
  }

  // ── Stage Skipped ─────────────────────────────────────────────────────────
  static async sendStageSkipped(opts: {
    recipientEmail: string; recipientName: string;
    stageName: string; workNumber: string; workItemId: string;
  }) {
    const html = layout("Stage Skipped", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your assigned stage has been skipped by the Team Leader.</p>
      ${TABLE_OPEN}
        ${row("Work Item", opts.workNumber)}
        ${row("Stage", opts.stageName)}
        ${row("Status", `${BADGE_YELLOW}Skipped${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/work/${opts.workItemId}" style="${BTN_STYLE}">View Work Item &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Stage Skipped: ${opts.stageName} (${opts.workNumber})`, html);
  }

  // ── Stage Cancelled ───────────────────────────────────────────────────────
  static async sendStageCancelled(opts: {
    recipientEmail: string; recipientName: string;
    stageName: string; workNumber: string; workItemId: string;
  }) {
    const html = layout("Stage Cancelled", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your assigned stage has been cancelled by the Team Leader.</p>
      ${TABLE_OPEN}
        ${row("Work Item", opts.workNumber)}
        ${row("Stage", opts.stageName)}
        ${row("Status", `${BADGE_RED}Cancelled${BADGE_CLOSE}`)}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/work/${opts.workItemId}" style="${BTN_STYLE}">View Work Item &rarr;</a>
    `);
    await this.send(opts.recipientEmail, `Stage Cancelled: ${opts.stageName} (${opts.workNumber})`, html);
  }

  // ── Work Item Updated ──────────────────────────────────────────────────────
  static async sendWorkItemUpdated(opts: {
    recipientEmail: string; recipientName: string;
    workNumber: string; title: string; changes: string[]; workItemId: string;
    estimatedEnd?: Date | string | null;
  }) {
    const gcalUrl = createGoogleCalendarUrl({
      title: `[${opts.workNumber}] ${opts.title}`,
      description: `Work Item ${opts.workNumber} details updated.\nView details: ${BASE_URL}/tl/work/${opts.workItemId}`,
      startDate: opts.estimatedEnd ? new Date(opts.estimatedEnd) : new Date(),
      endDate: opts.estimatedEnd ? new Date(opts.estimatedEnd) : null,
      attendees: [opts.recipientEmail]
    });

    const html = layout("Work Item Updated", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">The details for work item <strong>${opts.workNumber}</strong> have been updated.</p>
      ${TABLE_OPEN}
        ${row("Work Number", opts.workNumber)}
        ${row("Title", opts.title)}
        ${opts.changes.length > 0 ? row("Updated Fields", opts.changes.join(", ")) : ""}
      ${TABLE_CLOSE}
      <div>
        <a href="${BASE_URL}/tl/work/${opts.workItemId}" style="${BTN_STYLE}">View Work Item &rarr;</a>
        <a href="${gcalUrl}" target="_blank" style="${BTN_GCAL_STYLE}"> Add to Google Calendar &rarr;</a>
      </div>
    `);
    await this.send(opts.recipientEmail, `Work Item Updated: ${opts.workNumber} — ${opts.title}`, html);
  }

  // ── User Profile Updated ───────────────────────────────────────────────────
  static async sendUserProfileUpdated(opts: {
    recipientEmail: string; recipientName: string; updatedFields: string[];
  }) {
    const html = layout("Profile Details Updated", `
      <p style="margin: 0 0 16px;">Hello <strong>${opts.recipientName}</strong>,</p>
      <p style="margin: 0 0 16px;">Your user profile details have been updated by your Team Leader.</p>
      ${TABLE_OPEN}
        ${row("Employee", opts.recipientName)}
        ${opts.updatedFields.length > 0 ? row("Updated Fields", opts.updatedFields.join(", ")) : ""}
      ${TABLE_CLOSE}
      <a href="${BASE_URL}/employee/profile" style="${BTN_STYLE}">View Profile &rarr;</a>
    `);
    await this.send(opts.recipientEmail, "Your Profile Details Have Been Updated", html);
  }

  // ── Password Reset OTP ────────────────────────────────────────────────────
  static async sendPasswordResetOtp(opts: {
    recipientEmail: string;
    recipientName?: string;
    otp: string;
    expiresInMinutes?: number;
  }) {
    const minutes = opts.expiresInMinutes || 10;
    const name = opts.recipientName || "there";

    const html = layout("Password Reset Verification Code", `
      <p style="margin: 0 0 16px;">Hello <strong>${name}</strong>,</p>
      <p style="margin: 0 0 16px;">We received a request to reset your password for your <strong>Kodewise WorkOS</strong> account.</p>
      <p style="margin: 0 0 20px;">Use the 6-digit verification code below to complete the password reset process:</p>
      
      <div style="text-align: center; margin: 28px 0;">
        <div style="display: inline-block; background: linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%); border: 2px dashed #0284c7; border-radius: 12px; padding: 18px 36px;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0369a1;">
            ${opts.otp}
          </span>
        </div>
        <p style="margin: 12px 0 0; color: #64748b; font-size: 13px;">
          ⏳ This verification code will expire in <strong>${minutes} minutes</strong>.
        </p>
      </div>

      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 500;">
          <strong>Security Notice:</strong> If you did not request a password reset, please ignore this email or contact your administrator immediately. Never share this code with anyone.
        </p>
      </div>
    `);

    await this.send(opts.recipientEmail, `Password Reset Verification Code: ${opts.otp}`, html);
  }

  // ── Password Reset Confirmation ───────────────────────────────────────────
  static async sendPasswordResetConfirmation(opts: {
    recipientEmail: string;
    recipientName?: string;
  }) {
    const name = opts.recipientName || "there";

    const html = layout("Password Successfully Changed", `
      <p style="margin: 0 0 16px;">Hello <strong>${name}</strong>,</p>
      <p style="margin: 0 0 16px;">This is a confirmation that your password for <strong>Kodewise WorkOS</strong> has been successfully changed.</p>
      
      <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 24px 0; border-radius: 4px;">
        <p style="margin: 0; color: #166534; font-size: 13px; font-weight: 500;">
          Your account security has been updated. You can now log in using your new credentials.
        </p>
      </div>

      <div>
        <a href="${BASE_URL}/login" style="${BTN_STYLE}">Go to Login &rarr;</a>
      </div>

      <p style="margin: 24px 0 0; color: #64748b; font-size: 13px;">
        If you did not perform this change, please contact your workspace Team Leader immediately to secure your account.
      </p>
    `);

    await this.send(opts.recipientEmail, "Security Alert: Password Successfully Changed", html);
  }
}

