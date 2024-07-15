// src/components/Accordion.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import Item from './Item';

const Accordion = ({ backgroundColor }) => {
  const [activeIndex, setActiveIndex] = useState(null);
  const [personas, setPersonas] = useState([]);

  useEffect(() => {
    axiosInstance.get('/get-all-personas')
      .then(response => {
        setPersonas(response.data);
      })
      .catch(error => {
        console.error('Error fetching personas:', error);
      });
  }, []);

  const handleToggle = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div id="accordion-wrapper" className="flex flex-col gap-0 max-w-[800px] w-full mx-auto rounded-xl border border-gray-200 divide-y overflow-hidden">
      {personas.map((persona, i) => (
        <Item
          key={i}
          answerID={`answer-${i + 1}`}
          questionID={`question-${i + 1}`}
          isActive={activeIndex === i}
          onClick={() => handleToggle(i)}
          question={persona.role}
          persona={persona.role}
          ariaExpanded={activeIndex === i ? true : false}
          backgroundColor={backgroundColor}
        />
      ))}
    </div>
  );
};

export default Accordion;
