import { prisma } from '@/lib/prisma';
import AdminMessagesClient from './AdminMessagesClient';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage() {

    const messages = await prisma.contactMessage.findMany({
        orderBy: { createdAt: 'desc' }
    });

    // Serialize dates for Client Component
    const formattedMessages = messages.map(msg => ({
        ...msg,
        createdAt: msg.createdAt.toISOString()
    }));

    return <AdminMessagesClient initialMessages={formattedMessages} />;
}
