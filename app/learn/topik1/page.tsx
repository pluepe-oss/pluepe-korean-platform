import CourseList from "../_course-list";

export default function Topik1Page() {
  return (
    <main className="px-5 pt-6 pb-24">
      <h1 className="text-2xl font-bold">TOPIK 1</h1>
      <p className="mt-1 text-sm text-gray-500">초급 한국어 강의 (1~2급)</p>
      <CourseList type="topik1" />
    </main>
  );
}
