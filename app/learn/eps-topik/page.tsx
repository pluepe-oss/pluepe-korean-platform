import CourseList from "../_course-list";

export default function EpsTopikPage() {
  return (
    <main className="px-5 pt-6 pb-24">
      <h1 className="text-2xl font-bold">EPS-TOPIK</h1>
      <p className="mt-1 text-sm text-gray-500">한국 고용허가제 대비 강의</p>
      <CourseList type="eps-topik" />
    </main>
  );
}
