import { Metadata } from 'next';

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
