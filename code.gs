function doGet(e) {
  var sh = SpreadsheetApp.openById('1lZ7oRBaWTRQEDlUu2MWo_9igRTGQ66QXQP5a8XcWKA8').getSheets()[0],       
      data = sh.getDataRange().getValues(),       
      lastColumn = sh.getLastColumn(), 
      keys = sh.getRange(1, 1, 1, lastColumn).getValues()[0], 
      meta = getMeta(data), 
      objects = getObjects(data, keys, e), 
      response = {posts: objects, meta: meta}; 
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

function getObjects(data, keys, e) { 
  var objects = [], 
      len = keys.length, 
      dataLength = data.length,
      i = dataLength - 1, 
      n = 0, 
      offset = +e.parameters.offset, 
      limit = +e.parameters.limit, 
      tmp;
  if (offset) {
    tmp = dataLength - (offset + 1);
    if (tmp > 0) {
      i = tmp;
    }
  }
  if (limit) {
    tmp = i - limit;
    if (tmp > 0) {
      n = tmp;
    }
  }  
  while (i > n) {
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
  obj.tags = getTags(obj.tags);
  return obj;
}

function getTags(string) {
  return string.split(',').map(function(tag) {
    return tag.replace(/^\s+|\s+$/g, '');
  });
}

function getMeta(data, objects) {  
  var meta = {tags: {}, archives: {}, total: data.length - 1}, 
      tagsIndex = data[0].indexOf('tags'), 
      createdIndex = data[0].indexOf('created'), 
      month;
  for (var i = 1, len = data.length; i < len; i += 1) {   
    getTags(data[i][tagsIndex]).forEach(function(tag) {
      if (tag !== '' ) {
        if (meta.tags.hasOwnProperty(tag)) {
          meta.tags[tag] += 1;
        } else {
          meta.tags[tag] = 1;
        }
      }      
    });
    month = data[i][createdIndex].getFullYear() + '/' + data[i][createdIndex].getMonth();
    if (meta.archives.hasOwnProperty(month)) {
      meta.archives[month] += 1;
    } else {
      meta.archives[month] = 1;
    }
  }  
  return meta;
}