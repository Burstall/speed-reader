import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Sync Settings - Speed Reader',
	description: 'Sync your Speed Reader settings across devices',
	alternates: {
		canonical: '/sync',
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default function SyncLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
