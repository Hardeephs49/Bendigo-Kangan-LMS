import React, { useState } from "react";

const AddContentAssignment = () => {
  const [assignments, setAssignments] = useState([
    { title: "", description: "", file: null },
  ]);

  const handleChange = (index, field, value) => {
    const updated = [...assignments];
    updated[index][field] = value;

    if (field === "file") {
      updated[index].title = "";
      updated[index].description = "";
    } else {
      updated[index].file = null;
    }

    setAssignments(updated);
  };

  const handleAdd = () => {
    setAssignments([...assignments, { title: "", description: "", file: null }]);
  };

  const isFilled = (item) =>
    (item.title.trim() && item.description.trim()) || item.file;

  const lastFilled = isFilled(assignments[assignments.length - 1]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const validEntries = assignments.filter(isFilled);

    if (validEntries.length === 0) {
      alert("Please fill in at least one assignment.");
      return;
    }

    console.log("Submitted Assignments:", validEntries);
    alert("Assignments submitted successfully!");
    // You can send `validEntries` to your API here

    // Reset form
    setAssignments([{ title: "", description: "", file: null }]);
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-gray-100 p-8 bg-cover"  style={{ backgroundImage: "url('src/images/assignment.jpg')"}}>
      <h2 className="text-3xl font-bold text-center mb-10">Add Content Assignments</h2>

      <div className="max-w-4xl mx-auto space-y-8">
        {assignments.map((item, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => handleChange(index, "title", e.target.value)}
                disabled={item.file}
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows="3"
                value={item.description}
                onChange={(e) => handleChange(index, "description", e.target.value)}
                disabled={item.file}
                className="mt-1 p-2 w-full border rounded-md"
              />
            </div>

            <div className="text-gray-500 text-center">OR</div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Attach File</label>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.zip"
                onChange={(e) => handleChange(index, "file", e.target.files[0])}
                disabled={item.title || item.description}
                className="mt-1 p-2 w-full border rounded-md"
              />
              {item.file && (
                <p className="text-sm text-green-600 mt-1">Selected: {item.file.name}</p>
              )}
            </div>
          </div>
        ))}

        {lastFilled && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleAdd}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              Add Another
            </button>
          </div>
        )}

        <div className="text-center mt-8">
          <button
            type="submit"
            className="px-8 py-3 bg-blue-600 text-white text-lg font-semibold rounded-md hover:bg-blue-700 transition"
          >
            Submit
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddContentAssignment;
