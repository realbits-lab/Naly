import { redirect } from "next/navigation";

interface HomePageProps {
	params: { locale: string };
}

export default function HomePage({ params }: HomePageProps) {
	redirect(`/${params.locale}/news`);
}