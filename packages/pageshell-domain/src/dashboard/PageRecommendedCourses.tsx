/**
 * PageRecommendedCourses (stub)
 *
 * TODO: Implement recommended courses dashboard widget.
 */

export interface RecommendedCourse {
  id: string;
  title: string;
  href: string;
}

export interface PageRecommendedCoursesProps {
  courses?: RecommendedCourse[];
}

export function PageRecommendedCourses(_props: PageRecommendedCoursesProps) {
  return null;
}
