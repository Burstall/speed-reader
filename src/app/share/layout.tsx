import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedrdr.com';

export const metadata: Metadata = {
	title: 'Share Article - Speed Reader',
	description: 'Save articles to your Speed Reader reading list',
	alternates: {
		canonical: '/share',
	},
};

export default function ShareLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
