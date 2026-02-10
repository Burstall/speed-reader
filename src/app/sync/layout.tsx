import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedrdr.com';

export const metadata: Metadata = {
	title: 'Sync Settings - Speed Reader',
	description: 'Sync your Speed Reader settings across devices',
	alternates: {
		canonical: '/sync',
	},
};

export default function SyncLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
