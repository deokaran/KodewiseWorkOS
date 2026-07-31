import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <h2 className="text-2xl font-bold text-gray-900">404 - Page Not Found</h2>
      <p className="text-gray-500">The requested resource could not be found.</p>
      <Link href="/" className="mt-4 text-indigo-600 hover:underline">
        Go Home
      </Link>
    </div>
  );
}
