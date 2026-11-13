import React from 'react';
import NextClassCard from '../ui/common/NextClassCard';

export default function StudentNextClassCard({ nextClass, onPressSyllabus, isLoading = false }) {
  return (
    <NextClassCard
      nextClass={nextClass}
      role="student"
      isLoading={isLoading}
      onPressSyllabus={onPressSyllabus}
    />
  );
}

