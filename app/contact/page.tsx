import type { Metadata } from 'next';
import { getSiteConfig } from '@/lib/settings';
import ContactClient from './ContactClient';

export const metadata: Metadata = {
  title: 'Contact Us | Luxe Moon',
  description: 'Connect with Luxe Moon Nepal. We’re here to help you shine with our premium Korean hair care products.',
};

export default async function ContactPage() {
  const config = await getSiteConfig();

  const formattedConfig = {
    contactPhone: config.contactPhone,
    contactEmail: config.contactEmail,
    contactAddress: config.contactAddress,
    whatsappNumber: config.whatsappNumber
  };

  return <ContactClient config={formattedConfig} />;
}