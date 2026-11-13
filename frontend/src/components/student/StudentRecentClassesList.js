import React from 'react';
import RecentClassesList from '../ui/common/RecentClassesList';

export default function StudentRecentClassesList({ recentClasses = [], onViewAll }) {
  return (
    <RecentClassesList
      role="student"
      recentClasses={recentClasses}
      onViewAll={onViewAll}
    />
  );
}

