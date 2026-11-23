import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getPrisma } from "@/lib/db";
import { getParticipantView } from "@/lib/participant-view";
import { ParticipantTicket } from "./ParticipantTicket";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Tiket antrean | AntriAja",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ParticipantPage({ params }: PageProps<"/t/[token]">) {
  const { token } = await params;
  const view = await getParticipantView(getPrisma(), token);
  if (!view) notFound();

  // The QR encodes the token only; the gate looks the participant up from it.
  const qrSvg = await QRCode.toString(token, { type: "svg", margin: 4, errorCorrectionLevel: "M" });

  return <ParticipantTicket token={token} initialView={view} qrSvg={qrSvg} />;
}
