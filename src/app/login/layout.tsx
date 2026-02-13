import { Metadata } from 'next';

export const metadata: Metadata = {
	title: 'Login - Speed Reader',
	description: 'Login to access premium Speed Reader features',
	alternates: {
		canonical: '/login',
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default function LoginLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
