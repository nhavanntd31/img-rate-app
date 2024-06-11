const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');
const { parse } = require('json2csv');

const app = express();
const port = 5000;

// Allow CORS from localhost:3000
app.use(cors({ origin: 'http://localhost:3000' }));

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// Middleware to log request bodies
app.use((req, res, next) => {
  console.log('Request Body:', req.body);
  next();
});

// Helper function to read CSV file and return its contents as an array of objects
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

// Handle POST request to save image data
app.post('/api/save', async (req, res) => {
  const newData = req.body;

  const csvFilePath = path.join(__dirname, 'data.csv');
  let existingData = [];

  // Check if CSV file exists and read its contents
  if (fs.existsSync(csvFilePath)) {
    try {
      existingData = await readCSV(csvFilePath);
    } catch (err) {
      console.error('Error reading CSV file:', err);
      return res.status(500).send('Error reading CSV file');
    }
  }

  // Update existing data with new data or add new entries
  const dataMap = new Map(existingData.map(item => [item.id, item]));

  for (const entry of newData) {
    dataMap.set(entry.id, entry);
  }

  // Convert updated data to CSV format
  const updatedData = Array.from(dataMap.values());
  const csvFields = ['id', 'quality', 'class', 'comment'];
  const csvOptions = { fields: csvFields };
  const csvData = parse(updatedData, csvOptions);

  // Write updated data to CSV file
  fs.writeFile(csvFilePath, csvData, (err) => {
    if (err) {
      console.error('Error writing to CSV file:', err);
      return res.status(500).send('Error writing to CSV file');
    } else {
      console.log('Data saved to CSV file');
      return res.status(200).send('Data saved successfully');
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
