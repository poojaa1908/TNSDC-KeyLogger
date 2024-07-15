// src/components/Item.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const Item = ({
  answerID,
  questionID,
  question,
  persona,
  isActive,
  onClick,
  ariaExpanded,
  backgroundColor = "bg-blue-200"
}) => {
  const [newPoint, setNewPoint] = useState("");
  const [checklistItems, setChecklistItems] = useState([]);

  useEffect(() => {
    if (isActive && persona) {
      axiosInstance.get(`/get-all-checklists/${persona}`)
        .then(response => {
          setChecklistItems(response.data.checklist);
        })
        .catch(error => {
          console.error('Error fetching checklists:', error);
        });
    }
  }, [isActive, persona]);

  const handleAdd = () => {
    if (newPoint.trim()) {
      axiosInstance.post(`/insert-checklist/${persona}`, { item: newPoint })
        .then(response => {
          setChecklistItems([...checklistItems, newPoint]);
          setNewPoint("");
        })
        .catch(error => {
          console.error('Error adding checklist item:', error);
        });
    }
  };

  const handleEdit = (index) => {
    const editedPoint = prompt("Edit point:", checklistItems[index]);
    if (editedPoint) {
      const updatedChecklist = checklistItems.map((item, i) => i === index ? editedPoint : item);
      setChecklistItems(updatedChecklist);

      axiosInstance.put(`/update-checklist/${persona}`, { checklist: updatedChecklist })
        .then(response => {
          console.log('Checklist updated successfully');
        })
        .catch(error => {
          console.error('Error updating checklist:', error);
        });
    }
  };

  const handleDelete = (index) => {
    const updatedChecklist = checklistItems.filter((_, i) => i !== index);
    setChecklistItems(updatedChecklist);

    axiosInstance.put(`/update-checklist/${persona}`, { checklist: updatedChecklist })
      .then(response => {
        console.log('Checklist updated successfully');
      })
      .catch(error => {
        console.error('Error updating checklist:', error);
      });
  };

  return (
    <div className="item overflow-hidden">
      <div className="text-gray-dark font-medium overflow-hidden">
        <button
          type="button"
          role="button"
          id={questionID}
          className={`w-full flex gap-4 items-center justify-between p-5 transition-colors duration-100 ease-in focus:ring-4 focus:ring-gray-200 hover:${backgroundColor ? backgroundColor : "bg-blue-200"} ${
            isActive ? backgroundColor : ""
          }`}
          onClick={onClick}
          aria-expanded={ariaExpanded}
          aria-controls={answerID}
        >
          <h2 className="text-left text-xl">{question}</h2>
          <span className="sr-only">{isActive ? "Hide" : "Show"}</span>
          <svg
            data-accordion-icon
            className={`w-3 h-3 shrink-0 transition-transform duration-300 ease-in-out ${isActive ? "rotate-180" : "rotate-0"}`}
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 10 6"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5 5 1 1 5"
            />
          </svg>
        </button>
      </div>
      <div
        id={answerID}
        aria-labelledby={questionID}
        className={`transition-all duration-[600ms] ease-in-out ${
          isActive ? "max-h-[300px] opacity-100" : "max-h-[0px] opacity-0"
        }`}
      >
        <div className="p-5 space-y-2">
          {checklistItems.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <p className="text-gray-500">{item}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(index)}
                  className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:underline"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(index)}
                  className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 mt-4">
            <textarea
              className="border border-gray-300 rounded p-2 w-full resize-none"
              rows="2"
              placeholder="Add new point"
              value={newPoint}
              onChange={(e) => setNewPoint(e.target.value)}
            />
            <button
              onClick={handleAdd}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-opacity-50"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Item;
