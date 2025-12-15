import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/api/send-daily-email?preview=true');
}
