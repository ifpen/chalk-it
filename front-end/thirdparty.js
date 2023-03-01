const fs = require('fs');

const directoryPath = './thirdparty';

list = [];

// Use the fs.readdir method to list all files in the directory
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    console.log('Unable to scan directory: ' + err);
  } else {
    // Print out all the files
    files.forEach((file) => {
      list.push('thirdparty/' + file);
      console.log(file);
    });
  }
});
let jsAll = [];
// Read the contents of jsFiles.json
fs.readFile('./gulpFiles/jsFiles.json', 'utf8', (err, data) => {
  if (err) {
    console.log('Unable to read file: ' + err);
  } else {
    // Parse the JSON data into an object
    const jsFiles = JSON.parse(data);
    jsAll = jsFiles.xDashRuntime.header.concat(jsFiles.xDashRuntime.body, jsFiles.xDashStudio.header, jsFiles.xDashStudio.body);
  }

  // Convert the concatenated array to a Set object to remove duplicates
  const uniqueSet = new Set(jsAll);

  // Convert the Set object back to an array
  const uniqueArray = Array.from(uniqueSet);

  // Use the filter() method to find all file paths that start with "thirdparty"
  const thirdPartyFiles = uniqueArray.filter((filePath) => {
    return filePath.startsWith('thirdparty');
  });
  console.log('Third-party files: ', thirdPartyFiles);

  // Use the filter() method to find all elements of list2 that are not in list1
  const filteredList = list.filter((element) => {
    return !uniqueArray.includes(element);
  });

  console.log('Filtered list: ', filteredList);

});	