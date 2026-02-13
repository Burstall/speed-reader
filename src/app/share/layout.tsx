import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Share Article - Speed Reader',
	description: 'Save articles to your Speed Reader reading list',
	alternates: {
		canonical: '/share',
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default function ShareLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
