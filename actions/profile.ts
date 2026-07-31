"use server";

import { requireAuth, requireRole } from "@/lib/auth/utils";
import { ProfileDraftService } from "@/services/ProfileDraftService";
import { revalidatePath } from "next/cache";

export async function submitProfileDraftAction(data: {
  name?: string;
  email?: string;
  personalEmail?: string;
  mobileNumber?: string;
  aadhaarNumber?: string;
  dob?: string;
  photoBase64?: string;
  photoMimeType?: string;
  aadhaarPhotoBase64?: string;
  aadhaarPhotoMimeType?: string;
}) {
  try {
    const authUser = await requireAuth();

    let photoBuffer: Buffer | undefined = undefined;
    if (data.photoBase64) {
      photoBuffer = Buffer.from(data.photoBase64, "base64");
    }

    let aadhaarPhotoBuffer: Buffer | undefined = undefined;
    if (data.aadhaarPhotoBase64) {
      aadhaarPhotoBuffer = Buffer.from(data.aadhaarPhotoBase64, "base64");
    }

    const dob = data.dob ? new Date(data.dob) : undefined;

    await ProfileDraftService.submitDraft(authUser.id, {
      name: data.name,
      email: data.email,
      personalEmail: data.personalEmail,
      mobileNumber: data.mobileNumber,
      aadhaarNumber: data.aadhaarNumber,
      dob,
      photo: photoBuffer,
      photoMimeType: data.photoMimeType,
      aadhaarPhoto: aadhaarPhotoBuffer,
      aadhaarPhotoMimeType: data.aadhaarPhotoMimeType,
    });

    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");

    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to submit profile draft" };
  }
}

export async function approveProfileDraftAction(userId: string) {
  try {
    await requireRole("TEAM_LEADER");
    await ProfileDraftService.approveDraft(userId);
    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");
    revalidatePath("/tl/team");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to approve profile draft" };
  }
}

export async function rejectProfileDraftAction(userId: string) {
  try {
    await requireRole("TEAM_LEADER");
    await ProfileDraftService.rejectDraft(userId);
    revalidatePath("/employee/profile");
    revalidatePath("/tl/approvals");
    return { success: true as const };
  } catch (error: any) {
    return { success: false as const, error: error.message || "Failed to reject profile draft" };
  }
}
