import dynamic from 'next/dynamic';

const HomeContent = dynamic(() => import('@/components/HomeContent'));

export default function HomePage() {
  return <HomeContent />;
}
