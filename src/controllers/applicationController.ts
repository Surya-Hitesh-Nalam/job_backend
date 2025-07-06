import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// 🟢 POST /api/apply/:jobId
import { sendJobApplicationEmail } from "../utils/email"; // ✅ Add this at the top

export const applyToJob = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const jobId = req.params.jobId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    const alreadyApplied = await prisma.jobApplication.findFirst({
      where: { userId, jobId },
    });

    if (alreadyApplied) {
      return res.status(400).json({ message: "You already applied for this job" });
    }

    const application = await prisma.jobApplication.create({
      data: {
        user: { connect: { id: userId } },
        job: { connect: { id: jobId } },
        resume: user.resume || null,
        status: "Pending",
        currentRound: 1,
      },
    });

    // ✅ Send job application confirmation email
    await sendJobApplicationEmail(user.email, user.username || "User", job.jobTitle, job.companyName);

    return res.status(201).json({ message: "Application submitted", application });
  } catch (error) {
    console.error("❌ Application failed:", error);
    return res.status(500).json({ message: "Failed to apply", error });
  }
};


// 🟢 GET /api/applications
export const getMyApplications = async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;

  try {
    const apps = await prisma.jobApplication.findMany({
      where: { userId },
      include: { job: true },
      orderBy: { appliedAt: "desc" },
    });

    return res.json({ applications: apps });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch applications", error });
  }
};

export const getApplicationsForJob = async (req: Request, res: Response) => {
  const jobId = req.params.jobId;

  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        user: true, // ✅ Includes all user fields
      },
      orderBy: { appliedAt: "desc" },
    });

    return res.json({ jobTitle: job.jobTitle, applications });
  } catch (error) {
    console.error("❌ Error fetching applications:", error);
    return res.status(500).json({ message: "Failed to fetch applications", error });
  }
};

import ExcelJS from "exceljs";


export const exportApplicationsExcel = async (req: Request, res: Response) => {
  const jobId = req.params.jobId;

  try {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) return res.status(404).json({ message: "Job not found" });

    const applications = await prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        user: {
          include: { education: true },
        },
      },
      orderBy: { appliedAt: "desc" },
    });

    const eduLevelsSet = new Set<string>();
    applications.forEach((app) => {
      app.user.education.forEach((edu) => eduLevelsSet.add(edu.educationalLevel));
    });
    const eduLevels = Array.from(eduLevelsSet);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Job Applications");

    const baseColumns = [
      { header: "Name", key: "name", width: 25 },
      { header: "Username", key: "userName", width: 20 },
      { header: "Email", key: "email", width: 30 },
      { header: "Phone", key: "phoneNumber", width: 20 },
      { header: "Resume", key: "resume", width: 40 },
      { header: "City", key: "city", width: 20 },
      { header: "State", key: "state", width: 20 },
      { header: "Country", key: "country", width: 20 },
      { header: "Applied At", key: "appliedAt", width: 25 },
    ];

    const educationColumns = eduLevels.map((level) => ({
      header: `${level} %`,
      key: level.toLowerCase().replace(/[^a-z0-9]/gi, "_"),
      width: 15,
    }));

    worksheet.columns = [...baseColumns, ...educationColumns];

    applications.forEach((app) => {
      const u = app.user;

      const rowData: any = {
        name: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        userName: u.username,
        email: u.email,
        phoneNumber: u.phoneNumber || "N/A",
        resume: u.resume || "N/A",
        city: u.city || "",
        state: u.state || "",
        country: u.country || "",
        appliedAt: app.appliedAt.toLocaleString(),
      };

      eduLevels.forEach((level) => {
        const match = u.education.find((edu) => edu.educationalLevel === level);
        const key = level.toLowerCase().replace(/[^a-z0-9]/gi, "_");
        rowData[key] = match?.percentage ?? "-";
      });

      worksheet.addRow(rowData);
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="applications_${job.jobTitle.replace(/\s+/g, "_")}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("❌ Excel export error:", error);
    return res.status(500).json({ message: "Failed to export Excel", error });
  }
};

