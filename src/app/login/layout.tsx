import { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://speedrdr.com';

export const metadata: Metadata = {
	title: 'Login - Speed Reader',
	description: 'Login to access premium Speed Reader features',
	alternates: {
		canonical: '/login',
	},
};

export default function LoginLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
