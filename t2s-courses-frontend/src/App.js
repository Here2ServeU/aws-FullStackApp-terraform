import React, { useState, useEffect } from 'react';
import CourseList from './components/CourseList';

function App() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch('http://localhost:4000/api/courses')
      .then((response) => response.json())
      .then((data) => setCourses(data))
      .catch((error) => console.error('Error fetching courses:', error));
  }, []);

  return (
    <div>
      <h1>T2S Courses</h1>
      <CourseList courses={courses} />
    </div>
  );
}

export default App;
