import { prisma } from "./prisma";

export async function checkAndCompleteUploadSession(sessionId: string) {
  const session = await prisma.uploadSession.findUnique({
    where: { id: sessionId },
    select: {
      totalFiles: true,
      processedFiles: true,
      status: true,
    },
  });

  if (!session) return;

  if (
    session.processedFiles === session.totalFiles &&
    session.status === "PROCESSING"
  ) {
    await prisma.uploadSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });
  }
}

export async function getUploadSessionProgress(sessionId: string) {
  const session = await prisma.uploadSession.findUnique({
    where: { id: sessionId },
    select: {
      totalFiles: true,
      processedFiles: true,
      status: true,
    },
  });

  if (!session) return null;

  return {
    total: session.totalFiles,
    processed: session.processedFiles,
    status: session.status,
    progress: Math.round((session.processedFiles / session.totalFiles) * 100),
  };
}
