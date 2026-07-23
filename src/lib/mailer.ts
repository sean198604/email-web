import nodemailer from "nodemailer";
import type { Account } from "@/generated/prisma/client";

export interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendEmail(
  account: Account,
  to: string,
  subject: string,
  html: string,
  text?: string,
  replyTo?: string,
  attachments?: { filename: string; path?: string; content?: Buffer }[]
): Promise<SendResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: {
        user: account.authUser,
        pass: account.authPass,
      },
      connectionTimeout: 30000,
      greetingTimeout: 10000,
      socketTimeout: 30000,
    });

    const mailOptions: nodemailer.SendMailOptions = {
      from: `"${account.name}" <${account.email}>`,
      to,
      subject,
      html,
      text,
      ...(replyTo || account.replyTo
        ? { replyTo: replyTo || account.replyTo! }
        : {}),
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

export async function testConnection(
  account: Omit<
    Account,
    "id" | "createdAt" | "updatedAt" | "dailyLimit" | "hourlyLimit" | "sendInterval" | "weight" | "todaySent" | "todaySentDate"
  >
): Promise<SendResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: account.host,
      port: account.port,
      secure: account.secure,
      auth: {
        user: account.authUser,
        pass: account.authPass,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });

    await transporter.verify();
    return { success: true };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
