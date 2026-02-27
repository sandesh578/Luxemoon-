'use client';

import React, { useState, useMemo } from 'react';
import { MailOpen, Mail, Trash2, CheckCircle2, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { toggleMessageResolved, deleteMessage } from '../actions';

type Message = {
    id: string;
    name: string;
    email: string | null;
    phone: string;
    subject: string;
    message: string;
    isResolved: boolean;
    createdAt: string;
};

export default function AdminMessagesClient({ initialMessages }: { initialMessages: Message[] }) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('ALL');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    const subjects = ['ALL', 'Order Issue', 'Product Query', 'Collaboration', 'Other'];

    const filteredMessages = useMemo(() => {
        return messages.filter(msg => {
            const matchesSearch =
                msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                msg.phone.includes(searchTerm) ||
                (msg.email && msg.email.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesSubject = subjectFilter === 'ALL' || msg.subject === subjectFilter;
            return matchesSearch && matchesSubject;
        });
    }, [messages, searchTerm, subjectFilter]);

    const handleToggleResolved = async (id: string, currentStatus: boolean, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const res = await toggleMessageResolved(id, !currentStatus);
            if (res.success) {
                setMessages(prev => prev.map(m => m.id === id ? { ...m, isResolved: !currentStatus } : m));
                toast.success(`Message marked as ${!currentStatus ? 'Resolved' : 'Unresolved'}`);
            } else {
                toast.error(res.error || 'Failed to update message');
            }
        } catch {
            toast.error('An error occurred');
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this message?')) return;
        try {
            const res = await deleteMessage(id);
            if (res.success) {
                setMessages(prev => prev.filter(m => m.id !== id));
                if (selectedMessage?.id === id) setSelectedMessage(null);
                toast.success('Message deleted');
            } else {
                toast.error(res.error || 'Failed to delete message');
            }
        } catch {
            toast.error('An error occurred');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="font-serif text-3xl font-bold text-stone-900 tracking-tight">Messages</h2>
                    <p className="text-stone-500 mt-1">Manage customer inquiries and support requests.</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-sm border border-stone-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search by name, email, or phone..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-stone-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 transition-all outline-none"
                    />
                </div>
                <div className="relative md:w-64 shrink-0">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                    <select
                        value={subjectFilter}
                        onChange={e => setSubjectFilter(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-stone-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-amber-500/20 transition-all outline-none appearance-none"
                    >
                        {subjects.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Subjects' : s}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[32px] border border-stone-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-stone-50/50 border-b border-stone-100">
                                <th className="p-5 text-xs font-bold text-stone-500 uppercase tracking-widest w-16 text-center">Status</th>
                                <th className="p-5 text-xs font-bold text-stone-500 uppercase tracking-widest">Customer Details</th>
                                <th className="p-5 text-xs font-bold text-stone-500 uppercase tracking-widest">Subject</th>
                                <th className="p-5 text-xs font-bold text-stone-500 uppercase tracking-widest">Date Received</th>
                                <th className="p-5 text-xs font-bold text-stone-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                            {filteredMessages.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-12 text-center text-stone-400">
                                        No messages found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredMessages.map((msg) => (
                                    <tr
                                        key={msg.id}
                                        onClick={() => setSelectedMessage(msg)}
                                        className={`hover:bg-amber-50/30 transition-colors cursor-pointer group ${!msg.isResolved ? 'bg-white' : 'bg-stone-50/30'}`}
                                    >
                                        <td className="p-5 text-center">
                                            <button
                                                onClick={(e) => handleToggleResolved(msg.id, msg.isResolved, e)}
                                                className={`p-2 rounded-xl transition-colors ${msg.isResolved ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600 hover:bg-amber-200'}`}
                                                title={msg.isResolved ? "Mark as Unresolved" : "Mark as Resolved"}
                                            >
                                                {msg.isResolved ? <CheckCircle2 className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                                            </button>
                                        </td>
                                        <td className="p-5">
                                            <div className="font-bold text-stone-900">{msg.name}</div>
                                            <div className="text-xs text-stone-500 mt-1 flex flex-col gap-0.5">
                                                <span>{msg.phone}</span>
                                                {msg.email && <span>{msg.email}</span>}
                                            </div>
                                        </td>
                                        <td className="p-5">
                                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-stone-100 text-stone-600">
                                                {msg.subject}
                                            </span>
                                        </td>
                                        <td className="p-5">
                                            <div className="text-sm font-medium text-stone-600">
                                                {new Date(msg.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                            <div className="text-xs text-stone-400 mt-1">
                                                {new Date(msg.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </td>
                                        <td className="p-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => handleDelete(msg.id, e)}
                                                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Message View Modal */}
            {selectedMessage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedMessage(null)}>
                    <div className="bg-white rounded-[40px] w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-stone-100 flex items-start justify-between bg-amber-50/50">
                            <div>
                                <h3 className="font-serif text-2xl font-bold text-stone-900 mb-2">{selectedMessage.subject}</h3>
                                <div className="flex items-center gap-4 text-sm text-stone-600">
                                    <span className="font-bold text-stone-800">{selectedMessage.name}</span>
                                    <span>•</span>
                                    <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleResolved(selectedMessage.id, selectedMessage.isResolved)}
                                className={`px-4 py-2 text-xs font-bold rounded-full uppercase tracking-widest flex items-center gap-2 transition-all ${selectedMessage.isResolved ? 'bg-green-100 text-green-700' : 'bg-stone-900 text-white hover:bg-stone-800'}`}
                            >
                                {selectedMessage.isResolved ? (
                                    <><CheckCircle2 className="w-4 h-4" /> Resolved</>
                                ) : (
                                    <><MailOpen className="w-4 h-4" /> Mark Resolved</>
                                )}
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto align-top">
                            <div className="bg-stone-50 p-6 rounded-3xl mb-8 flex flex-col md:flex-row gap-6 justify-between">
                                <div>
                                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Phone Number</div>
                                    <div className="text-sm font-medium text-stone-900">{selectedMessage.phone}</div>
                                </div>
                                {selectedMessage.email && (
                                    <div>
                                        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Email Address</div>
                                        <div className="text-sm font-medium text-stone-900">{selectedMessage.email}</div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-3">Message Content</div>
                                <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                                    {selectedMessage.message}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-stone-100 flex justify-end gap-3 bg-stone-50">
                            <button
                                onClick={() => setSelectedMessage(null)}
                                className="px-6 py-3 bg-white border border-stone-200 text-stone-600 font-bold rounded-2xl hover:bg-stone-50 transition-colors"
                            >
                                Close
                            </button>
                            <a
                                href={`tel:${selectedMessage.phone.replace(/[\s-]/g, '')}`}
                                className="px-6 py-3 bg-[#5C3A21] text-white font-bold rounded-2xl hover:bg-[#462c19] transition-colors flex items-center gap-2"
                            >
                                Call Customer
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
