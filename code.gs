function doGet(e) {
  var sh = SpreadsheetApp.openById('1lZ7oRBaWTRQEDlUu2MWo_9igRTGQ66QXQP5a8XcWKA8').getSheets()[0],       
      data = sh.getDataRange().getValues(),       
      lastColumn = sh.getLastColumn(), 
      keys = sh.getRange(1, 1, 1, lastColumn).getValues()[0], 
      objects = getObjects(data, keys), 
      response = {posts: objects, tags: getTags(objects)};
  return ContentService.createTextOutput(JSON.stringify(response)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sh = SpreadsheetApp.openById('1lZ7oRBaWTRQEDlUu2MWo_9igRTGQ66QXQP5a8XcWKA8').getSheets()[0], 
      lastRow = sh.getLastRow(), 
      data = JSON.parse(e.postData.contents), 
      rowIndex, columnIndex, width, values, res = {};  
  if (Array.isArray(data.tags)) {
    data.tags = data.tags.join(',');
  }
  values = [lastRow, new Date(), new Date(), data.title || '', data.author || '', data.href || '', data.tags || '', data.excerpt || '', data.body || ''];
  if (data.id) {    
    rowIndex = +data.id + 1;
    columnIndex = 3;
    width = 7;
    values.splice(0, 2);
    res.id = data.id;
  } else {
    rowIndex = lastRow + 1;
    columnIndex = 1;
    width = 9;
    res.id = lastRow;
  } 
  sh.getRange(rowIndex, columnIndex, 1, width).setValues([values]);
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function getObjects(data, keys) {
  var objects = [], i = data.length - 1, len = keys.length;
  while (i > 0) {
    objects.push(getObject(data[i], keys, len));
    i -= 1;
  }
  return objects;
}

function getObject(arr, keys, len) {
  var obj = {};
  for (var i = 0; i < len; i += 1) {
    obj[keys[i]] = arr[i];
  }
  obj.tags = obj.tags.split(',').map(function(tag) {
    return tag.replace(/^\s+|\s+$/g, '');
  });
  return obj;
}

function getTags(objects) {
  var tags = {};
  objects.forEach(function(obj) {   
    obj.tags.forEach(function(tag) {
      if (tags.hasOwnProperty(tag)) {
        tags[tag] += 1;
      } else {
        tags[tag] = 1;
      }
    });
  });
  return tags;
}