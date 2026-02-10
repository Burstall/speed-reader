import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedrdr.com';

export const metadata: Metadata = {
	title: 'Receive Credentials - Speed Reader',
	description: 'Receive authentication credentials from browser extension',
	alternates: {
		canonical: '/auth/receive',
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default function AuthReceiveLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
