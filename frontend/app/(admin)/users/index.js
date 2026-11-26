import React, { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export default function UsersIndexRedirect() {
  const params = useLocalSearchParams();

  useEffect(() => {
    const target = params?.group === 'students' ? '/users/students' : '/users/teachers';
    if (params?.courseFilter) {
      router.replace({ pathname: target, params: { courseFilter: params.courseFilter } });
    } else {
      router.replace(target);
    }
  }, [params?.group, params?.courseFilter]);

  return null;
}
