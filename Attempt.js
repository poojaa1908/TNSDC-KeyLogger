// src/components/ChecklistManager.js
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

const ChecklistManager = () => {
  const [personas, setPersonas] = useState(['manager', 'developer', 'code_reviewer']); // Add more personas as needed
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [checklists, setChecklists] = useState([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');

  useEffect(() => {
    if (selectedPersona) {
      axiosInstance.get(`/get-all-checklists/${selectedPersona}`)
        .then(response => {
          setChecklists(response.data.checklist);
        })
        .catch(error => {
          console.error('Error fetching checklists:', error);
        });
    }
  }, [selectedPersona]);

  const handleAddChecklistItem = () => {
    axiosInstance.post(`/insert-checklist/${selectedPersona}`, { item: newChecklistItem })
      .then(response => {
        setChecklists([...checklists, newChecklistItem]);
        setNewChecklistItem('');
      })
      .catch(error => {
        console.error('Error adding checklist item:', error);
      });
  };

  const handleUpdateChecklist = () => {
    axiosInstance.put(`/update-checklist/${selectedPersona}`, { checklist: checklists })
      .then(response => {
        console.log('Checklist updated successfully');
      })
      .catch(error => {
        console.error('Error updating checklist:', error);
      });
  };

  const handleDeleteChecklistItem = (index) => {
    const updatedChecklists = checklists.filter((item, i) => i !== index);
    setChecklists(updatedChecklists);
  };

  const handleEditChecklistItem = (index, newValue) => {
    const updatedChecklists = checklists.map((item, i) => i === index ? newValue : item);
    setChecklists(updatedChecklists);
  };

  return (
    <div>
      {personas.map(persona => (
        <div key={persona}>
          <button onClick={() => setSelectedPersona(persona)}>
            {persona}
          </button>
        </div>
      ))}
      {selectedPersona && (
        <div>
          <h2>{selectedPersona} Checklist</h2>
          <ul>
            {checklists.map((item, index) => (
              <li key={index}>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => handleEditChecklistItem(index, e.target.value)}
                />
                <button onClick={() => handleDeleteChecklistItem(index)}>Delete</button>
              </li>
            ))}
          </ul>
          <input
            type="text"
            value={newChecklistItem}
            onChange={(e) => setNewChecklistItem(e.target.value)}
            placeholder="New checklist item"
          />
          <button onClick={handleAddChecklistItem}>Add</button>
          <button onClick={handleUpdateChecklist}>Submit</button>
        </div>
      )}
    </div>
  );
};

export default ChecklistManager;
