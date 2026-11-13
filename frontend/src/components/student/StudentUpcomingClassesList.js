import React from 'react';
import UpcomingClassesList from '../ui/common/UpcomingClassesList';

export default function StudentUpcomingClassesList({ classes = [], nextClass = null, onPressClass }) {
  return (
    <UpcomingClassesList
      role="student"
      classes={classes}
      nextClass={nextClass}
      onPressClass={onPressClass}
    />
  );
}

