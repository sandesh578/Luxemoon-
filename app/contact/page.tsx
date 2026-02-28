import type { Metadata } from 'next';
import { getSiteConfig } from '@/lib/settings';
import ContactClient from './ContactClient';
import { getLocaleServer } from '@/lib/i18n-server';

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocaleServer();
  if (locale === 'ne') {
    return {
      title: '??????? | Luxe Moon',
      description: 'Luxe Moon Nepal ??? ??????? ?????????? ?????? ???????? ?????? ???????? ???????? ??????? ???? ???? ???? ????',
    };
  }

  return {
    title: 'Contact Us | Luxe Moon',
    description: 'Connect with Luxe Moon Nepal. We are here to help you shine with our premium Korean hair care products.',
  };
}

export default async function ContactPage() {
  const config = await getSiteConfig();

  const formattedConfig = {
    contactPhone: config.contactPhone,
    contactEmail: config.contactEmail,
    contactAddress: config.contactAddress,
    whatsappNumber: config.whatsappNumber,
  };

  return <ContactClient config={formattedConfig} />;
}
