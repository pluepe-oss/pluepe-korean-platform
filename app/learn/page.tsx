import Link from "next/link";

const COURSES = [
  { slug: "topik1",    title: "TOPIK 1",   desc: "초급 (1~2급)" },
  { slug: "topik2",    title: "TOPIK 2",   desc: "중·고급 (3~6급)" },
  { slug: "eps-topik", title: "EPS-TOPIK", desc: "한국 고용허가제" },
];

export default function LearnPage() {
  return (
    <main className="px-5 pt-6 pb-24">
      <h1 className="text-2xl font-bold">강의</h1>
      <p className="mt-1 text-sm text-gray-500">과정을 선택해 학습을 시작하세요.</p>

      <ul className="mt-6 space-y-3">
        {COURSES.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/learn/${c.slug}`}
              className="block p-5 rounded-xl border border-gray-200 bg-white active:bg-gray-50"
            >
              <div className="text-lg font-semibold text-gray-900">{c.title}</div>
              <div className="mt-1 text-sm text-gray-500">{c.desc}</div>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
