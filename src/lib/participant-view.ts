import type { PrismaClient } from "@/generated/prisma/client";
import type { CounterStatus, TicketStatus } from "@/generated/prisma/enums";

/** What a participant may see about themselves. Never includes the phone number. */
export type ParticipantView = {
  eventName: string;
  participantName: string;
  ticket: {
    number: string;
    previousNumber: string | null;
    status: TicketStatus;
    counter: { code: string; name: string; status: CounterStatus };
    /** People before this ticket in its counter's line; null unless the ticket is waiting. */
    ahead: number | null;
  } | null;
};

const MAX_TOKEN_LENGTH = 128;

export function formatNumber(counterCode: string, number: number): string {
  return `${counterCode}${number}`;
}

export async function getParticipantView(db: PrismaClient, token: string): Promise<ParticipantView | null> {
  if (!token || token.length > MAX_TOKEN_LENGTH) return null;

  const participant = await db.participant.findUnique({
    where: { token },
    select: {
      name: true,
      event: { select: { name: true } },
      ticket: {
        select: {
          number: true,
          previousNumber: true,
          status: true,
          queueOrder: true,
          counterId: true,
          counter: { select: { code: true, name: true, status: true } },
        },
      },
    },
  });
  if (!participant) return null;

  const { ticket } = participant;
  let ahead: number | null = null;
  if (ticket?.status === "waiting") {
    ahead = await db.ticket.count({
      where: { counterId: ticket.counterId, status: "waiting", queueOrder: { lt: ticket.queueOrder } },
    });
  }

  return {
    eventName: participant.event.name,
    participantName: participant.name,
    ticket: ticket && {
      number: formatNumber(ticket.counter.code, ticket.number),
      previousNumber: ticket.previousNumber,
      status: ticket.status,
      counter: ticket.counter,
      ahead,
    },
  };
}
