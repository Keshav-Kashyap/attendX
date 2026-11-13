/**
 * Helper to normalize course list for DropdownField
 */
export function buildCourseOptions(courses = []) {
  return (courses || []).map((c) => ({
    value: c.id,
    label: `${c.code} - ${c.name}`,
    subLabel: `${c.total_semesters || 0} Semesters - ${c.enrolled_students_count ?? 0} Students`,
    course: c,
  }));
}

/**
 * Helper to normalize semester list for DropdownField
 */
export function buildSemesterOptions(courseId, fetchedSemesters = [], selectedCourse = null) {
  if (!courseId) return [];

  if (Array.isArray(fetchedSemesters) && fetchedSemesters.length > 0) {
    return fetchedSemesters.map((sem) => {
      const semNum = sem.semester_number || 1;
      const label = `Semester ${semNum}`;
      return {
        value: label,
        label,
        subLabel: `${sem.subjects_count ?? 0} Subjects - ${sem.students_count ?? 0} Students`,
        semesterId: sem.created_at ? sem.id : null,
        semesterNumber: semNum,
      };
    });
  }

  const total = selectedCourse?.total_semesters || 1;
  return Array.from({ length: total }, (_, idx) => {
    const semNum = idx + 1;
    const label = `Semester ${semNum}`;
    return {
      value: label,
      label,
      subLabel: '',
      semesterId: null,
      semesterNumber: semNum,
    };
  });
}

