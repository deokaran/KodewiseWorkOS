import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { EmailService } from "./EmailService";
import { sanitizeForClient } from "@/lib/utils";

export class ProfileDraftService {
  static async getDraftByUserId(userId: string) {
    const draft = await prisma.profileDraft.findUnique({
      where: { userId }
    });
    return sanitizeForClient(draft);
  }

  static async submitDraft(userId: string, data: {
    name?: string | null;
    email?: string | null;
    personalEmail?: string | null;
    mobileNumber?: string | null;
    aadhaarNumber?: string | null;
    dob?: Date | null;
    photo?: Buffer | null;
    photoMimeType?: string | null;
    aadhaarPhoto?: Buffer | null;
    aadhaarPhotoMimeType?: string | null;
  }) {
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) throw new AppError("User not found", "NOT_FOUND", 404);

    const draft = await prisma.profileDraft.upsert({
      where: { userId },
      create: {
        userId,
        name: data.name,
        email: data.email,
        personalEmail: data.personalEmail,
        mobileNumber: data.mobileNumber,
        aadhaarNumber: data.aadhaarNumber,
        dob: data.dob,
        photo: data.photo,
        photoMimeType: data.photoMimeType,
        aadhaarPhoto: data.aadhaarPhoto,
        aadhaarPhotoMimeType: data.aadhaarPhotoMimeType,
      },
      update: {
        name: data.name !== undefined ? data.name : undefined,
        email: data.email !== undefined ? data.email : undefined,
        personalEmail: data.personalEmail !== undefined ? data.personalEmail : undefined,
        mobileNumber: data.mobileNumber !== undefined ? data.mobileNumber : undefined,
        aadhaarNumber: data.aadhaarNumber !== undefined ? data.aadhaarNumber : undefined,
        dob: data.dob !== undefined ? data.dob : undefined,
        photo: data.photo !== undefined ? data.photo : undefined,
        photoMimeType: data.photoMimeType !== undefined ? data.photoMimeType : undefined,
        aadhaarPhoto: data.aadhaarPhoto !== undefined ? data.aadhaarPhoto : undefined,
        aadhaarPhotoMimeType: data.aadhaarPhotoMimeType !== undefined ? data.aadhaarPhotoMimeType : undefined,
      }
    });

    // Fire-and-forget email to all TLs
    const [employee, tls] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
      prisma.user.findMany({ where: { role: "TEAM_LEADER", deletedAt: null }, select: { email: true } })
    ]);
    const changedFields: string[] = [];
    if (data.name) changedFields.push("Name");
    if (data.email) changedFields.push("Official Email");
    if (data.personalEmail) changedFields.push("Personal Email");
    if (data.mobileNumber) changedFields.push("Mobile Number");
    if (data.aadhaarNumber) changedFields.push("Aadhaar Number");
    if (data.dob) changedFields.push("Date of Birth");
    if (data.photo) changedFields.push("Profile Photo");
    if (data.aadhaarPhoto) changedFields.push("Aadhaar Document");
    EmailService.sendProfileDraftSubmitted({
      tlEmails: tls.map(t => t.email),
      employeeName: employee?.name ?? "Employee",
      changedFields,
    });

    return draft;
  }

  static async approveDraft(userId: string) {
    const draft = await prisma.profileDraft.findUnique({ where: { userId } });
    if (!draft) throw new AppError("No draft profile found for user", "NOT_FOUND", 404);

    const updateData: any = {};
    if (draft.name !== null) updateData.name = draft.name;
    if (draft.email !== null) updateData.email = draft.email;
    if (draft.personalEmail !== null) updateData.personalEmail = draft.personalEmail;
    if (draft.mobileNumber !== null) updateData.mobileNumber = draft.mobileNumber;
    if (draft.aadhaarNumber !== null) updateData.aadhaarNumber = draft.aadhaarNumber;
    if (draft.dob !== null) updateData.dob = draft.dob;
    if (draft.photo !== null) {
      updateData.photo = draft.photo;
      updateData.photoMimeType = draft.photoMimeType;
    }
    if (draft.aadhaarPhoto !== null) {
      updateData.aadhaarPhoto = draft.aadhaarPhoto;
      updateData.aadhaarPhotoMimeType = draft.aadhaarPhotoMimeType;
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      await tx.profileDraft.delete({ where: { userId } });
      return u;
    });

    // Email the employee (sent on official email)
    if (updatedUser?.email) {
      EmailService.sendProfileDraftApproved({ recipientEmail: updatedUser.email, recipientName: updatedUser.name });
    }

    return updatedUser;
  }

  static async rejectDraft(userId: string) {
    const draft = await prisma.profileDraft.findUnique({ where: { userId } });
    if (!draft) throw new AppError("No draft profile found for user", "NOT_FOUND", 404);

    await prisma.profileDraft.delete({ where: { userId } });

    // Email the employee (sent on official email)
    const emp2 = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
    if (emp2 != null && emp2.email) {
      EmailService.sendProfileDraftRejected({ recipientEmail: emp2.email, recipientName: emp2.name });
    }
  }

  static async listPendingDrafts() {
    const drafts = await prisma.profileDraft.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            personalEmail: true,
            mobileNumber: true,
            aadhaarNumber: true,
            dob: true,
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return sanitizeForClient(drafts);
  }
}
