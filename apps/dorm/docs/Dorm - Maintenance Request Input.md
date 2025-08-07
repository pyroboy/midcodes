```import React, { useState } from 'react';

const MaintenanceRequestForm = () => {
  const [formData, setFormData] = useState({
    issue: '',
    description: '',
    urgency: 'normal',
    contactNumber: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log('Form submitted:', formData);
    // Reset form
    setFormData({
      issue: '',
      description: '',
      urgency: 'normal',
      contactNumber: ''
    });
    alert('Maintenance request submitted successfully!');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Maintenance Request</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">
            What's the issue? *
            <input
              type="text"
              name="issue"
              value={formData.issue}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              placeholder="e.g., Leaking faucet"
            />
          </label>
        </div>

        <div>
          <label className="block mb-1">
            Description *
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
              rows="3"
              placeholder="Please describe the problem"
            />
          </label>
        </div>

        <div>
          <label className="block mb-1">
            How urgent is this? *
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="normal">Not Urgent</option>
              <option value="important">Somewhat Urgent</option>
              <option value="emergency">Emergency</option>
            </select>
          </label>
        </div>

        <div>
          <label className="block mb-1">
            Contact Number
            <input
              type="tel"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Your phone number"
            />
          </label>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          Submit Request
        </button>
      </form>
    </div>
  );
};

export default MaintenanceRequestForm;
```
