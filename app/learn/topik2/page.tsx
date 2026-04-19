import CourseList from "../_course-list";

export default function Topik2Page() {
  return (
    <main className="px-5 pt-6 pb-24">
      <h1 className="text-2xl font-bold">TOPIK 2</h1>
      <p className="mt-1 text-sm text-gray-500">중·고급 한국어 강의 (3~6급)</p>
      <CourseList type="topik2" />
    </main>
  );
}
